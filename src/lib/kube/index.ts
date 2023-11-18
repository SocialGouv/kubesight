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

import { $ } from "execa"
import { z } from "zod"

const clusterSchema = z.object({
  metadata: z.object({
    name: z.string(),
    namespace: z.string(),
    creationTimestamp: z.coerce.date(),
    labels: z.optional(
      z.object({
        "helm.sh/chart": z.string(),
      })
    ),
    // managedFields: edition history
  }),
  // spec
  //   s3 info
  //   resources
  //   storage size
  //   postgresqlParams
  status: z.object({
    instances: z.number(),
    readyInstances: z.number(),
    instancesStatus: z.object({
      healthy: z.optional(z.array(z.string())),
      replicating: z.optional(z.array(z.string())),
      failed: z.optional(z.array(z.string())),
    }),
    // instancesReportedState
    currentPrimary: z.string(),
    targetPrimary: z.string(),
    healthyPVC: z.array(z.string()),
    phase: z.string(),
    firstRecoverabilityPoint: z.coerce.date(),
    lastSuccessfulBackup: z.coerce.date(),
    lastFailedBackup: z.coerce.date(),
    currentPrimaryTimestamp: z.coerce.date(),
    targetPrimaryTimestamp: z.coerce.date(),
    conditions: z.array(
      z.object({
        type: z.string(),
        status: z.coerce.boolean(),
        lastTransitionTime: z.coerce.date(),
        reason: z.string(),
        message: z.string(),
      })
    ),
  }),
})
export type ClusterSchema = z.infer<typeof clusterSchema>

const cnpgStatusSchema = z.object({
  cluster: clusterSchema,
})

const kubeContext = "prod"

export async function main() {
  // const { stdout } = await $`kubectl get clusters.postgresql.cnpg.io -A -o json`

  const ns = "recosante"
  const cluster = "pg"
  const { stdout } =
    await $`kubectl cnpg --context=${kubeContext} --namespace=${ns} status ${cluster} -o json`
  const cnpgStatus = cnpgStatusSchema.parse(JSON.parse(stdout))
  return { namespaces: [{ name: ns, clusters: [cnpgStatus] }] }
}
