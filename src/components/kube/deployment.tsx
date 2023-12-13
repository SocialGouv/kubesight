import dayjs from "dayjs"

import { Deployment, getDeploymentStatus, getLogsUrl } from "@/lib/kube/types"
import PodWidget from "@/components/kube/pod"

export default function DeploymentWidget({
  deployment,
}: {
  deployment: Deployment
}) {
  const deploymenntIsOk = getDeploymentStatus(deployment) === "ok"
  return (
    <div
      className={`col-span-1 rounded-lg bg-white shadow border-l-8 text-left
      ${deploymenntIsOk ? "border-emerald-400" : "border-red-500"}
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
  const logsUrl = getLogsUrl(deployment)
  return (
    <div className="flex flex-row justify-between">
      <span className="font-bold">{deployment.name}</span>
      <span className="text-xs text-gray-500 text-right">
        <div className="font-bold capitalize">DEPLOY</div>
        <div>{dayjs(deployment.raw.metadata.creationTimestamp).fromNow()}</div>
        {logsUrl && (
          <div>
            <a href={logsUrl} target="_blank">
              Logs
            </a>
          </div>
        )}
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
