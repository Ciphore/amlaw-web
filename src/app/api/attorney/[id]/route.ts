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

// Normalization helpers to make sure profile page always has consistent fields
type UnknownRec = Record<string, unknown>
function pickStr(obj: UnknownRec | undefined, keys: string[]): string | undefined {
  if (!obj) return undefined
  for (const k of keys) {
    const v = (obj as UnknownRec)[k]
    if (typeof v === 'string' && v.trim() !== '') return v
  }
  return undefined
}
function pickNum(obj: UnknownRec | undefined, keys: string[]): number | undefined {
  if (!obj) return undefined
  for (const k of keys) {
    const v = (obj as UnknownRec)[k]
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v)
  }
  return undefined
}
function normalizeAttorney(raw: unknown): Attorney | null {
  if (!raw || typeof raw !== 'object') return null
  const rec = raw as UnknownRec
  const id = pickStr(rec, ['attorney_id', 'id', 'code', 'uuid'])
  const first = pickStr(rec, ['first_name', 'firstName'])
  const last = pickStr(rec, ['last_name', 'lastName'])
  const fullBase = pickStr(rec, ['full_name', 'name']) || [first, last].filter(Boolean).join(' ').trim()
  const full = fullBase && fullBase.length > 0 ? fullBase : undefined
  if (!id || !full) return null
  const title = pickStr(rec, ['title', 'job_title', 'position', 'role'])
  const firm_name = pickStr(rec, ['firm_name', 'firm', 'firmName', 'law_firm', 'company', 'employer', 'organization'])
  const office_city = pickStr(rec, ['office_city', 'city', 'location_city', 'office', 'officeCity'])
  const office_country = pickStr(rec, ['office_country', 'country', 'location_country'])
  const jd_year = pickNum(rec, ['jd_year', 'jdYear', 'graduation_year', 'year'])
  const bio = pickStr(rec, ['bio', 'biography', 'summary', 'about'])
  const headshot_url = pickStr(rec, ['headshot_url', 'avatar_url', 'photo_url', 'image_url', 'image'])
  return {
    attorney_id: id,
    full_name: full,
    title: title ?? null,
    firm_name: firm_name ?? null,
    office_city: office_city ?? null,
    office_country: office_country ?? null,
    jd_year: jd_year ?? null,
    bio: bio ?? null,
    headshot_url: headshot_url ?? null,
  }
}

async function fetchByDirectPath(base: string, id: string): Promise<Attorney | null> {
  const u = new URL(`/v1/attorneys/${encodeURIComponent(id)}`, base)
  const r = await fetch(u, { cache: 'no-store' })
  if (r.status === 404) return null
  if (!r.ok) return null
  try {
    const json = (await r.json()) as unknown
    return normalizeAttorney(json)
  } catch {
    return null
  }
}

async function searchExactById(base: string, id: string, params: Record<string, string>): Promise<Attorney | null> {
  const u = new URL('/v1/search/attorneys', base)
  // Map provided params to upstream; always include q=id for robustness
  Object.entries(params).forEach(([k, v]) => {
    if (k === 'query') u.searchParams.set('q', v)
    else u.searchParams.set(k, v)
  })
  if (!u.searchParams.has('q')) u.searchParams.set('q', id)
  // keep limit modest but >1 to be safe
  if (!u.searchParams.has('limit')) u.searchParams.set('limit', '25')

  const r = await fetch(u, { cache: 'no-store' })
  if (!r.ok) return null
  const json = (await r.json()) as (Attorney[] | { items?: Attorney[]; hits?: Attorney[] })
  const list = Array.isArray(json) ? json : (json.items || json.hits || [])
  const found = list.find((item) => {
    const rec = item as UnknownRec
    const itemId = pickStr(rec, ['attorney_id', 'id', 'code', 'uuid'])
    return itemId === id
  })
  return normalizeAttorney(found as unknown)
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

    // Fallback to text query if direct path not available
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