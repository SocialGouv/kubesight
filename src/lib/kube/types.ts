import { z } from "zod"

export const clusterSchema = z.object({
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
    instanceNames: z.array(z.string()),
    readyInstances: z.number(),
    instancesStatus: z.object({
      healthy: z.optional(z.array(z.string())),
      replicating: z.optional(z.array(z.string())),
      failed: z.optional(z.array(z.string())),
    }),
    // instancesReportedState
    currentPrimary: z.string(),
    currentPrimaryTimestamp: z.coerce.date(),
    targetPrimary: z.string(),
    targetPrimaryTimestamp: z.coerce.date(),
    phase: z.string(),
    // firstRecoverabilityPoint: z.coerce.date(),
    // lastSuccessfulBackup: z.coerce.date(),
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
export type Cluster = z.infer<typeof clusterSchema>
export type Namespace = {
  name: string
  clusters: Cluster[]
}

export function isReady(cluster: Cluster): boolean {
  return cluster.status.instances === cluster.status.readyInstances
}

export function getInstances(cluster: Cluster) {
  const primary = cluster.status.currentPrimary

  const healthy =
    cluster.status.instancesStatus.healthy?.map((i) => {
      return { name: i, status: "healthy" }
    }) ?? []
  const replicating =
    cluster.status.instancesStatus.replicating?.map((i) => {
      return { name: i, status: "replicating" }
    }) ?? []
  const failed =
    cluster.status.instancesStatus.failed?.map((i) => {
      return { name: i, status: "failed" }
    }) ?? []

  const instances = healthy
    .concat(replicating)
    .concat(failed)
    .map(({ name, status }) => {
      return {
        name,
        status,
        isPrimary: name === primary,
        shortName: name.split("-").pop() ?? name,
      }
    })
  console.log(instances)
  return instances
}
