import MyBreadcrumbs from "@/components/breadcrumbs"
import Namespace from "@/components/namespace"
import { getNamespaces } from "@/lib/kube"

export default async function Page({ params }) {
  let [kubeContext] = params?.slugs
  kubeContext = kubeContext ?? "prod"
  const namespaces = await getNamespaces({ kubeContext })

  return (
    <div>
      <MyBreadcrumbs kubeContext={kubeContext}></MyBreadcrumbs>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 m-8">
        {namespaces.map((ns) => (
          <Namespace key={ns.name} namespace={ns}></Namespace>
        ))}
      </div>
    </div>
  )
}
