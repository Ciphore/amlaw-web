import Filters from '@/components/Filters'

type Attorney = {
  attorney_id: string
  full_name: string
  title?: string
  firm_name?: string
  office_city?: string
  jd_year?: number
  headshot_url?: string
}

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

function absoluteBase(): string {
  if (BASE.startsWith('http')) return BASE
  const site =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  return `${site}${BASE}`
}

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
  })

  const r = await fetch(new URL(`${absoluteBase()}/search?${qs}`), { cache: 'no-store' })
  const json = await r.json()
  const data: Attorney[] = Array.isArray(json) ? json : json.hits ?? []

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
    <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-1">
        <Filters />
      </div>

      <div className="md:col-span-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Attorneys</h1>
          <form method="get" className="flex items-center gap-2">
            <select
              name="sort"
              defaultValue={sort}
              className="border rounded px-2 py-1"
            >
              <option value="">Best match</option>
              <option value="jd_year:desc">JD Year (newer first)</option>
              <option value="jd_year:asc">JD Year (older first)</option>
            </select>
            {/* preserve existing params */}
            {(() => {
              const keys = ['query','city','title','firm','practice','jd_min','jd_max','limit'] as const
              return keys.map((k) => {
                const v = pickString(sp[k])
                return v ? <input key={k} type="hidden" name={k} value={v} /> : null
              })
            })()}
            {/* reset page to 1 when sorting changes */}
            <input type="hidden" name="page" value="1" />
            <button type="submit" className="border rounded px-3 py-1">Apply</button>
          </form>
        </div>

        <ul className="mt-4 space-y-3">
          {data.map((a) => (
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
    </main>
  )
}