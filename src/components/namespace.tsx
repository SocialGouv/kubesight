"use client"

import { isReady, Cluster, Namespace } from "@/lib/kube/types"

export default function Namespace({ namespace }: { namespace: Namespace }) {
  return (
    <div className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow border-l-8 border-green-500">
      <div className="flex flex-1 flex-col p-6">{namespace.name}</div>
      <div className="grid grid-cols-1 gap-6 m-2">
        {namespace.clusters.map((cluster) => (
          <ClusterStatus
            key={cluster.metadata.name}
            cluster={cluster}
          ></ClusterStatus>
        ))}
      </div>
    </div>
  )
}

export async function ClusterStatus({ cluster }: { cluster: Cluster }) {
  const clusterIsReady = isReady(cluster)
  return (
    <div
      className={`col-span-1 rounded-lg bg-white shadow border-l-8 text-left
      ${clusterIsReady ? "border-green-500" : "border-red-500"}
    `}
    >
      <div className="p-2">
        {cluster.metadata.name}
        <ul>
          <li>Instances: {cluster.status.instanceNames?.join(",")}</li>
        </ul>
      </div>
    </div>
  )
}
