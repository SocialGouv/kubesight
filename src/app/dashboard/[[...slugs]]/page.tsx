import { Suspense } from "react"

import Spinner from "@/app/_icons/spinner"
import Dashboard from "@/components/dashboard"
import { getCachedNamespaces } from "@/lib/kube"
import MyBreadcrumbs from "@/components/breadcrumbs"

export default async function Page() {
  const namespaces = await getCachedNamespaces()

  return (
    <>
      <MyBreadcrumbs />
      <Suspense
        fallback={
          <div className="w-full flex justify-center py-32">
            <Spinner></Spinner>
          </div>
        }
      >
        <Dashboard namespaces={namespaces} />
      </Suspense>
    </>
  )
}
