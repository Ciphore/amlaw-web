import type { NextRequest } from 'next/server'

type Attorney = {
  attorney_id: string
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  title?: string | null
  practice_areas?: string[] | null
  firm_id?: string | null
  firm_name?: string | null
  office_city?: string | null
  office_country?: string | null
  jd_year?: number | null
  bio?: string | null
  headshot_url?: string | null
}

// Upstream response can be either a raw array or an object with `hits`
type UpstreamResponse = Attorney[] | { hits: Attorney[] }

function extractList(payload: UpstreamResponse): Attorney[] {
  return Array.isArray(payload) ? payload : payload.hits
}

async function fetchByDirectPath(base: string, id: string): Promise<Attorney | null> {
  const u = new URL(`/attorneys/${encodeURIComponent(id)}`, base)
  const r = await fetch(u, { cache: 'no-store' })
  if (r.status === 404) return null
  if (!r.ok) return null
  try {
    const json = (await r.json()) as Attorney
    if (json && typeof json === 'object' && 'attorney_id' in json) return json
    return null
  } catch {
    return null
  }
}

async function searchExactById(base: string, id: string, params: Record<string, string>): Promise<Attorney | null> {
  const u = new URL('/search', base)
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v))
  // keep limit modest but >1 to be safe
  if (!u.searchParams.has('limit')) u.searchParams.set('limit', '25')
  // ask for meta to normalize shapes
  if (!u.searchParams.has('meta')) u.searchParams.set('meta', '1')

  const r = await fetch(u, { cache: 'no-store' })
  if (!r.ok) return null
  const json = (await r.json()) as UpstreamResponse
  const list = extractList(json)
  return list.find((x) => x && x.attorney_id === id) ?? null
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const upstream = process.env.UPSTREAM_API_BASE_URL || 'https://api.viewport.software'

    // 0) Prefer direct path if the upstream supports /attorneys/:id
    const byPath = await fetchByDirectPath(upstream, id)
    if (byPath) {
      return new Response(JSON.stringify(byPath), { status: 200, headers: { 'content-type': 'application/json' } })
    }

    // 1) Prefer exact filters supported by upstream search
    const byAttorneyId = await searchExactById(upstream, id, { attorney_id: id })
    if (byAttorneyId) {
      return new Response(JSON.stringify(byAttorneyId), { status: 200, headers: { 'content-type': 'application/json' } })
    }

    // 2) Try alternative keys commonly used
    const byId = await searchExactById(upstream, id, { id })
    if (byId) {
      return new Response(JSON.stringify(byId), { status: 200, headers: { 'content-type': 'application/json' } })
    }

    const byCode = await searchExactById(upstream, id, { code: id })
    if (byCode) {
      return new Response(JSON.stringify(byCode), { status: 200, headers: { 'content-type': 'application/json' } })
    }

    // 3) Fallback to text query if no exact-filter route works
    const byQuery = await searchExactById(upstream, id, { query: id, limit: '50' })
    if (byQuery) {
      return new Response(JSON.stringify(byQuery), { status: 200, headers: { 'content-type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'not_found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'attorneys_failed', detail: (e as Error).message }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    )
  }
}