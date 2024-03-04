import "server-only"

import { Suspense } from "react"

import { getCachedData } from "@/app/data"

import Spinner from "@/components/ui/spinner"
import Dashboard from "@/components/kube/dashboard"

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
        <Main />
      </Suspense>
    </div>
  )
}

async function Main() {
  const cachedKubeData = getCachedData()
  return <Dashboard cachedKubeData={cachedKubeData} />
}
