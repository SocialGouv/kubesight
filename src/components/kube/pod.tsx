import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { RawPod, getPodStatus } from "@/lib/kube/types"
import Badge from "@/components/ui/badge"
import Tooltip from "@/components/ui/tooltip"
import JsonWidget from "@/components/ui/json"

dayjs.extend(relativeTime)

export default function PodWidget({ pod }: { pod: RawPod }) {
  const podStatusInfo = pod.status.phase
  return (
    <Tooltip
      content={
        <>
          <div className="text-sm text-gray-700 font-bold">
            Pod {pod.metadata.name}
          </div>
          <JsonWidget src={pod.status} />
        </>
      }
    >
      <Badge
        text={`${pod.metadata.name.split("-")?.pop()} | ${pod.status
          .containerStatuses?.[0].restartCount} | ${dayjs(
          pod.metadata.creationTimestamp
        ).fromNow()} | ${pod.status.phase}`}
        status={getPodStatus(pod)}
      />
    </Tooltip>
  )
}
