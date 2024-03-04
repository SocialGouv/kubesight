"use client"

import { useSearchParams } from "next/navigation"

import Sidebar from "@/components/ui/sidebar"
import Namespace from "@/components/kube/namespace"

import { KubeData, CachedData, getNamespaceStatus } from "@/lib/kube/types"

export default function Dashboard({
  cachedKubeData,
}: {
  cachedKubeData: CachedData<KubeData>
}) {
  const searchParams = useSearchParams()!
  const nsFilter = searchParams.get("ns-filter") ?? ""
  const showOnlyErrors = searchParams.get("show-only-errors") === "true"
  const namespaces = cachedKubeData.data.namespaces.filter(
    (ns) =>
      ns.name.includes(nsFilter) &&
      (showOnlyErrors ? getNamespaceStatus(ns) === "error" : true)
  )

  return (
    <>
      <main className="lg:pl-72">
        <ul role="list" className="divide-y divide-gray-100">
          {namespaces.map((ns) => (
            <li
              key={ns.name}
              className="gap-x-4 px-4 py-2 hover:bg-gray-50 sm:px-6 lg:px-8"
            >
              <Namespace namespace={ns} />
            </li>
          ))}
        </ul>
      </main>
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar cachedKubeData={cachedKubeData} />
      </div>
    </>
  )
}
