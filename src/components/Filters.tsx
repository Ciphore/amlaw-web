'use client'

import { useEffect, useState } from 'react'
import { useQueryParams } from '@/lib/useSearchParams'

type Facets = {
  practice_areas?: Record<string, number>
  office_city?: Record<string, number>
  title?: Record<string, number>
  firm_name?: Record<string, number>
  jd_year?: Record<string, number>
}

// Always use same-origin API proxy to avoid browser CORS when deployed
const BASE = '/api'

export default function Filters() {
  const [facets, setFacets] = useState<Facets | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const { params, set } = useQueryParams()

  useEffect(() => {
    fetch(`${BASE}/search/facets`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setFacets)
      .catch((e) => setErr(e.message))
  }, [])

  if (err) return <div className="text-red-600">Facets error: {err}</div>
  if (!facets) return <div>Loading filters…</div>

  const jdYears = Object.keys(facets.jd_year || {}).map(Number).sort((a,b)=>a-b)
  const minJD = jdYears[0] ?? 1990
  const maxJD = jdYears.at(-1) ?? minJD

  return (
    <aside className="p-4 border rounded space-y-4">
      {/* Query */}
      <div>
        <label className="block text-sm font-medium">Query</label>
        <input
          className="border rounded w-full px-2 py-1"
          defaultValue={params.get('query') || ''}
          onBlur={(e) => set('query', e.target.value || undefined)}
          placeholder="e.g. private equity"
        />
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium">City</label>
        <select
          className="border rounded w-full px-2 py-1"
          value={params.get('city') || ''}
          onChange={(e) => set('city', e.target.value || undefined)}
        >
          <option value="">All</option>
          {Object.entries(facets.office_city || {}).sort(([a],[b]) => a.localeCompare(b)).map(([k, v]) => (
            <option key={k} value={k}>{k} ({v})</option>
          ))}
        </select>
      </div>

      {/* Practice */}
      <div>
        <label className="block text-sm font-medium">Practice Area</label>
        <select
          className="border rounded w-full px-2 py-1"
          value={params.get('practice') || ''}
          onChange={(e) => set('practice', e.target.value || undefined)}
        >
          <option value="">All</option>
          {Object.entries(facets.practice_areas || {}).sort(([a],[b]) => a.localeCompare(b)).map(([k, v]) => (
            <option key={k} value={k}>{k} ({v})</option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium">Title</label>
        <select
          className="border rounded w-full px-2 py-1"
          value={params.get('title') || ''}
          onChange={(e) => set('title', e.target.value || undefined)}
        >
          <option value="">All</option>
          {Object.entries(facets.title || {}).sort(([a],[b]) => a.localeCompare(b)).map(([k, v]) => (
            <option key={k} value={k}>{k} ({v})</option>
          ))}
        </select>
      </div>

      {/* Firm */}
      <div>
        <label className="block text-sm font-medium">Firm</label>
        <select
          className="border rounded w-full px-2 py-1"
          value={params.get('firm') || ''}
          onChange={(e) => set('firm', e.target.value || undefined)}
        >
          <option value="">All</option>
          {Object.entries(facets.firm_name || {}).sort(([a],[b]) => a.localeCompare(b)).map(([k, v]) => (
            <option key={k} value={k}>{k} ({v})</option>
          ))}
        </select>
      </div>

      {/* JD Year range */}
      <div>
        <label className="block text-sm font-medium">JD Year</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="border rounded px-2 py-1 w-24"
            placeholder={`${minJD}`}
            defaultValue={params.get('jd_min') || ''}
            onBlur={(e) => set('jd_min', e.target.value || undefined)}
          />
          <span>to</span>
          <input
            type="number"
            className="border rounded px-2 py-1 w-24"
            placeholder={`${maxJD}`}
            defaultValue={params.get('jd_max') || ''}
            onBlur={(e) => set('jd_max', e.target.value || undefined)}
          />
        </div>
      </div>
    </aside>
  )
}