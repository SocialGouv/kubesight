import _ from "lodash"
import cron from "node-cron"
import { makeCachedData } from "@/lib/kube/types"
import { getKubeData } from "@/lib/kube"

export async function refreshData() {
  const start = new Date().getTime()
  global.cachedData = makeCachedData(await getKubeData())
  console.log("refreshed data in", new Date().getTime() - start, "ms")
}

export const debouncedRefreshData = _.debounce(refreshData, 1000, {
  maxWait: 1000,
})

export function startCron() {
  global.cachedData = makeCachedData({ namespaces: [] })
  cron.schedule("*/10 * * * * *", refreshData)
}
