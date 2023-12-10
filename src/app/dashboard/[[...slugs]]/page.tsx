import dayjs from "dayjs"
import Spinner from "@/components/ui/spinner"
import Sidebar from "@/components/ui/sidebar"
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
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar></Sidebar>
      </div>
      <main className="lg:pl-72">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 m-8">
          {kubeData.data.namespaces.map((ns) => (
            <Namespace key={ns.name} namespace={ns} />
          ))}
        </div>
      </main>
    </>
  )
}
