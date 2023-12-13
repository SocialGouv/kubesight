import dayjs from "dayjs"
import _ from "lodash"

import { Cronjob, Job, getLogsUrl } from "@/lib/kube/types"
import PodWidget from "@/components/kube/pod"
import Tooltip from "@/components/ui/tooltip"
import JsonWidget from "@/components/ui/json"

export default function CronjobWidget({ cronjob }: { cronjob: Cronjob }) {
  const cronjobIsReady = true // isReady(cluster)
  return (
    <div
      className={`col-span-1 rounded-lg bg-white shadow border-l-8 text-left
      ${cronjobIsReady ? "border-emerald-400" : "border-red-500"}
    `}
    >
      <div className="p-2">
        <Meta cronjob={cronjob} />
        <Jobs cronjob={cronjob} />
      </div>
    </div>
  )
}

function Meta({ cronjob }: { cronjob: Cronjob }) {
  const logsUrl = getLogsUrl(cronjob)
  return (
    <div className="flex flex-row justify-between">
      <span className="font-bold">{cronjob.name}</span>
      <span className="text-xs text-gray-500 text-right">
        <div className="font-bold capitalize">CRON</div>
        <div>
          {dayjs(cronjob.raw?.metadata.creationTimestamp).fromNow()}
        </div>{" "}
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

function Jobs({ cronjob }: { cronjob: Cronjob }) {
  const lastSuccess = _.chain(cronjob.jobs)
    .filter((job) => job.raw.status.succeeded === 1)
    .sortBy((job) => job.raw.status.completionTime)
    .last()
    .value()

  return (
    <div>
      <span className="text-xs text-gray-500">
        Last success: {dayjs(lastSuccess?.raw.status.completionTime).fromNow()}
      </span>
      <div className="grid gap-1">
        {cronjob.jobs
          .filter((job) => {
            return (
              job.raw.status.succeeded !== 1 &&
              job.raw.status.completionTime &&
              lastSuccess?.raw.status.completionTime &&
              job.raw.status.completionTime >
                lastSuccess?.raw.status.completionTime
            )
          })
          .map((job) => (
            <Job key={job.name} job={job} />
          ))}
      </div>
    </div>
  )
}

function Job({ job }: { job: Job }) {
  return (
    <Tooltip
      content={
        <>
          <div className="text-sm text-gray-700 font-bold">Jod {job.name}</div>
          <JsonWidget src={job.raw.status} />
        </>
      }
    >
      <div
        key={job.name}
        className={
          "col-span-1 rounded-lg bg-white shadow border-l-8 text-left border-gray-300"
        }
      >
        <div className="grid gap-1 p-2">
          {job.pods.map((pod) => (
            <PodWidget key={pod.metadata.name} pod={pod}></PodWidget>
          ))}
        </div>
      </div>
    </Tooltip>
  )
}
