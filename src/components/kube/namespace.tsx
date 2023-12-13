import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

import { Namespace, getNamespaceStatus } from "@/lib/kube/types"
import EventsWidget from "@/components/kube/events"
import ClusterWidget from "@/components/kube/cnpgCluster"
import DeploymentWidget from "@/components/kube/deployment"
import CronjobWidget from "@/components/kube/cronjob"

dayjs.extend(relativeTime)

export default function Namespace({ namespace }: { namespace: Namespace }) {
  const namespaceIdOk = getNamespaceStatus(namespace) === "ok"
  return (
    <div
      className={`col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow border-l-8 ${
        namespaceIdOk ? "border-emerald-400" : "border-red-500"
      }
`}
    >
      <div className="flex flex-col p-6">{namespace.name}</div>
      <div className="grid grid-cols-1 gap-6 m-2">
        {namespace.deployments.map((deployment) => (
          <DeploymentWidget key={deployment.name} deployment={deployment} />
        ))}
        {namespace.cronjobs.map((cronjob) => (
          <CronjobWidget key={cronjob.name} cronjob={cronjob} />
        ))}
        {namespace.clusters.map((cluster) => (
          <ClusterWidget key={cluster.metadata.name} cluster={cluster} />
        ))}
        <div className="m-4">
          <EventsWidget namespace={namespace} />
        </div>
      </div>
    </div>
  )
}
