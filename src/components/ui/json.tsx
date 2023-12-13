"use client"

import JsonView from "react18-json-view"
import "react18-json-view/src/style.css"

export default function JsonWidget(src: any) {
  return <JsonView src={src} />
}
