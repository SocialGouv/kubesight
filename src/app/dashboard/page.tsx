import { ChevronRightIcon } from "@heroicons/react/20/solid"
import MyBreadcrumbs from "@/components/breadcrumbs"

import { getContexts } from "@/lib/kube"

export const dynamic = "force-dynamic"

export default async function Page() {
  const kubeContexts = await getContexts()
  return (
    <div>
      <MyBreadcrumbs></MyBreadcrumbs>

      <ul role="list" className="divide-y divide-gray-100 m-8 bg-white">
        {kubeContexts.map((context) => (
          <li key={context} className="relative py-5 hover:bg-gray-50">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-4xl justify-between gap-x-6">
                <div className="flex min-w-0 gap-x-4">
                  <div className="min-w-0 flex-auto">
                    <p className="text-sm font-semibold leading-6 text-gray-900">
                      <a href={`/dashboard/${context}`}>
                        <span className="absolute inset-x-0 -top-px bottom-0" />
                        {context}
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-x-4">
                  <ChevronRightIcon
                    className="h-5 w-5 flex-none text-gray-400"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
