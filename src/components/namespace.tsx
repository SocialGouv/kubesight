import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTimeline } from "@fortawesome/free-solid-svg-icons"

import { isReady, Cluster, Namespace, getInstances } from "@/lib/kube/types"

dayjs.extend(relativeTime)

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
        <div className="flex flex-row justify-between">
          <span className="font-bold">{cluster.metadata.name}</span>
          <span className="text-xs text-gray-500">
            {dayjs(cluster.metadata.creationTimestamp).fromNow()}
          </span>
        </div>
        <div className="flex gap-1">
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
              dotText={dayjs(cluster.status.currentPrimaryTimestamp).fromNow()}
            ></Badge>
          ))}
        </div>
        <div className="py-2">
          {cluster.status.lastSuccessfulBackup ? (
            <>
              <span className="font-bold text-xs text-gray-500 pr-2">
                {dayjs(cluster.status.firstRecoverabilityPoint).fromNow()}
              </span>
              <FontAwesomeIcon
                className={`h-4 w-4 inline-block`}
                icon={faTimeline}
              />
              <span className="font-bold text-xs text-gray-500 pl-2">
                {dayjs(cluster.status.lastSuccessfulBackup).fromNow()}
              </span>
            </>
          ) : (
            <span className="font-bold text-xs text-orange-500">no backup</span>
          )}
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
  dotText,
}: {
  text: string
  dot: boolean
  status: Status
  dotText?: string
}) {
  const color = statusColors[status]

  return (
    <span
      className={`inline-flex items-center gap-x-1.5 rounded-full bg-${color}-100 px-1.5 py-0.5 text-xs font-medium text-${color}-700`}
    >
      {text}
      {dot && (
        <>
          <svg
            className={`h-1.5 w-1.5 fill-${color}-500`}
            viewBox="0 0 6 6"
            aria-hidden="true"
          >
            <circle cx={3} cy={3} r={3} />
          </svg>
          <span className="text-xs">{dotText ?? ""}</span>
        </>
      )}
    </span>
  )
}

type Status = "ok" | "warning" | "error"

const statusColors: Record<Status, string> = {
  ok: "emerald", // bg-emerald-100 text-emerald-700 fill-emerald-500
  warning: "orange", // bg-orange-100 text-orange-700 fill-orange-500
  error: "red", // bg-red-100 text-red-700 fill-red-500
}
