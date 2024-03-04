"use client"

import { ReactNode } from "react"
import { Tooltip } from "@material-tailwind/react"

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
          <div className="text-blue-gray opacity-82">{content}</div>
        </div>
      }
    >
      {children}
    </Tooltip>
  )
}
