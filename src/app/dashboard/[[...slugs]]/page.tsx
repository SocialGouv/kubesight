import dayjs from "dayjs"
import Spinner from "@/components/ui/spinner"
import Namespace from "@/components/kube/namespace"
import { getCachedKubeData } from "@/lib/kube"
import { Suspense } from "react"

export default async function Page() {
  return (
    <div>
      <Suspense
        fallback={
          <div className="w-full flex justify-center py-32">
            <Spinner></Spinner>
          </div>
        }
      >
        <Dashboard />
      </Suspense>
    </div>
  )
}

async function Dashboard() {
  const kubeData = await getCachedKubeData()
  return (
    <>
      <div className="flex flex-col justify-center h-full mx-8 mt-2">
        <span className="text-xs text-gray-500 text-left">
          Last refreshed: {dayjs(kubeData.lastRefresh).fromNow()}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 m-8">
        {kubeData.data.namespaces.map((ns) => (
          <Namespace key={ns.name} namespace={ns} />
        ))}
      </div>
    </>
  )
}
