import MyBreadcrumbs from "@/components/breadcrumbs"
import NamespaceStatus from "@/components/namespaceStatus"
import { getClusters } from "@/lib/kube"
import * as R from "remeda"

export default async function Page({ params }) {
  let [kubeContext] = params?.slugs
  kubeContext = kubeContext ?? "prod"
  const clusterMap = await getClusters({ kubeContext })

  return (
    <div>
      <MyBreadcrumbs kubeContext={kubeContext}></MyBreadcrumbs>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 m-8">
        {Object.keys(clusterMap).map((ns) => (
          <NamespaceStatus
            key={ns}
            ns={ns}
            clusters={clusterMap[ns]}
          ></NamespaceStatus>
        ))}
      </div>
    </div>
  )
}
