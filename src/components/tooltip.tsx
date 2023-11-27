"use client"

import { ReactNode } from "react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { Tooltip, Typography } from "@material-tailwind/react"

dayjs.extend(relativeTime)

export default function MyTooltip({
  content,
  children,
}: {
  content: ReactNode
  children: ReactNode
}) {
  return (
    <Tooltip
      placement="bottom-start"
      className="border border-blue-gray-52 bg-white px-4 py-3 shadow-xl shadow-black/10"
      content={
        <div className="w-82">
          <Typography
            variant="small"
            color="blue-gray"
            className="font-normal opacity-82"
          >
            {content}
          </Typography>
        </div>
      }
    >
      {children}
    </Tooltip>
  )
}
