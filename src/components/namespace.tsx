import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

import Events from "@/components/events"
import { Namespace } from "@/lib/kube/types"
import ClusterWidget from "@/components/cnpgCluster"

dayjs.extend(relativeTime)

export default function Namespace({
  namespace,
  selected,
  layout,
}: {
  namespace: Namespace
  selected: boolean
  layout: "compact" | "detailed"
}) {
  return (
    <div
      className={`flex flex-col flex-1 rounded shadow p-3 gap-3 border-l-8 border-emerald-400 bg-white`}
    >
      <div
        className={`flex items-center justify-center text-center ${
          selected || layout === "detailed" ? "" : "flex-1"
        }`}
      >
        {namespace.name}
      </div>
      {(selected || layout === "detailed") && (
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
