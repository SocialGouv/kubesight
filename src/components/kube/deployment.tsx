import dayjs from "dayjs"

import { Deployment } from "@/lib/kube/types"
import PodWidget from "@/components/kube/pod"

export default function DeploymentWidget({
  deployment,
}: {
  deployment: Deployment
}) {
  const deploymenntIsReady = true // isReady(cluster)
  return (
    <div
      className={`col-span-1 rounded-lg bg-white shadow border-l-8 text-left
      ${deploymenntIsReady ? "border-emerald-400" : "border-red-500"}
    `}
    >
      <div className="p-2">
        <Meta deployment={deployment} />
        <ReplicaSets deployment={deployment} />
      </div>
    </div>
  )
}

function Meta({ deployment }: { deployment: Deployment }) {
  return (
    <div className="flex flex-row justify-between">
      <span className="font-bold">{deployment.name}</span>
      <span className="text-xs text-gray-500 text-right">
        <div>{dayjs(deployment.raw.metadata.creationTimestamp).fromNow()}</div>
      </span>
    </div>
  )
}

function ReplicaSets({ deployment }: { deployment: Deployment }) {
  return (
    <div className="flex gap-1">
      {deployment.replicasets.map((replicaset) => (
        <div
          key={replicaset.name}
          className={
            "col-span-1 rounded-lg bg-white shadow border-l-8 text-left border-gray-300"
          }
        >
          <div className="grid gap-1 p-2">
            {replicaset.pods.map((pod) => (
              <PodWidget key={pod.metadata.name} pod={pod}></PodWidget>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
