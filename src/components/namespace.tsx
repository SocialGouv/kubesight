import { isReady, Cluster, Namespace, getInstances } from "@/lib/kube/types"

export default function Namespace({ namespace }: { namespace: Namespace }) {
  return (
    <div className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow border-l-8 border-emerald-400">
      <div className="flex flex-1 flex-col p-6">{namespace.name}</div>
      <div className="grid grid-cols-1 gap-6 m-2">
        {namespace.clusters.map((cluster) => (
          <ClusterStatus
            key={cluster.metadata.name}
            cluster={cluster}
          ></ClusterStatus>
        ))}
      </div>
    </div>
  )
}

export async function ClusterStatus({ cluster }: { cluster: Cluster }) {
  const clusterIsReady = isReady(cluster)
  const instances = getInstances(cluster)
  return (
    <div
      className={`col-span-1 rounded-lg bg-white shadow border-l-8 text-left
      ${clusterIsReady ? "border-emerald-400" : "border-red-500"}
    `}
    >
      <div className="p-2">
        <div className="font-bold">{cluster.metadata.name}</div>
        <div>
          {instances.map((instance) => (
            <Badge
              text={instance.shortName}
              dot={instance.isPrimary}
              status={
                instance.status === "healthy"
                  ? "ok"
                  : instance.status === "failed"
                    ? "error"
                    : "warning"
              }
            ></Badge>
          ))}
        </div>
        <ul>
          <li>{cluster.status.phase}</li>
        </ul>
      </div>
    </div>
  )
}

export function Badge({
  text,
  dot,
  status,
}: {
  text: string
  dot: boolean
  status: Status
}) {
  const color = statusColors[status]

  return (
    <span
      className={`inline-flex items-center gap-x-1.5 rounded-full bg-${color}-100 px-1.5 py-0.5 text-xs font-medium text-${color}-700`}
    >
      {dot && (
        <svg
          className={`h-1.5 w-1.5 fill-${color}-500`}
          viewBox="0 0 6 6"
          aria-hidden="true"
        >
          <circle cx={3} cy={3} r={3} />
        </svg>
      )}
      {text}
    </span>
  )
}

type Status = "ok" | "warning" | "error"

const statusColors: Record<Status, string> = {
  ok: "emerald",
  warning: "orange",
  error: "red",
}
