import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

import { Namespace } from "@/lib/kube/types"
import Events from "@/components/events"
import ClusterWidget from "@/components/cnpgCluster"

dayjs.extend(relativeTime)

export default function Namespace({
  namespace,
  selected,
}: {
  namespace: Namespace
  selected: boolean
}) {
  return (
    <div
      className={`flex flex-col flex-1 rounded shadow p-3 gap-3 border-l-8 border-emerald-400 bg-white`}
    >
      <div
        className={`flex items-center justify-center text-center ${
          selected ? "" : "flex-1"
        }`}
      >
        {namespace.name}
      </div>
      {selected && (
        <>
          <div className="flex-1 flex flex-col gap-3">
            {namespace.clusters.map((cluster) => (
              <ClusterWidget key={cluster.metadata.name} cluster={cluster} />
            ))}
          </div>
          <div className="">
            <Events namespace={namespace} />
          </div>
        </>
      )}
    </div>
  )
}
