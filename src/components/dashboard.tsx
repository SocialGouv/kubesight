"use client"

import { useState } from "react"

import Namespace from "./namespace"
import type { CachedData } from "@/lib/kube"
import LayoutGridLarge from "@/app/_icons/layout-grid-large"
import LayoutGridSmall from "@/app/_icons/layout-grid-small"
import type { Namespace as NamespaceType } from "@/lib/kube/types"

export default function Dashboard({
  namespaces,
}: {
  namespaces: CachedData<NamespaceType[]>
}) {
  const [layout, setLayout] = useState<"compact" | "detailed">("compact")
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

  function toggleLayout() {
    setLayout(layout === "compact" ? "detailed" : "compact")
  }

  return (
    <>
      <div className="absolute right-3 top-4 flex gap-x-1 flex-row-reverse">
        <button
          onClick={toggleLayout}
          className="w-6 h-6 cursor-pointer text-gray-300 hover:text-gray-400"
        >
          {layout === "compact" ? <LayoutGridLarge /> : <LayoutGridSmall />}
        </button>
      </div>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 p-3 gap-3 overflow-auto">
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
              <Namespace namespace={ns} selected={selected} layout={layout} />
            </div>
          )
        })}
      </div>
    </>
  )
}
