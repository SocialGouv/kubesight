import { KubeConfig, Watch, V1ObjectMeta } from "@kubernetes/client-node"
import _ from "lodash"
import { makeCachedData, CachedData, KubeData } from "@/lib/kube/types"
import { getKubeData } from "@/lib/kube"

const allContexts = ["dev", "prod", "ovh-dev", "ovh-prod"]

const mainKubeConfig = new KubeConfig()
mainKubeConfig.loadFromDefault()

const watchers: Record<string, Watch> = {}

function loadKubeConfigForContext(contextName: string) {
  const kubeConfigForContext = new KubeConfig()
  kubeConfigForContext.loadFromDefault()
  kubeConfigForContext.setCurrentContext(contextName)

  watchers[contextName] = new Watch(kubeConfigForContext)
}

mainKubeConfig
  .getContexts()
  .filter((context) => allContexts.includes(context.name))
  .forEach((context) => {
    loadKubeConfigForContext(context.name)
  })

type Cluster = string
type Ns = string
type Kind = string
type Name = string
export const localKubeCache: Record<
  Cluster,
  Record<Ns, Record<Kind, Record<Name, KubeResource>>>
> = {}

type KubeResource = {
  kind?: string
  metadata?: V1ObjectMeta
}
function handleWatchEventForCluster(cluster: string) {
  return function handleWatchEvent<T extends KubeResource>(
    eventType: string,
    resource: T
  ): void {
    if (!resource.kind || !resource.metadata || !resource.metadata.name) {
      console.error(
        "kube resource missing kind or metadata or name or namespace",
        resource
      )
      return
    }

    if (!(cluster in localKubeCache)) {
      localKubeCache[cluster] = {}
    }

    const ns = resource.metadata?.namespace || "default"
    if (!(ns in localKubeCache[cluster])) {
      localKubeCache[cluster][ns] = {}
    }
    const kind = resource.kind
    if (!(kind in localKubeCache[cluster][ns])) {
      localKubeCache[cluster][ns][kind] = {}
    }

    switch (eventType) {
      case "ADDED":
      case "MODIFIED":
        localKubeCache[cluster][ns][kind][resource.metadata.name] = resource
        break
      case "DELETED":
        delete localKubeCache[cluster][ns][kind][resource.metadata.name]
        break
    }

    debouncedRefreshData()

    if (kind === "CLuster") {
    }
  }
}

function doWatch(cluster: string, api: string) {
  console.log(cluster, "-> watching api", api)
  watchers[cluster].watch(
    api,
    {},
    handleWatchEventForCluster(cluster),
    (err: any) => {
      console.error(err)
      doWatch(cluster, api)
    }
  )
}

export async function startWatchingKube() {
  const apiPaths = [
    "/api/v1/events",
    "/api/v1/pods",
    "/api/v1/namespaces",
    "/apis/apps/v1/replicasets",
    "/apis/apps/v1/deployments",
    "/apis/batch/v1/cronjobs",
    "/apis/batch/v1/jobs",
    "/apis/postgresql.cnpg.io/v1/clusters",
  ]

  for (const cluster of Object.keys(watchers)) {
    for (const path of apiPaths) {
      doWatch(cluster, path)
    }
  }
}

export const debouncedRefreshData = _.debounce(refreshData, 1000, {
  maxWait: 1000,
})

export async function refreshData() {
  const start = new Date().getTime()
  global.cachedData = makeCachedData(await getKubeData())
  console.log(
    "refreshed data in",
    new Date().getTime() - start,
    "ms"
    // ">>",
    // Object.entries(cachedKubeData.cache.data.dev)
  )
}
