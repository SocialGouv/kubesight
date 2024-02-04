import { $ } from "execa"
import _ from "lodash"
import pMap from "p-map"
import { z } from "zod"

import {
  CachedData,
  Cluster,
  clusterSchema,
  Cronjob,
  Deployment,
  DumpFile,
  getAppLabel,
  KubeData,
  Namespace,
  RawCluster,
  RawCronjob,
  RawDeployment,
  RawEvent,
  RawJob,
  RawPod,
  RawReplicaSet,
} from "@/lib/kube/types"
import { grepS3BucketFiles } from "@/lib/s3"
import { localKubeCache } from "../node-kube"

declare global {
  var cachedData: CachedData<KubeData>
}

export function getCachedKubeData(): CachedData<KubeData> {
  return global.cachedData
}

export function getLogsUrl(
  workload: RawDeployment | RawCronjob
): string | undefined {
  return process.env.GRAFANA_URL_LOGS_DEPLOYMENT?.replace(
    "{{namespace}}",
    workload.metadata.namespace
  ).replace("{{app}}", getAppLabel(workload))
}

export async function getKubeData(): Promise<KubeData> {
  try {
    const namespaces: Namespace[] = []

    for (const namespace of Object.keys(localKubeCache)) {
      const pods = Object.values(
        localKubeCache[namespace].Pod || {}
      ) as RawPod[]
      const replicasets = Object.values(
        (localKubeCache[namespace].ReplicaSet || {}) as any
      ) as RawReplicaSet[]
      const deployments = Object.values(
        localKubeCache[namespace].Deployment || {}
      ) as RawDeployment[]
      const jobs = Object.values(
        localKubeCache[namespace].Job || {}
      ) as RawJob[]
      const cronjobs = Object.values(
        localKubeCache[namespace].CronJob || {}
      ) as RawCronjob[]

      const cleanedDeployments = _.chain(pods)
        .filter(
          (pod) => pod.metadata.ownerReferences?.[0].kind === "ReplicaSet"
        )
        .groupBy("metadata.ownerReferences[0].name")
        .map((rsPods, rsName) => {
          const rs = replicasets.find((r) => r.metadata.name === rsName)
          const deployment = deployments.find(
            (deploy) =>
              deploy.metadata.name === rs?.metadata.ownerReferences[0].name
          )
          return { name: rsName, pods: rsPods, deployment }
        })
        .filter((item) => item.deployment !== undefined)
        .groupBy("deployment.metadata.name")
        .map((rs, deployName) => {
          const rawDeployment = rs[0].deployment
          return {
            name: deployName,
            replicasets: rs,
            raw: rawDeployment,
            logsUrl: rawDeployment ? getLogsUrl(rawDeployment) : undefined,
          }
        })
        .value()

      const cleanedCronjobs = _.chain(jobs)
        .groupBy("metadata.ownerReferences[0].name")
        .map((cronJobs, cronjobName) => {
          const cleanedJobs = cronJobs.map((job) => {
            return { name: job.metadata.name, raw: job }
          })
          const rawCronjob = cronjobs.find(
            (cronjob) => cronjob.metadata.name === cronjobName
          )
          return {
            name: cronjobName,
            jobs: cleanedJobs,
            raw: rawCronjob,
            logsUrl: rawCronjob ? getLogsUrl(rawCronjob) : undefined,
          }
        })
        .value()

      namespaces.push({
        name: namespace,
        events: Object.values(
          localKubeCache[namespace].Event || {}
        ) as RawEvent[],
        clusters: Object.values(
          localKubeCache[namespace].Cluster || {}
        ) as Cluster[],
        deployments: cleanedDeployments as Deployment[],
        cronjobs: cleanedCronjobs as Cronjob[],
      })
    }

    return { namespaces }
  } catch (e) {
    console.error(e)
    return { namespaces: [] }
  }
}

async function getCnpgStorageStats({ cluster }: { cluster: RawCluster }) {
  const { stdout } =
    await $`kubectl exec --namespace ${cluster.metadata.namespace} ${cluster.status.currentPrimary} -- df -h`

  const postgresLine = _.chain(stdout)
    .split("\n")
    .filter((line) => line.includes("/var/lib/postgresql/data"))
    .first()
    .value()

  if (!postgresLine) {
    console.error("storage: no postgres line found")
    return { total: "?", used: "?", percentUsed: "?" }
  }
  const [_device, total, used, _free, percentUsed, _path] =
    postgresLine.split(/\s+/)

  return { total, used, percentUsed }
}

async function getCnpgDumps({
  cluster,
}: {
  cluster: RawCluster
}): Promise<Array<DumpFile>> {
  if (!cluster.spec.backup || !cluster.spec.backup.barmanObjectStore) {
    return []
  }

  try {
    const s3Credentials = cluster.spec.backup?.barmanObjectStore?.s3Credentials
    const config = { namespace: cluster.metadata.namespace }

    const accessKeyIdPromise = getSecretValue({
      ...config,
      secretName: s3Credentials?.accessKeyId.name,
      secretKey: s3Credentials?.accessKeyId.key,
    })
    const secretAccessKeyPromise = getSecretValue({
      ...config,
      secretName: s3Credentials?.secretAccessKey.name,
      secretKey: s3Credentials?.secretAccessKey.key,
    })
    const regionPromise = getSecretValue({
      ...config,
      secretName: s3Credentials?.region.name,
      secretKey: s3Credentials?.region.key,
    })

    const [accessKeyId, secretAccessKey, region] = await Promise.all([
      accessKeyIdPromise,
      secretAccessKeyPromise,
      regionPromise,
    ])

    const [_s3, _empty, bucketName, prefix] =
      cluster.spec.backup?.barmanObjectStore?.destinationPath.split("/")

    return grepS3BucketFiles({
      accessKeyId,
      secretAccessKey,
      region,
      endpoint: cluster.spec.backup?.barmanObjectStore?.endpointURL,
      bucketName: bucketName,
      prefix: `${prefix}/${cluster.metadata.name}/dumps`,
      searchString: ".psql.gz",
    })
  } catch (e) {
    console.error(e)
    return []
  }
}

async function getSecretValue({
  namespace,
  secretName,
  secretKey,
}: {
  namespace: string
  secretName: string
  secretKey: string
}) {
  const { stdout } =
    await $`kubectl get --namespace ${namespace} secret ${secretName} -o json`

  const data = JSON.parse(stdout).data[secretKey]
  const buff = Buffer.from(data, "base64")
  return buff.toString("utf-8")
}
//-------- CNPG cluster phases
//
// // PhaseSwitchover when a cluster is changing the primary node
// PhaseSwitchover = "Switchover in progress"
//
// // PhaseFailOver in case a pod is missing and need to change primary
// PhaseFailOver = "Failing over"
//
// // PhaseFirstPrimary for an starting cluster
// PhaseFirstPrimary = "Setting up primary"
//
// // PhaseCreatingReplica everytime we add a new replica
// PhaseCreatingReplica = "Creating a new replica"
//
// // PhaseUpgrade upgrade in process
// PhaseUpgrade = "Upgrading cluster"
//
// // PhaseWaitingForUser set the status to wait for an action from the user
// PhaseWaitingForUser = "Waiting for user action"
//
// // PhaseInplacePrimaryRestart for a cluster restarting the primary instance in-place
// PhaseInplacePrimaryRestart = "Primary instance is being restarted in-place"
//
// // PhaseInplaceDeletePrimaryRestart for a cluster restarting the primary instance without a switchover
// PhaseInplaceDeletePrimaryRestart = "Primary instance is being restarted without a switchover"
//
// // PhaseHealthy for a cluster doing nothing
// PhaseHealthy = "Cluster in healthy state"
//
// // PhaseUnrecoverable for an unrecoverable cluster
// PhaseUnrecoverable = "Cluster is in an unrecoverable state, needs manual intervention"
//
// // PhaseWaitingForInstancesToBeActive is a waiting phase that is triggered when an instance pod is not active
// PhaseWaitingForInstancesToBeActive = "Waiting for the instances to become active"
//
// // PhaseOnlineUpgrading for when the instance manager is being upgraded in place
// PhaseOnlineUpgrading = "Online upgrade in progress"
//
// // PhaseApplyingConfiguration is set by the instance manager when a configuration
// // change is being detected
// PhaseApplyingConfiguration = "Applying configuration"
