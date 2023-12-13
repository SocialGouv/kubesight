import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { Namespace } from "@/lib/kube/types"
import Badge from "@/components/ui/badge"
import Tooltip from "@/components/ui/tooltip"

dayjs.extend(relativeTime)

export default function EventsWidget({ namespace }: { namespace: Namespace }) {
  return (
    <ul className="list-disc text-left text-xs">
      {namespace.events
        .filter((event) => event.type !== "Normal")
        .filter((event) =>
          dayjs(event.lastTimestamp).isAfter(dayjs().subtract(1, "hour"))
        )
        .sort((a, b) => b.lastTimestamp.getTime() - a.lastTimestamp.getTime())
        .map((event) => (
          <Tooltip
            key={event.metadata.name}
            content={
              <>
                <div className="text-xs text-gray-500">
                  {dayjs(event.lastTimestamp).fromNow()}
                </div>
                {event.type}: {event.message}
              </>
            }
          >
            <li className="w-full">
              {event.count && event.count > 1 ? (
                <Badge
                  text={event.count?.toString() ?? "0"}
                  status="warning"
                ></Badge>
              ) : (
                <></>
              )}{" "}
              {event.message?.length && event.message?.length > 40
                ? event.message.substring(0, 40) + "..."
                : event.message}
            </li>
          </Tooltip>
        ))}
    </ul>
  )
}
