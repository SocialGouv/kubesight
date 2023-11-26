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
import Events from "@/components/events"
import Badge from "@/components/badge"

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

// export function Tooltip({
//   text,
//   children,
// }: {
//   text: string
//   children: React.ReactNode
// }) {
//   return (
//     <span className="group flex relative">
//       {children}
//       <span
//         className="group-hover:opacity-100 transition-opacity bg-gray-800 px-1 text-sm text-gray-100 rounded-md absolute left-1/2
//     -translate-x-1/2 translate-y-full opacity-0 m-4 mx-auto"
//       >
//         Tooltip
//       </span>
//     </span>
//   )
//   // return (
//   //   <div className="has-tooltip relative">
//   //     <span className="tooltip p-1 rounded border border-gray-200 bg-gray-100 shadow-lg ml-4 text-sm -mt-8 absolute">
//   //       {text}
//   //     </span>
//   //     {children}
//   //   </div>
//   // )
// }
