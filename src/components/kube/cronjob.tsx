import dayjs from "dayjs"
import _ from "lodash"

import {
  Cronjob,
  Job,
  getCronjobStatus,
  getLastSuccessfullJob,
  getJobsAfterlastSuccessfull,
} from "@/lib/kube/types"
import Tooltip from "@/components/ui/tooltip"
import JsonWidget from "@/components/ui/json"

export default function CronjobWidget({ cronjob }: { cronjob: Cronjob }) {
  const cronjobIsOk = getCronjobStatus(cronjob) === "ok"
  return (
    <div
      className={`col-span-1 rounded-lg bg-white shadow border-l-8 text-left
      ${cronjobIsOk ? "border-emerald-400" : "border-red-500"}
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
  return (
    <div className="flex flex-row justify-between">
      <span className="font-bold">{cronjob.name}</span>
      <span className="text-xs text-gray-500 text-right">
        <div className="font-bold capitalize">CRON</div>
        <div>{dayjs(cronjob.raw?.metadata.creationTimestamp).fromNow()}</div>
        {cronjob.logsUrl && (
          <div>
            <a href={cronjob.logsUrl} target="_blank">
              Logs
            </a>
          </div>
        )}
      </span>
    </div>
  )
}

function Jobs({ cronjob }: { cronjob: Cronjob }) {
  const lastSuccess = getLastSuccessfullJob(cronjob)
  const jobsAfterLastSuccess = getJobsAfterlastSuccessfull(cronjob)

  return (
    <div>
      <div className="text-xs text-gray-500 text-right">
        Last success: {dayjs(lastSuccess?.raw.status.completionTime).fromNow()}
      </div>
      {jobsAfterLastSuccess.length > 0 && (
        <div className="text-sm text-gray-700 py-2">
          Last failed job:
          <div className="grid gap-1">
            {jobsAfterLastSuccess.map((job) => (
              <Job key={job.name} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Job({ job }: { job: Job }) {
  return (
    <Tooltip
      content={
        <>
          <div className="text-sm text-gray-700 font-bold">Job {job.name}</div>
          <JsonWidget src={job.raw.status} />
        </>
      }
    >
      <div
        key={job.name}
        className={
          "col-span-1 rounded-lg bg-white shadow border-l-8 text-left border-red-500 p-2"
        }
      >
        {job.name}
      </div>
    </Tooltip>
  )
}
