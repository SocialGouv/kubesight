import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { Namespace } from "@/lib/kube/types"
import Badge from "@/components/badge"
import Tooltip from "@/components/tooltip"

dayjs.extend(relativeTime)

export default function Events({ namespace }: { namespace: Namespace }) {
  return (
    <ul className="flex flex-col gap-1 text-xs">
      {namespace.events
        .filter((event) => event.type !== "Normal")
        .filter((event) =>
          dayjs(event.lastTimestamp).isAfter(dayjs().subtract(1, "hour"))
        )
        .map((event) => (
          <Tooltip
            key={event.metadata.name}
            content={
              <>
                <div className="text-xs text-gray-500">
                  {dayjs(event.lastTimestamp).fromNow()}
                </div>
                {event.message}
              </>
            }
          >
            <li className="flex items-center gap-1">
              <Badge
                text={event.count?.toString() ?? "0"}
                status="warning"
              ></Badge>
              <div className="truncate">{event.message}</div>
            </li>
          </Tooltip>
        ))}
    </ul>
  )
}
