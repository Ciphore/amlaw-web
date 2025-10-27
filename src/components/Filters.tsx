"use client"
import { useEffect, useMemo, useState } from "react"
import { useQueryParams } from "@/lib/useSearchParams"

// Use a flexible facets map to tolerate upstream variations
type Facets = Record<string, Record<string, number>>

export default function Filters({ disabled = false }: { disabled?: boolean }) {
  const { params, set } = useQueryParams()
  const [facets, setFacets] = useState<Facets | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (disabled) {
        setFacets(null)
        return
      }
      try {
        const r = await fetch('/api/search/facets', { cache: 'no-store' })
        if (!r.ok) return
        const data = await r.json()
        if (!cancelled) setFacets(data)
      } catch {
        // ignore
      }
    }
    run()
    return () => { cancelled = true }
  }, [disabled])

  const cities = useMemo(() => Object.keys(facets?.office_city || {}), [facets])
  const practices = useMemo(() => Object.keys((facets?.practice_areas || facets?.practice || {})), [facets])
  const titles = useMemo(() => Object.keys(facets?.title || {}), [facets])
  const firms = useMemo(() => Object.keys(facets?.firm_name || {}), [facets])

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Query</label>
        <input
          type="search"
          disabled={disabled}
          placeholder="e.g. private equity"
          defaultValue={params.get('q') || ''}
          onChange={(e) => set('q', e.target.value)}
          className="w-full rounded border px-3 py-2 bg-background text-foreground"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">City</label>
        <select
          disabled={disabled}
          defaultValue={params.get('office_city') || ''}
          onChange={(e) => set('office_city', e.target.value)}
          className="w-full rounded border px-3 py-2 bg-background text-foreground"
        >
          <option value="">All</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Practice Area</label>
        <select
          disabled={disabled}
          defaultValue={params.get('practice') || ''}
          onChange={(e) => set('practice', e.target.value)}
          className="w-full rounded border px-3 py-2 bg-background text-foreground"
        >
          <option value="">All</option>
          {practices.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <select
          disabled={disabled}
          defaultValue={params.get('title') || ''}
          onChange={(e) => set('title', e.target.value)}
          className="w-full rounded border px-3 py-2 bg-background text-foreground"
        >
          <option value="">All</option>
          {titles.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Firm</label>
        <select
          disabled={disabled}
          defaultValue={params.get('firm_id') || ''}
          onChange={(e) => set('firm_id', e.target.value)}
          className="w-full rounded border px-3 py-2 bg-background text-foreground"
        >
          <option value="">All</option>
          {firms.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">JD Year Range</label>
        <div className="flex gap-2">
          <input
            type="number"
            disabled={disabled}
            placeholder="From"
            className="w-full rounded border px-3 py-2 bg-background text-foreground"
            onChange={(e) => set('jd_from', e.target.value)}
          />
          <input
            type="number"
            disabled={disabled}
            placeholder="To"
            className="w-full rounded border px-3 py-2 bg-background text-foreground"
            onChange={(e) => set('jd_to', e.target.value)}
          />
        </div>
      </div>

      {disabled && (
        <p className="text-sm text-foreground/70">Sign in to enable filters.</p>
      )}
    </div>
  )
}