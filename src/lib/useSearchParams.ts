'use client'
import { useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export function useQueryParams() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  const params = useMemo(() => new URLSearchParams(sp.toString()), [sp])

  function set(key: string, val?: string) {
    if (!val) params.delete(key)
    else params.set(key, val)
    router.push(`${pathname}?${params.toString()}`)
  }

  return { params, set }
}