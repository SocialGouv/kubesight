// import * as k8s from "@kubernetes/client-node";
//
// const kc = new k8s.KubeConfig();
// kc.loadFromDefault();
//
// const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
//
// export const main = async () => {
//   try {
//     const namespaces = await k8sApi.listNamespace();
//     return { namespaces: namespaces.body.items };
//   } catch (err) {
//     console.error(err);
//   }
// };

"use server"

import * as R from "remeda"
import { $ } from "execa"
import { z } from "zod"
import { Cluster, clusterSchema } from "@/lib/kube/types"

export type ClusterMap = Record<string, Cluster[]>

const getClustersSchema = z.object({
  items: z.array(clusterSchema),
})

export async function getClusters({
  kubeContext,
}: {
  kubeContext: string
}): Promise<ClusterMap> {
  try {
    const { stdout } =
      await $`kubectl get --context=${kubeContext} clusters.postgresql.cnpg.io -A -o json`

    // const { stdout } =
    //   await $`kubectl cnpg --context=${kubeContext} --namespace=${ns} status ${cluster} -o json`
    const clusters = getClustersSchema.parse(JSON.parse(stdout))

    const result = R.groupBy(
      clusters.items,
      (cluster) => cluster.metadata.namespace
    )
    console.log(result)
    return result
  } catch (e) {
    console.error(e)
    return {}
  }
}

export async function getContexts() {
  const { stdout } = await $`kubectl config get-contexts -o name`
  return stdout.split("\n")
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
