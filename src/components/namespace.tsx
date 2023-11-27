import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

import { Namespace } from "@/lib/kube/types"
import Events from "@/components/events"
import ClusterWidget from "@/components/cnpgCluster"

dayjs.extend(relativeTime)

export default function Namespace({ namespace }: { namespace: Namespace }) {
  return (
    <div className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow border-l-8 border-emerald-400">
      <div className="flex flex-col p-6">{namespace.name}</div>
      <div className="grid grid-cols-1 gap-6 m-2">
        {namespace.clusters.map((cluster) => (
          <ClusterWidget key={cluster.metadata.name} cluster={cluster} />
        ))}
        <div className="m-4">
          <Events namespace={namespace} />
        </div>
      </div>
    </div>
  )
}
