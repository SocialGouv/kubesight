import dayjs from "dayjs"
import _ from "lodash"

import {
  Cronjob,
  Job,
  getJobStatus,
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
      className={`col-span-1 rounded-lg bg-white border-l-8 w-full hover:bg-gray-200
      ${cronjobIsOk ? "border-emerald-400" : "border-red-500"}
    `}
    >
      <div className="flex gap-x-1 w-full">
        <Meta cronjob={cronjob} />
        <Jobs cronjob={cronjob} />
      </div>
    </div>
  )
}

function Meta({ cronjob }: { cronjob: Cronjob }) {
  return (
    <div className="flex flex-row justify-between w-2/6 gap-x-1 pl-1">
      <div className="font-bold text-left whitespace-nowrap overflow-x-hidden">
        {cronjob.name}
      </div>
      <div className="text-xs text-gray-500 text-right flex flex-row gap-x-1 px-2">
        {cronjob.logsUrl && (
          <div>
            <a href={cronjob.logsUrl} target="_blank">
              Logs
            </a>
          </div>
        )}
        <div>|</div>
        <div className="w-5">
          {dayjs(cronjob.raw?.metadata.creationTimestamp).fromNow()}
        </div>
      </div>
    </div>
  )
}

function Jobs({ cronjob }: { cronjob: Cronjob }) {
  const lastSuccess = getLastSuccessfullJob(cronjob)

  // const jobsAfterLastSuccess = getJobsAfterlastSuccessfull(cronjob)

  return (
    <div>
      <div className="text-xs flex flex-row gap-x-1 px-1">
        Last success:{" "}
        {lastSuccess
          ? dayjs(lastSuccess?.raw.status.completionTime).fromNow()
          : "none"}
      </div>
      {/* <div>|</div> */}
      {/* {jobsAfterLastSuccess.length > 0 && ( */}
      {/*   <div className="text-sm text-gray-700 py-2"> */}
      {/*     Latest jobs: */}
      {/*     <div className="grid gap-1"> */}
      {/*       {jobsAfterLastSuccess.map((job) => ( */}
      {/*         <Job key={job.name} job={job} /> */}
      {/*       ))} */}
      {/*     </div> */}
      {/*   </div> */}
      {/* )} */}
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
        className={`col-span-1 rounded-lg bg-white border-l-8 text-left
      ${
        getJobStatus(job.raw) === "ok" ? "border-emerald-400" : "border-red-500"
      }
    `}
      >
        {job.name}
      </div>
    </Tooltip>
  )
}
