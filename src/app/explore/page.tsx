import Filters from '@/components/Filters'
import { searchAttorneys, type SearchResponse } from '@/lib/api'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

function pickString(v: string | string[] | undefined): string | undefined {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v[0]
  return undefined
}

function getQS(searchParams: Record<string, string | undefined>) {
  const usp = new URLSearchParams()
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v) usp.set(k, v)
  })
  return usp.toString()
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams

  const limit = Number(pickString(sp.limit) || 20)
  const page = Number(pickString(sp.page) || 1)
  const offset = (page - 1) * limit
  const sort = pickString(sp.sort) || ''

  const qs = getQS({
    q: pickString(sp.q),
    office_city: pickString(sp.office_city),
    firm_id: pickString(sp.firm_id),
    practice: pickString(sp.practice),
    limit: String(limit),
    offset: String(offset),
    sort,
    meta: '1',
  })

  const cookieStore = await cookies()
  const all = cookieStore.getAll()
  const hasAuth = all.some((c) => c.name === 'sb-access-token' || /^sb-.*-auth-token$/.test(c.name))
  const redirectTo = qs ? `/explore?${qs}` : '/explore'

  if (!hasAuth) {
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`)
  }

  const data: SearchResponse | null = await searchAttorneys({
    q: pickString(sp.q),
    office_city: pickString(sp.office_city),
    practice: pickString(sp.practice),
    firm_id: pickString(sp.firm_id),
    limit,
    offset,
  })

  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / limit))
  const buildHref = (nextPage: number) => {
    const u = new URLSearchParams()
    if (pickString(sp.q)) u.set('q', pickString(sp.q)!)
    if (pickString(sp.office_city)) u.set('office_city', pickString(sp.office_city)!)
    if (pickString(sp.practice)) u.set('practice', pickString(sp.practice)!)
    if (pickString(sp.firm_id)) u.set('firm_id', pickString(sp.firm_id)!)
    u.set('limit', String(limit))
    u.set('page', String(Math.min(totalPages, Math.max(1, nextPage))))
    return `?${u.toString()}`
  }

  return (
    <main className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 max-w-6xl mx-auto">
        <Filters disabled={!hasAuth} />

        <div>
          <h1 className="text-2xl font-semibold">Explore Attorneys</h1>
          <div className="mt-2 text-sm text-gray-600">Showing {(data!.offset) + 1}–{Math.min((data!.offset) + limit, (data!.total))} of {(data!.total)}</div>

          <ul className="mt-4 grid gap-2">
            {data!.hits.map((a) => (
              <li key={a.attorney_id} className="border rounded p-3 flex gap-3">
                {a.headshot_url ? (
                  <img src={a.headshot_url} alt="" className="w-14 h-14 rounded object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded bg-gray-200" />
                )}
                <div>
                  <div className="font-semibold">
                    {(() => {
                      const rec = a as unknown as Record<string, unknown>
                      const linkId = a.attorney_id
                        || (typeof rec.id === 'string' ? (rec.id as string) : undefined)
                        || (typeof rec.code === 'string' ? (rec.code as string) : undefined)
                        || (typeof rec.uuid === 'string' ? (rec.uuid as string) : undefined)
                      const href = linkId
                        ? `/attorney/${encodeURIComponent(linkId)}?name=${encodeURIComponent(a.full_name)}`
                        : `/search?q=${encodeURIComponent(a.full_name)}`
                      return (
                        <a href={href} className="hover:underline">
                          {a.full_name}
                        </a>
                      )
                    })()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {a.title} @ {a.firm_name} — {a.office_city} • JD {a.jd_year ?? '—'}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex gap-2">
            <a className="border rounded px-3 py-1" href={buildHref(Math.max(1, page - 1))}>Prev</a>
            <a className="border rounded px-3 py-1" href={buildHref(page + 1)}>Next</a>
          </div>
        </div>
      </div>
    </main>
  )
}