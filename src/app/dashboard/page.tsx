import { ChevronRightIcon } from "@heroicons/react/20/solid"
import MyBreadcrumbs from "@/components/breadcrumbs"

import { getContexts } from "@/lib/kube"

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
                  {/* <img */}
                  {/*   className="h-12 w-12 flex-none rounded-full bg-gray-50" */}
                  {/*   src={person.imageUrl} */}
                  {/*   alt="" */}
                  {/* /> */}
                  <div className="min-w-0 flex-auto">
                    <p className="text-sm font-semibold leading-6 text-gray-900">
                      <a href={`/dashboard/${context}`}>
                        <span className="absolute inset-x-0 -top-px bottom-0" />
                        {context}
                      </a>
                    </p>
                    {/* <p className="mt-1 flex text-xs leading-5 text-gray-500"> */}
                    {/*   <a */}
                    {/*     href={`mailto:${person.email}`} */}
                    {/*     className="relative truncate hover:underline" */}
                    {/*   > */}
                    {/*     {person.email} */}
                    {/*   </a> */}
                    {/* </p> */}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-x-4">
                  {/* <div className="hidden sm:flex sm:flex-col sm:items-end"> */}
                  {/*   <p className="text-sm leading-6 text-gray-900"> */}
                  {/*     {person.role} */}
                  {/*   </p> */}
                  {/*   {person.lastSeen ? ( */}
                  {/*     <p className="mt-1 text-xs leading-5 text-gray-500"> */}
                  {/*       Last seen{" "} */}
                  {/*       <time dateTime={person.lastSeenDateTime}> */}
                  {/*         {person.lastSeen} */}
                  {/*       </time> */}
                  {/*     </p> */}
                  {/*   ) : ( */}
                  {/*     <div className="mt-1 flex items-center gap-x-1.5"> */}
                  {/*       <div className="flex-none rounded-full bg-emerald-500/20 p-1"> */}
                  {/*         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> */}
                  {/*       </div> */}
                  {/*       <p className="text-xs leading-5 text-gray-500"> */}
                  {/*         Online */}
                  {/*       </p> */}
                  {/*     </div> */}
                  {/*   )} */}
                  {/* </div> */}
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
