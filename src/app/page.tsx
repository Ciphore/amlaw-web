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

function getQS(searchParams: Record<string, string | undefined>) {
  const u = new URL('/search', 'http://dummy')
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v) u.searchParams.set(k, v)
  })
  return u.searchParams.toString()
}

export default async function Home({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>
}) {
  const limit = Number(searchParams.limit || 20)
  const page = Number(searchParams.page || 1)
  const offset = (page - 1) * limit
  const sort = searchParams.sort || '' // e.g. 'jd_year:desc' or 'last_name:asc'

  const qs = getQS({
    query: searchParams.query,
    city: searchParams.city,
    title: searchParams.title,
    firm: searchParams.firm,
    practice: searchParams.practice,
    jd_min: searchParams.jd_min,
    jd_max: searchParams.jd_max,
    limit: String(limit),
    offset: String(offset),
    sort,
  })

  const r = await fetch(`${BASE}/search?${qs}`, { cache: 'no-store' })
  const json = await r.json()
  const data: Attorney[] = Array.isArray(json) ? json : json.hits ?? []

  return (
    <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-1">
        <Filters />
      </div>

      <div className="md:col-span-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Attorneys</h1>
          <form>
            <select
              name="sort"
              defaultValue={sort}
              className="border rounded px-2 py-1"
              onChange={(e) => {
                const val = e.currentTarget.value
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href)
                  if (val) url.searchParams.set('sort', val)
                  else url.searchParams.delete('sort')
                  url.searchParams.set('page', '1')
                  window.location.href = url.toString()
                }
              }}
            >
              <option value="">Best match</option>
              <option value="jd_year:desc">JD Year (newer first)</option>
              <option value="jd_year:asc">JD Year (older first)</option>
            </select>
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
                <div className="font-semibold">{a.full_name}</div>
                <div className="text-sm text-gray-600">
                  {a.title} @ {a.firm_name} — {a.office_city} • JD {a.jd_year ?? '—'}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Simple pager */}
        <div className="mt-6 flex gap-2">
          <a
            className="border rounded px-3 py-1"
            href={`?${new URLSearchParams({ ...searchParams, page: String(Math.max(1, page - 1)) }).toString()}`}
          >
            Prev
          </a>
          <a
            className="border rounded px-3 py-1"
            href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`}
          >
            Next
          </a>
        </div>
      </div>
    </main>
  )
}