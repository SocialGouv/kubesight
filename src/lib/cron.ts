import cron from "node-cron"
import { makeCachedData } from "@/lib/kube/types"
import { autotrace, getKubeData } from "@/lib/kube"

export async function refreshData() {
  console.log("-- refreshing data")
  global.cachedData = makeCachedData(await getKubeData())
  console.log("-----> ok")
}

export function startCron() {
  global.cachedData = makeCachedData({ namespaces: [] })
  cron.schedule("*/10 * * * * *", async () => {
    autotrace("refreshData", refreshData)()
  })
}
