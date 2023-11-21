import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faHardDrive,
  faMemory,
  faMicrochip,
  faFloppyDisk,
} from "@fortawesome/free-solid-svg-icons"

import { isReady, Cluster, Namespace, getInstances } from "@/lib/kube/types"

dayjs.extend(relativeTime)

export default function Namespace({ namespace }: { namespace: Namespace }) {
  return (
    <div className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow border-l-8 border-emerald-400">
      <div className="flex flex-col p-6">{namespace.name}</div>
      <div className="grid grid-cols-1 gap-6 m-2">
        {namespace.clusters.map((cluster) => (
          <ClusterWidget
            key={cluster.metadata.name}
            cluster={cluster}
          ></ClusterWidget>
        ))}
        <div className="m-4">
          <Events namespace={namespace}></Events>
        </div>
      </div>
    </div>
  )
}

function Events({ namespace }: { namespace: Namespace }) {
  return (
    <ul className="list-disc text-left text-xs">
      {namespace.events
        .filter((event) => event.type !== "Normal")
        .map((event) => (
          <li key={event.metadata.name}>
            {event.type}: {event.message}
          </li>
        ))}
    </ul>
  )
}

function ClusterWidget({ cluster }: { cluster: Cluster }) {
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
          <span className="text-xs text-gray-500 text-right">
            <div>{dayjs(cluster.metadata.creationTimestamp).fromNow()}</div>
            <div>{cluster.metadata.labels?.["helm.sh/chart"]}</div>
          </span>
        </div>
        <div className="flex gap-1">
          {instances.map((instance) => (
            <Badge
              key={instance.name}
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
        <div className="pt-2">
          {cluster.status.lastSuccessfulBackup ? (
            <>
              <FontAwesomeIcon
                className={`h-4 w-4 inline-block`}
                icon={faFloppyDisk}
              />
              <span className="font-bold text-xs text-gray-500 pl-2">
                {dayjs(cluster.status.firstRecoverabilityPoint).fromNow() +
                  " ➡ " +
                  dayjs(cluster.status.lastSuccessfulBackup).fromNow()}
              </span>
            </>
          ) : (
            <>
              <FontAwesomeIcon
                className={`h-4 w-4 inline-block text-orange-500`}
                icon={faFloppyDisk}
              />
              <span className="font-bold text-xs text-orange-500 pl-2">
                no backup
              </span>
            </>
          )}
        </div>
        <div className="">
          <span className="font-bold text-xs text-gray-500 pr-2">
            <FontAwesomeIcon
              className={`h-4 w-4 inline-block mr-2`}
              icon={faMemory}
            />
            {`${cluster.spec.resources?.requests?.memory ?? "none"} / ${
              cluster.podStats.memory
            } / ${cluster.spec.resources?.limits?.memory ?? "none"}`}
          </span>
          <span className="font-bold text-xs text-gray-500 pr-2">
            <FontAwesomeIcon
              className={`h-4 w-4 inline-block mr-2`}
              icon={faMicrochip}
            />{" "}
            {`${cluster.spec.resources?.requests?.cpu ?? "none"} / ${
              cluster.podStats.cpu
            } / ${cluster.spec.resources?.limits?.cpu ?? "none"}`}
          </span>
        </div>
        <div className="">
          <span className="font-bold text-xs text-gray-500 pr-2">
            <FontAwesomeIcon
              className={`h-4 w-4 inline-block mr-2`}
              icon={faHardDrive}
            />
            {`${cluster.storageStats.percentUsed} (${cluster.storageStats.used} / ${cluster.storageStats.total})`}
          </span>
        </div>
        {cluster.status.phase !== "Cluster in healthy state" && (
          <div className="pt-2">
            <li>{cluster.status.phase}</li>
          </div>
        )}
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
