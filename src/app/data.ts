import { KubeData, CachedData } from "@/lib/kube/types"

declare global {
  var cachedData: CachedData<KubeData>
}

export function getCachedData(): CachedData<KubeData> {
  return global.cachedData
}
