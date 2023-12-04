import "server-only"

import _ from "lodash"
import { $ } from "execa"
import { z } from "zod"
import pMap from "p-map"
import { unstable_cache } from "next/cache"

import {
  Namespace,
  clusterSchema,
  RawCluster,
  Cluster,
  eventSchema,
  DumpFile,
} from "@/lib/kube/types"
import { grepS3BucketFiles } from "@/lib/s3"

export type CachedData<T> = {
  data: T
  lastRefresh: Date
}

function makeCachedData<T>(data: T): CachedData<T> {
  return { data, lastRefresh: new Date() }
}

export const getCachedNamespaces = unstable_cache(
  async () => {
    console.log("-- refreshing data")
    return makeCachedData(await getNamespaces())
  },
  ["namespaces"],
  { revalidate: 10 } //60 * 5 }
)

async function getNamespaces(): Promise<Array<Namespace>> {
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
        getCnpgDumps({ cluster }),
      ])
      return { ...cluster, storageStats, podStats, dumps }
    })

    const namespaces = _.chain(clusters)
      .groupBy((cluster) => cluster.metadata.namespace)
      .map((clusters, namespaceName) => {
        return { name: namespaceName, clusters }
      })
      .value()

    const namespacesWithEvents = await pMap(namespaces, async (namespace) => {
      return {
        ...namespace,
        events: await getEvents({ namespace: namespace.name }),
      }
    })

    return namespacesWithEvents
  } catch (e) {
    console.error(e)
    return []
  }
}

export async function getContexts() {
  const { stdout } = await $`kubectl config get-contexts -o name`
  return stdout.split("\n")
}

async function getEvents({ namespace }: { namespace: string }) {
  const { stdout } =
    await $`kubectl  get --namespace ${namespace} events -o json`
  const getEventsSchema = z.object({
    items: z.array(eventSchema),
  })
  const events = getEventsSchema.parse(JSON.parse(stdout)).items
  return events
}

async function getCnpgStorageStats({ cluster }: { cluster: RawCluster }) {
  const { stdout } =
    await $`kubectl exec  --namespace ${cluster.metadata.namespace} ${cluster.status.currentPrimary} -- df -h`

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
    await $`kubectl top  --namespace ${cluster.metadata.namespace} --no-headers=true pod ${cluster.status.currentPrimary}`
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
