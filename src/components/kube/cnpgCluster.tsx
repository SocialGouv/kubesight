import dayjs from "dayjs"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFloppyDisk, faMemory } from "@fortawesome/free-solid-svg-icons"

import {
  getCnpgClusterStatus,
  Cluster,
  getInstances,
  getCnpgClusterArchivingStatus,
} from "@/lib/kube/types"
import Badge from "@/components/ui/badge"
import Tooltip from "@/components/ui/tooltip"

export default function ClusterWidget({ cluster }: { cluster: Cluster }) {
  const clusterIsOk = getCnpgClusterStatus(cluster) === "ok"
  return (
    <div
      className={`col-span-1 rounded-lg bg-white border-l-8 w-full hover:bg-gray-200
      ${clusterIsOk ? "border-emerald-400" : "border-red-500"}
    `}
    >
      <div className="flex gap-x-1 w-full">
        <Meta cluster={cluster} />
        <div className="flex flex-col gap-y-1">
          <div className="flex flex-row gap-x-1 text-xs">
            <Backup cluster={cluster} />
            <div>|</div>
            {/* <Dumps cluster={cluster} /> */}
            <Memory cluster={cluster} />
            {/* <Cpu cluster={cluster} /> */}
            {/* <Storage cluster={cluster} /> */}
            <div>|</div>
            <Phase cluster={cluster} />
          </div>
          <div className="">
            <Instances cluster={cluster} />
          </div>
        </div>
      </div>
    </div>

    // <div
    //   className={`col-span-1 rounded-lg bg-white shadow border-l-8 text-left
    //   ${clusterIsOk ? "border-emerald-400" : "border-red-500"}
    // `}
    // >
    //   <div className="p-2">
    //     <Meta cluster={cluster} />
    //     <Instances cluster={cluster} />
    //     <Backup cluster={cluster} />
    //     {/* <Dumps cluster={cluster} /> */}
    //     <Memory cluster={cluster} />
    //     {/* <Cpu cluster={cluster} /> */}
    //     {/* <Storage cluster={cluster} /> */}
    //     <Phase cluster={cluster} />
    //   </div>
    // </div>
  )
}

function Meta({ cluster }: { cluster: Cluster }) {
  return (
    <div className="flex flex-row justify-between w-2/6 gap-x-1">
      <div className="font-bold">{cluster.metadata.name}</div>
      <div className="text-xs text-gray-500 text-right flex flex-row gap-x-1 px-2">
        <div>|</div>
        <div className="w-5">
          {dayjs(cluster.metadata.creationTimestamp).fromNow()}
        </div>
      </div>
    </div>
    // <div>{cluster.metadata.labels?.["helm.sh/chart"]}</div>
  )
}

function Instances({ cluster }: { cluster: Cluster }) {
  const instances = getInstances(cluster)
  return (
    <div className="flex gap-1">
      {instances.map((instance) => (
        <Badge
          key={instance.name}
          text={
            instance.shortName +
            " | " +
            (instance.isPrimary ? "primary" : "replica") +
            " | " +
            instance.status
          }
          dot={false}
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
  )
}

function Backup({ cluster }: { cluster: Cluster }) {
  return (
    <Tooltip
      content={
        <>
          <div className="text-sm text-gray-700 font-bold">Barman backups</div>
          first recoverability point ➡ last base backup
        </>
      }
    >
      {cluster.status.lastSuccessfulBackup ? (
        <div className="font-bold text-xs text-gray-500 pl-1">
          {"base backup: " +
            dayjs(cluster.status.firstRecoverabilityPoint).fromNow() +
            " ➡ " +
            dayjs(cluster.status.lastSuccessfulBackup).fromNow()}
        </div>
      ) : (
        <div className="font-bold text-xs pl-1">
          {getCnpgClusterArchivingStatus(cluster) === "error" ? (
            <div className="text-red-500">ERROR wal archiving failure</div>
          ) : (
            <div className="text-orange-500">no base backup</div>
          )}
        </div>
      )}
    </Tooltip>
  )
}

// function Dumps({ cluster }: { cluster: Cluster }) {
//   if (!cluster.dumps) return
//
//   if (cluster.dumps.length === 0) {
//     return (
//       <div className="font-bold text-xs text-orange-500 pr-2">
//         <FontAwesomeIcon
//           className={`h-4 w-4 inline-block mr-2`}
//           icon={faFileZipper}
//         />
//         no dump
//       </div>
//     )
//   }
//   return (
//     <Tooltip
//       content={
//         <>
//           <div className="text-sm text-gray-700 font-bold">Dumps</div>
//           <ul>
//             {cluster.dumps?.map((dump) => {
//               return (
//                 <li key={dump.name}>
//                   {dayjs(dump.lastModified).format("YYYY/MM/DD HH:mm")}
//                   {" - "}
//                   {dump.size
//                     ? formatBytes({ bytes: dump.size, decimals: 2 })
//                     : "empty"}{" "}
//                   : {dump.name}
//                 </li>
//               )
//             })}
//           </ul>
//         </>
//       }
//     >
//       <div className="font-bold text-xs text-gray-500 pr-2">
//         <FontAwesomeIcon
//           className={`h-4 w-4 inline-block mr-2`}
//           icon={faFileZipper}
//         />
//         {cluster.dumps.length + " dumps"}
//         {` - last: ${formatBytes({
//           bytes: cluster.dumps[cluster.dumps.length - 1].size ?? 0,
//           decimals: 2,
//         })}`}
//       </div>
//     </Tooltip>
//   )
// }
//
function Memory({ cluster }: { cluster: Cluster }) {
  return (
    <Tooltip
      content={
        <>
          <div className="text-sm text-gray-700 font-bold">Memory request</div>
        </>
      }
    >
      <div className="font-bold text-xs text-gray-500">
        request: {cluster.spec.resources?.requests?.memory ?? "none"}
      </div>
    </Tooltip>
  )
}
//
// function Cpu({ cluster }: { cluster: Cluster }) {
//   return (
//     <Tooltip
//       content={
//         <>
//           <div className="text-sm text-gray-700 font-bold">CPU</div>
//           request / current / limit
//         </>
//       }
//     >
//       <div className="font-bold text-xs text-gray-500 pr-2">
//         <FontAwesomeIcon
//           className={`h-4 w-4 inline-block mr-2`}
//           icon={faMicrochip}
//         />
//         {`${cluster.spec.resources?.requests?.cpu ?? "none"} / ${
//           cluster.podStats.cpu
//         } / ${cluster.spec.resources?.limits?.cpu ?? "none"}`}
//       </div>
//     </Tooltip>
//   )
// }
//
// function Storage({ cluster }: { cluster: Cluster }) {
//   return (
//     <Tooltip
//       content={
//         <>
//           <div className="text-sm text-gray-700 font-bold">Storage</div>
//           %used (used / total)
//         </>
//       }
//     >
//       <div className="font-bold text-xs text-gray-500 pr-2">
//         <FontAwesomeIcon
//           className={`h-4 w-4 inline-block mr-2`}
//           icon={faHardDrive}
//         />
//         {`${cluster.storageStats.percentUsed} (${cluster.storageStats.used} / ${cluster.storageStats.total})`}
//       </div>
//     </Tooltip>
//   )
// }

function Phase({ cluster }: { cluster: Cluster }) {
  return <div className="text-xs">{cluster.status.phase}</div>
}

function formatBytes({
  bytes,
  decimals,
}: {
  bytes: number
  decimals?: number
}) {
  if (!+bytes) return "0 Bytes"

  const k = 1024
  const dm = (decimals ?? 0) < 0 ? 0 : decimals
  const sizes = [
    "Bytes",
    "KiB",
    "MiB",
    "GiB",
    "TiB",
    "PiB",
    "EiB",
    "ZiB",
    "YiB",
  ]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
