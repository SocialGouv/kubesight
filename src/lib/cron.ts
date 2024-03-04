import _ from "lodash"
import cron from "node-cron"
import { makeCachedData } from "@/lib/kube/types"
import { getKubeData } from "@/lib/kube"

// export function startCron() {
//   cron.schedule("*/10 * * * * *", refreshData)
// }
