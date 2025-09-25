import Filters from '@/components/Filters'

import { searchAttorneys, type SearchResponse } from '@/lib/api'

function getQS(searchParams: Record<string, string | undefined>) {
  const usp = new URLSearchParams()
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v) usp.set(k, v)
  })
  return usp.toString()
}

function pickString(v: string | string[] | undefined): string | undefined {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v[0]
  return undefined
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams

  const limit = Number(pickString(sp.limit) || 20)
  const page = Number(pickString(sp.page) || 1)
  const offset = (page - 1) * limit
  const sort = pickString(sp.sort) || '' // e.g. 'jd_year:desc' or 'last_name:asc'

  const qs = getQS({
    query: pickString(sp.query),
    city: pickString(sp.city),
    title: pickString(sp.title),
    firm: pickString(sp.firm),
    practice: pickString(sp.practice),
    jd_min: pickString(sp.jd_min),
    jd_max: pickString(sp.jd_max),
    limit: String(limit),
    offset: String(offset),
    sort,
    meta: '1',
  })

  // Use shared helper which normalizes shapes and guards against non-JSON
  const data: SearchResponse = await searchAttorneys({
    query: pickString(sp.query),
    city: pickString(sp.city),
    title: pickString(sp.title),
    firm: pickString(sp.firm),
    practice: pickString(sp.practice),
    jd_min: pickString(sp.jd_min) ? Number(pickString(sp.jd_min)) : undefined,
    jd_max: pickString(sp.jd_max) ? Number(pickString(sp.jd_max)) : undefined,
    limit,
    offset,
  })

  function buildHref(nextPage: number) {
    const usp = new URLSearchParams()
    const keys = ['query','city','title','firm','practice','jd_min','jd_max','sort'] as const
    for (const k of keys) {
      const val = pickString(sp[k])
      if (val) usp.set(k, val)
    }
    usp.set('page', String(nextPage))
    usp.set('limit', String(limit))
    return `?${usp.toString()}`
  }

  return (
    <main className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 max-w-6xl mx-auto">
        <Filters />

        <div>
          <h1 className="text-2xl font-semibold">Attorney Directory</h1>

          <div className="mt-2 text-sm text-gray-600">Showing {data.offset + 1}–{Math.min(data.offset + limit, data.total)} of {data.total}</div>

          <ul className="mt-4 grid gap-2">
            {data.hits.map((a) => (
              <li key={a.attorney_id} className="border rounded p-3 flex gap-3">
                {a.headshot_url ? (
                  <img src={a.headshot_url} alt="" className="w-14 h-14 rounded object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded bg-gray-200" />
                )}
                <div>
                  <div className="font-semibold">
                    <a href={`/attorney/${a.attorney_id}`} className="hover:underline">
                      {a.full_name}
                    </a>
                  </div>
                  <div className="text-sm text-gray-600">
                    {a.title} @ {a.firm_name} — {a.office_city} • JD {a.jd_year ?? '—'}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Simple pager */}
          <div className="mt-6 flex gap-2">
            <a className="border rounded px-3 py-1" href={buildHref(Math.max(1, page - 1))}>Prev</a>
            <a className="border rounded px-3 py-1" href={buildHref(page + 1)}>Next</a>
          </div>
        </div>
      </div>
    </main>
  )
}