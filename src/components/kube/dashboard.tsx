"use client"

import { useSearchParams } from "next/navigation"

import Sidebar from "@/components/ui/sidebar"
import Namespace from "@/components/kube/namespace"

import { KubeData, CachedData, getNamespaceStatus } from "@/lib/kube/types"

import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import updateLocale from "dayjs/plugin/updateLocale"
dayjs.extend(relativeTime, {
  thresholds: [
    { l: "s", r: 1 },
    { l: "m", r: 1 },
    { l: "mm", r: 59, d: "minute" },
    { l: "h", r: 1 },
    { l: "hh", r: 23, d: "hour" },
    { l: "d", r: 1 },
    { l: "dd", r: 29, d: "day" },
    { l: "M", r: 1 },
    { l: "MM", r: 11, d: "month" },
    { l: "y", r: 1 },
    { l: "yy", d: "year" },
  ],
})
dayjs.extend(updateLocale)

dayjs.updateLocale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s",
    s: "1s",
    ss: "%ds",
    m: "1m",
    mm: "%dm",
    h: "1h",
    hh: "%dh",
    d: "1d",
    dd: "%dd",
    M: "1mo",
    MM: "%dmo",
    y: "1y",
    yy: "%dy",
  },
})

export default function Dashboard({
  cachedKubeData,
}: {
  cachedKubeData: CachedData<KubeData>
}) {
  const searchParams = useSearchParams()!
  const nsFilter = searchParams.get("ns-filter") ?? ""
  const showOnlyErrors = searchParams.get("show-only-errors") === "true"

  const kubeClusters = Object.entries(cachedKubeData.data).map(
    ([cluster, clusterNamespaces]) => {
      console.log("UI:", cluster, clusterNamespaces)
      return {
        cluster,
        namespaces: clusterNamespaces.namespaces.filter(
          (ns) =>
            ns.name.includes(nsFilter) &&
            (showOnlyErrors ? getNamespaceStatus(ns) === "error" : true)
        ),
      }
    }
  )

  return (
    <>
      <main className="lg:pl-72">
        <ul role="list">
          {kubeClusters.map(({ cluster, namespaces }) => (
            <li key={cluster}>
              <p>Cluster: {cluster}</p>
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
