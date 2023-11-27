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
  spec: z.object({
    backup: z.optional(
      z.object({
        barmanObjectStore: z.optional(
          z.object({
            destinationPath: z.string(),
            endpointURL: z.string(),
            s3Credentials: z.object({
              accessKeyId: z.object({ key: z.string(), name: z.string() }),
              secretAccessKey: z.object({ key: z.string(), name: z.string() }),
              region: z.object({ key: z.string(), name: z.string() }),
            }),
          })
        ),
      })
    ),
    // postgresqlParams
    resources: z.optional(
      z.object({
        limits: z.optional(
          z.object({
            cpu: z.optional(z.string()),
            memory: z.optional(z.string()),
          })
        ),
        requests: z.optional(
          z.object({
            cpu: z.optional(z.string()),
            memory: z.optional(z.string()),
          })
        ),
      })
    ),
    storage: z.object({
      size: z.string(),
    }),
    minSyncReplicas: z.number(),
    maxSyncReplicas: z.number(),
  }),
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
    firstRecoverabilityPoint: z.optional(z.coerce.date()),
    lastSuccessfulBackup: z.optional(z.coerce.date()),
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
export type RawCluster = z.infer<typeof clusterSchema>

export const eventSchema = z.object({
  metadata: z.object({
    name: z.string(),
    namespace: z.string(),
    creationTimestamp: z.coerce.date(),
  }),
  count: z.optional(z.number()),
  // eventTime ??
  firstTimestamp: z.coerce.date(),
  lastTimestamp: z.coerce.date(),
  involvedObject: z.object({
    kind: z.string(),
    name: z.string(),
    namespace: z.string(),
  }),
  message: z.string(),
  reason: z.string(),
  type: z.string(),
})
export type RawEvent = z.infer<typeof eventSchema>

export type Cluster = RawCluster & {
  storageStats: {
    total: string
    used: string
    percentUsed: string
  }
  podStats: {
    cpu: string
    memory: string
  }
  dumps: Array<DumpFile>
}

export type DumpFile = {
  name: string | undefined
  size: number | undefined
  lastModified: Date
}

export type Namespace = {
  name: string
  clusters: Cluster[]
  events: RawEvent[]
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
  return instances
}