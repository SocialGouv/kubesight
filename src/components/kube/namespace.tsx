import { Namespace, getNamespaceStatus } from "@/lib/kube/types"
import EventsWidget from "@/components/kube/events"
import ClusterWidget from "@/components/kube/cnpgCluster"
import DeploymentWidget from "@/components/kube/deployment"
import CronjobWidget from "@/components/kube/cronjob"

export default function Namespace({ namespace }: { namespace: Namespace }) {
  const namespaceIdOk = getNamespaceStatus(namespace) === "ok"
  return (
    <div
      className={`flex divide-y divide-gray-200 rounded-lg bg-white text-center shadow border-l-8 w-full ${
        namespaceIdOk ? "border-emerald-400" : "border-red-500"
      }
`}
    >
      <div className="p-1 w-1/6">{namespace.name}</div>
      <ul className="divide-y divide-gray-100 w-5/6">
        {namespace.deployments.length > 0 && (
          <li>
            <div className="flex w-full">
              <div className="w-1/12 text-left">DEPLOY</div>
              <div className="w-11/12">
                {namespace.deployments.map((deployment) => (
                  <DeploymentWidget
                    key={deployment.name}
                    deployment={deployment}
                  />
                ))}
              </div>
            </div>
          </li>
        )}
        {namespace.cronjobs.length > 0 && (
          <li>
            <div className="flex w-full">
              <div className="w-1/12 text-left">CRON</div>
              <div className="w-11/12">
                {namespace.cronjobs.map((cronjob) => (
                  <CronjobWidget key={cronjob.name} cronjob={cronjob} />
                ))}
              </div>
            </div>
          </li>
        )}
        {namespace.clusters.length > 0 && (
          <li>
            <div className="flex w-full">
              <div className="w-1/12 text-left">CNPG</div>
              <div className="w-11/12">
                {namespace.clusters.map((cluster) => (
                  <ClusterWidget
                    key={cluster.metadata.name}
                    cluster={cluster}
                  />
                ))}
              </div>
            </div>
          </li>
        )}
        {/* <div className="m-4"> */}
        {/*   <EventsWidget namespace={namespace} /> */}
        {/* </div> */}
      </ul>
    </div>
  )
}
