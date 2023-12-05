"use client"

import { useState } from "react"

import Namespace from "./namespace"
import type { CachedData } from "@/lib/kube"
import type { Namespace as NamespaceType } from "@/lib/kube/types"

export default function Dashboard({
  namespaces,
}: {
  namespaces: CachedData<NamespaceType[]>
}) {
  const [selectedNamespaces, setSelectedNamespaces] = useState<NamespaceType[]>(
    []
  )

  function handleClick(namespace: NamespaceType) {
    if (isSelected(namespace)) {
      setSelectedNamespaces([
        ...selectedNamespaces.filter((ns) => ns.name !== namespace.name),
      ])
    } else {
      setSelectedNamespaces([...selectedNamespaces, namespace])
    }
  }

  function isSelected(namespace: NamespaceType) {
    return !!selectedNamespaces.find((ns) => ns.name === namespace.name)
  }

  return (
    <div className="flex-1 grid grid-cols-4 p-3 gap-3 overflow-auto">
      {namespaces.data.map((ns) => {
        const selected = isSelected(ns)
        return (
          <div
            key={ns.name}
            onClick={() => handleClick(ns)}
            className={`flex flex-col cursor-pointer ${
              selected ? "row-span-4" : ""
            }`}
          >
            <Namespace namespace={ns} selected={selected} />
          </div>
        )
      })}
    </div>
  )
}
