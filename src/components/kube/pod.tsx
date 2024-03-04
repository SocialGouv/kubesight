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
        className={`col-span-1 flex flex-row rounded-lg border-l-8 text-xs pl-1
          ${
            getPodStatus(pod) === "ok" ? "border-emerald-400" : "border-red-500"
          }
        `}
      >
        <div className="w-10">{pod.metadata.name.split("-")?.pop()}</div>
        <div>|</div>
        <div className="w-24 pl-1">
          restarts: {pod.status.containerStatuses?.[0].restartCount}
        </div>{" "}
        <div>|</div>
        <div className="w-8 pl-1">
          {dayjs(pod.metadata.creationTimestamp).fromNow()}
        </div>
        <div>|</div>
        <div className="pl-1">{podStatusInfo}</div>
      </div>
    </Tooltip>
  )
}
