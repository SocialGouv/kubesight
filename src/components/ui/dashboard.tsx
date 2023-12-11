"use client"

import { useSearchParams } from "next/navigation"

import Sidebar from "@/components/ui/sidebar"
import Namespace from "@/components/kube/namespace"

import { KubeData, CachedData } from "@/lib/kube/types"

export default function Dashboard({
  cachedKubeData,
}: {
  cachedKubeData: CachedData<KubeData>
}) {
  const searchParams = useSearchParams()!
  const nsFilter = searchParams.get("ns-filter")
  const namespaces = nsFilter
    ? cachedKubeData.data.namespaces.filter((ns) => ns.name.includes(nsFilter))
    : cachedKubeData.data.namespaces

  return (
    <>
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar cachedKubeData={cachedKubeData} />
      </div>
      <main className="lg:pl-72">
        <div className="m-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 min-[1600px]:grid-cols-5 min-[1800px]:grid-cols-6">
          {namespaces.map((ns) => (
            <Namespace key={ns.name} namespace={ns} />
          ))}
        </div>
      </main>
    </>
  )
}
