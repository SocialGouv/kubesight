"use client"

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { Tooltip, Typography } from "@material-tailwind/react"
import { Namespace } from "@/lib/kube/types"
import Badge from "@/components/badge"

dayjs.extend(relativeTime)

export default function Events({ namespace }: { namespace: Namespace }) {
  return (
    <ul className="list-disc text-left text-xs">
      {namespace.events
        .filter((event) => event.type !== "Normal")
        .filter((event) =>
          dayjs(event.lastTimestamp).isAfter(dayjs().subtract(1, "hour"))
        )
        .map((event) => (
          <Tooltip
            key={event.metadata.name}
            placement="bottom-start"
            className="border border-blue-gray-52 bg-white px-4 py-3 shadow-xl shadow-black/10"
            content={
              <div className="w-82">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-normal opacity-82"
                >
                  <div className="text-xs text-gray-500">
                    {dayjs(event.lastTimestamp).fromNow()}
                  </div>
                  {event.message}
                </Typography>
              </div>
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
              )}
              {event.message.length > 40
                ? event.message.substring(0, 40) + "..."
                : event.message}
            </li>
          </Tooltip>
        ))}
    </ul>
  )
}
