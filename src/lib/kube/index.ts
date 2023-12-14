import "server-only"

import { $ } from "execa"
import _ from "lodash"
import cron from "node-cron"
import pMap from "p-map"
import { z, ZodTypeAny } from "zod"

import {
  CachedData,
  Cluster,
  clusterSchema,
  Cronjob,
  cronjobSchema,
  Deployment,
  deploymentSchema,
  DumpFile,
  eventSchema,
  getAppLabel,
  jobSchema,
  KubeData,
  makeCachedData,
  Namespace,
  podSchema,
  RawCluster,
  RawCronjob,
  RawDeployment,
  RawEvent,
  RawJob,
  RawNamespace,
  RawPod,
  RawReplicaSet,
  replicasetSchema,
} from "@/lib/kube/types"
import { grepS3BucketFiles } from "@/lib/s3"

declare global {
  var cachedData: CachedData<KubeData>
}

export function getCachedKubeData(): CachedData<KubeData> {
  if (!global.cachedData) {
    global.cachedData = makeCachedData({ namespaces: [] })
    refreshData()
    cron.schedule("*/10 * * * * *", () => {
      refreshData()
    })
  }
  return global.cachedData
}

export async function refreshData() {
  console.log("-- refreshing data")
  global.cachedData = makeCachedData(await getKubeData())
  console.log("-----> ok")
}

export function getLogsUrl(
  workload: RawDeployment | RawCronjob
): string | undefined {
  return process.env.GRAFANA_URL_LOGS_DEPLOYMENT?.replace(
    "{{namespace}}",
    workload.metadata.namespace
  ).replace("{{app}}", getAppLabel(workload))
}

function getOrCreateNamespace(
  namespaces: Record<string, RawNamespace>,
  name: string
) {
  if (!(name in namespaces)) {
    namespaces[name] = {
      name,
      clusters: [],
      pods: [],
      replicasets: [],
      deployments: [],
      jobs: [],
      cronjobs: [],
      events: [],
      cleanedDeployments: [],
      cleanedCronjobs: [],
    }
  }
}

export async function getKubeData(): Promise<KubeData> {
  try {
    const [
      pods,
      replicasets,
      deployments,
      jobs,
      cronjobs,
      events,
      cnpgClusters,
    ] = await Promise.all([
      getResourceList("pods", podSchema),
      getResourceList("replicasets", replicasetSchema),
      getResourceList("deployments", deploymentSchema),
      getResourceList("jobs", jobSchema),
      getResourceList("cronjobs", cronjobSchema),
      getResourceList("events", eventSchema),
      getCnpgClusters(),
    ])

    let namespaces: Record<string, RawNamespace> = {}

    for (const { name, items } of pods) {
      getOrCreateNamespace(namespaces, name)
      namespaces[name].pods = items as RawPod[]
    }
    for (const { name, items } of replicasets) {
      getOrCreateNamespace(namespaces, name)
      namespaces[name].replicasets = items as RawReplicaSet[]
    }
    for (const { name, items } of deployments) {
      getOrCreateNamespace(namespaces, name)
      namespaces[name].deployments = items as RawDeployment[]
    }
    for (const { name, items } of jobs) {
      getOrCreateNamespace(namespaces, name)
      namespaces[name].jobs = items as RawJob[]
    }
    for (const { name, items } of cronjobs) {
      getOrCreateNamespace(namespaces, name)
      namespaces[name].cronjobs = items as RawCronjob[]
    }
    for (const { name, items } of events) {
      getOrCreateNamespace(namespaces, name)
      namespaces[name].events = (items as RawEvent[])?.filter(
        (ev) => ev.metadata.namespace === name
      )
    }
    for (const { name, items } of cnpgClusters) {
      getOrCreateNamespace(namespaces, name)
      namespaces[name].clusters = items as Cluster[]
    }

    const namespaceList = Object.values(namespaces)

    for (const namespace of namespaceList) {
      const cleanedDeployments = _.chain(namespace.pods)
        .filter(
          (pod) => pod.metadata.ownerReferences?.[0].kind === "ReplicaSet"
        )
        .groupBy("metadata.ownerReferences[0].name")
        .map((rsPods, rsName) => {
          const rs = namespace.replicasets.find(
            (r) => r.metadata.name === rsName
          )
          if (!rs) {
            console.error("=== rs not found")
          }
          const deployment = namespace.deployments.find(
            (deploy) =>
              deploy.metadata.name === rs?.metadata.ownerReferences[0].name
          )

          if (!deployment) {
            console.error("=== deployment not found")
          }
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

      const cleanedCronjobs = _.chain(namespace.jobs)
        .groupBy("metadata.ownerReferences[0].name")
        .map((cronJobs, cronjobName) => {
          const cleanedJobs = cronJobs.map((job) => {
            return { name: job.metadata.name, raw: job }
          })
          const rawCronjob = namespace.cronjobs.find(
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

      // TODO: fix type casts
      namespace.cleanedDeployments = cleanedDeployments as Deployment[]
      namespace.cleanedCronjobs = cleanedCronjobs as Cronjob[]
    }

    const data: Namespace[] = namespaceList.map((ns) => {
      return {
        name: ns.name,
        events: ns.events,
        clusters: ns.clusters,
        deployments: ns.cleanedDeployments,
        cronjobs: ns.cleanedCronjobs,
      }
    })

    return { namespaces: data }
  } catch (e) {
    console.error(e)
    return { namespaces: [] }
  }
}

async function getResourceList<Resource, Schema extends ZodTypeAny>(
  resourceName: string,
  schema: Schema
): Promise<Array<{ name: string; items: Array<Resource> }>> {
  try {
    const { stdout } = await $`kubectl get ${resourceName} -A -o json`
    const getItemsSchema = z.object({ items: z.array(schema) })
    const rawItems = getItemsSchema.parse(JSON.parse(stdout)).items

    const itemsByNamespaces = _.chain(rawItems)
      .groupBy((item) => item.metadata.namespace)
      .map((items, namespaceName) => {
        return { name: namespaceName, items: items }
      })
      .value()

    return itemsByNamespaces
  } catch (e) {
    console.error(">>>> resourceName:", resourceName)
    console.error(e)
    return []
  }
}

async function getCnpgClusters(): Promise<
  Array<{ name: string; items: Cluster[] }>
> {
  const listDumps = process.env.CNPG_ENABLE_DUMPS === "true"
  try {
    const { stdout } =
      await $`kubectl get clusters.postgresql.cnpg.io -A -o json`

    const getClustersSchema = z.object({
      items: z.array(clusterSchema),
    })
    const rawClusters = getClustersSchema.parse(JSON.parse(stdout)).items

    const clusters: Cluster[] = await pMap(rawClusters, async (cluster) => {
      const [storageStats, podStats, dumps] = await Promise.all([
        getCnpgStorageStats({
          cluster,
        }),
        getCnpgPodStats({ cluster }),
        listDumps ? getCnpgDumps({ cluster }) : undefined,
      ])
      return { ...cluster, storageStats, podStats, dumps }
    })

    const clustersByNamespaces = _.chain(clusters)
      .groupBy((item) => item.metadata.namespace)
      .map((items, namespaceName) => {
        return { name: namespaceName, items: items }
      })
      .value()

    return clustersByNamespaces
  } catch (e) {
    console.error(e)
    return []
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

async function getCnpgPodStats({ cluster }: { cluster: RawCluster }) {
  const { stdout } =
    await $`kubectl top --namespace ${cluster.metadata.namespace} --no-headers=true pod ${cluster.status.currentPrimary}`
  const [_pod, cpu, memory] = stdout.split(/\s+/)

  return { cpu, memory }
}

async function getCnpgDumps({
  cluster,
}: {
  cluster: RawCluster
}): Promise<Array<DumpFile>> {
  if (!cluster.spec.backup || !cluster.spec.backup.barmanObjectStore) {
    return []
  }

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
