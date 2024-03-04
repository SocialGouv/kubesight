import dayjs from "dayjs"

import { Deployment, getDeploymentStatus } from "@/lib/kube/types"
import PodWidget from "@/components/kube/pod"

export default function DeploymentWidget({
  deployment,
}: {
  deployment: Deployment
}) {
  const deploymentIsOk = getDeploymentStatus(deployment) === "ok"
  return (
    <div
      className={`rounded-lg bg-white shadow border-l-8 text-left w-full
      ${deploymentIsOk ? "border-emerald-400" : "border-red-500"}
    `}
    >
      <div className="flex gap-x-1 w-full">
        <Meta deployment={deployment} />
        <ReplicaSets deployment={deployment} />
      </div>
    </div>
  )
}

function Meta({ deployment }: { deployment: Deployment }) {
  return (
    <div className="flex flex-row justify-between w-2/6 gap-x-1">
      <div className="font-bold">{deployment.name}</div>
      <div className="text-xs text-gray-500 text-right flex flex-row gap-x-1 px-2">
        {deployment.logsUrl && (
          <div>
            <a href={deployment.logsUrl} target="_blank">
              Logs
            </a>
          </div>
        )}
        <div>|</div>
        <div className="w-5">
          {dayjs(deployment.raw.metadata.creationTimestamp).fromNow()}
        </div>
      </div>
    </div>
  )
}

function ReplicaSets({ deployment }: { deployment: Deployment }) {
  return (
    <div className="flex flex-col gap-1 w-4/6">
      {deployment.replicasets.map((replicaset) => (
        <div key={replicaset.name} className="w-full">
          <div className="flex flex-col gap-1 w-full">
            {replicaset.pods.map((pod) => (
              <PodWidget key={pod.metadata.name} pod={pod}></PodWidget>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
