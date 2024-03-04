import dayjs from "dayjs"
import { RawPod, getPodStatus, getPodContainerState } from "@/lib/kube/types"
import Tooltip from "@/components/ui/tooltip"
import JsonWidget from "@/components/ui/json"

export default function PodWidget({ pod }: { pod: RawPod }) {
  const podStatusInfo =
    pod.status.phase === "Running"
      ? getPodContainerState(pod)
      : pod.status.phase

  return (
    <Tooltip
      content={
        <>
          <div className="text-sm text-gray-700 font-bold">
            Pod {pod.metadata.name}
          </div>
          {/* <JsonWidget src={pod.status} /> */}
        </>
      }
    >
      <div
        className={`col-span-1 rounded-lg bg-white shadow border-l-8 text-xs
          ${
            getPodStatus(pod) === "ok" ? "border-emerald-400" : "border-red-500"
          }
        `}
      >
        {`${pod.metadata.name.split("-")?.pop()} | restarts: ${
          pod.status.containerStatuses?.[0].restartCount
        } | ${dayjs(
          pod.metadata.creationTimestamp
        ).fromNow()} | ${podStatusInfo}`}
      </div>
    </Tooltip>
  )
}
