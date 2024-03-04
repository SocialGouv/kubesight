import * as k8s from "@kubernetes/client-node"
import { debouncedRefreshData } from "./cron"

const kubeconfig = new k8s.KubeConfig()
kubeconfig.loadFromDefault()
const watch = new k8s.Watch(kubeconfig)

type Ns = string
type Kind = string
type Name = string
export const localKubeCache: Record<
  Ns,
  Record<Kind, Record<Name, KubeResource>>
> = {}

type KubeResource = {
  kind?: string
  metadata?: k8s.V1ObjectMeta
}

function handleWatchEvent<T extends KubeResource>(
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

  const ns = resource.metadata?.namespace || "default"
  if (!(ns in localKubeCache)) {
    localKubeCache[ns] = {}
  }
  const kind = resource.kind
  if (!(kind in localKubeCache[ns])) {
    localKubeCache[ns][kind] = {}
  }

  switch (eventType) {
    case "ADDED":
    case "MODIFIED":
      localKubeCache[ns][kind][resource.metadata.name] = resource
      break
    case "DELETED":
      delete localKubeCache[ns][kind][resource.metadata.name]
      break
  }

  debouncedRefreshData()

  if (kind === "CLuster") {
  }
}

function doWatch(api: string) {
  console.log("watching api", api)
  watch.watch(api, {}, handleWatchEvent, (err: any) => {
    console.error(err)
    doWatch(api)
  })
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

  for (const path of apiPaths) {
    doWatch(path)
  }
}
