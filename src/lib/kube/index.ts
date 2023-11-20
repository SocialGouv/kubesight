"use server"

import _ from "lodash"
import { $ } from "execa"
import { z } from "zod"
import async from "async"
import { Namespace, clusterSchema, RawCluster } from "@/lib/kube/types"

const getClustersSchema = z.object({
  items: z.array(clusterSchema),
})

export async function getNamespaces({
  kubeContext,
}: {
  kubeContext: string
}): Promise<Array<Namespace>> {
  try {
    const { stdout } =
      await $`kubectl get --context=${kubeContext} clusters.postgresql.cnpg.io -A -o json`

    // const { stdout } =
    //   await $`kubectl cnpg --context=${kubeContext} --namespace=${ns} status ${cluster} -o json`
    const clusters = getClustersSchema.parse(JSON.parse(stdout)).items

    const clustersWithStats = await async.map(
      clusters,
      async (cluster: RawCluster) => {
        const storageStatsPromise = getCnpgStorageStats({
          kubeContext,
          cluster,
        })
        const podStatsPromise = getCnpgPodStats({ kubeContext, cluster })
        const [storageStats, podStats] = await Promise.all([
          storageStatsPromise,
          podStatsPromise,
        ])
        return { ...cluster, storageStats, podStats }
      }
    )

    const namespaces = _.chain(clustersWithStats)
      .groupBy((cluster) => cluster.metadata.namespace)
      .map((clusters, namespaceName) => {
        return { name: namespaceName, clusters }
      })
      .value()

    return namespaces
  } catch (e) {
    console.error(e)
    return []
  }
}

export async function getContexts() {
  const { stdout } = await $`kubectl config get-contexts -o name`
  return stdout.split("\n")
}

async function getCnpgStorageStats({
  kubeContext,
  cluster,
}: {
  kubeContext: string
  cluster: RawCluster
}) {
  const { stdout } =
    await $`kubectl exec --context=${kubeContext} --namespace ${cluster.metadata.namespace} ${cluster.status.currentPrimary} -- df -h`

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

async function getCnpgPodStats({
  kubeContext,
  cluster,
}: {
  kubeContext: string
  cluster: RawCluster
}) {
  const { stdout } =
    await $`kubectl top --context=${kubeContext} --namespace ${cluster.metadata.namespace} --no-headers=true pod ${cluster.status.currentPrimary}`
  const [_pod, cpu, memory] = stdout.split(/\s+/)

  return { cpu, memory }
}

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
