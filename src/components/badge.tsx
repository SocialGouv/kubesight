export default function Badge({
  text,
  dot,
  status,
  dotText,
}: {
  text: string
  dot?: boolean
  status: Status
  dotText?: string
}) {
  const color = statusColors[status]

  return (
    <span
      className={`inline-flex items-center gap-x-1.5 rounded-full bg-${color}-100 px-1.5 py-0.5 text-xs font-medium text-${color}-700`}
    >
      {text}
      {(dot ?? false) && (
        <>
          <svg
            className={`h-1.5 w-1.5 fill-${color}-500`}
            viewBox="0 0 6 6"
            aria-hidden="true"
          >
            <circle cx={3} cy={3} r={3} />
          </svg>
          <span className="text-xs">{dotText ?? ""}</span>
        </>
      )}
    </span>
  )
}

type Status = "ok" | "warning" | "error"

const statusColors: Record<Status, string> = {
  ok: "emerald", // bg-emerald-100 text-emerald-700 fill-emerald-500
  warning: "orange", // bg-orange-100 text-orange-700 fill-orange-500
  error: "red", // bg-red-100 text-red-700 fill-red-500
}
