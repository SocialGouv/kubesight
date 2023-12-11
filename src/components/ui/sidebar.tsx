"use client"

import dayjs from "dayjs"
import Image from "next/image"

import React, { useCallback, useState, useEffect } from "react"
import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { useDebounce } from "@uidotdev/usehooks"
import { Card, Typography, Input } from "@material-tailwind/react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

import { KubeData, CachedData } from "@/lib/kube/types"

export default function Sidebar({
  cachedKubeData,
}: {
  cachedKubeData: CachedData<KubeData>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()!

  const [filterTerm, setFilterTerm] = useState(
    searchParams.get("ns-filter") ?? ""
  )
  const debouncedFilterTerm = useDebounce(filterTerm, 300)
  useEffect(() => {
    router.push(
      pathname + "?" + createQueryString("ns-filter", debouncedFilterTerm)
    )
  }, [debouncedFilterTerm])

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  return (
    <Card className="h-screen w-full max-w-[20rem] p-4 shadow-xl shadow-blue-gray-900/5 rounded-none">
      <div className="mb-2 flex items-center gap-4 p-4">
        <Image
          src="/logo_500.png"
          alt="Kubesight logo"
          width={60}
          height={60}
        />
        <Typography variant="h5" color="blue-gray">
          Kubesight
        </Typography>
      </div>
      <span className="pl-4 text-xs text-gray-500">
        <div>Last refreshed: {dayjs(cachedKubeData.lastRefresh).fromNow()}</div>
      </span>
      <hr className="my-8 border-blue-gray-50" />
      <div className="p-2">
        <Input
          crossOrigin=""
          icon={<MagnifyingGlassIcon className="h-5 w-5" />}
          label="Filter namespaces"
          value={filterTerm}
          onChange={(e) => setFilterTerm(e.target.value)}
        />
      </div>
    </Card>
  )
}
