"use client"

import Sidebar from "@/components/ui/sidebar"
import Namespace from "@/components/kube/namespace"

import { KubeData, CachedData } from "@/lib/kube/types"

export default function Dashboard({
  cachedKubeData,
}: {
  cachedKubeData: CachedData<KubeData>
}) {
  return (
    <>
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar></Sidebar>
      </div>
      <main className="lg:pl-72">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 m-8">
          {cachedKubeData.data.namespaces.map((ns) => (
            <Namespace key={ns.name} namespace={ns} />
          ))}
        </div>
      </main>
    </>
  )
}
