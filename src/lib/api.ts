export type Attorney = {
  attorney_id: string
  full_name: string
  title?: string
  practice_areas?: string[]
  firm_name?: string
  office_city?: string
  headshot_url?: string | null
  jd_year?: number | null
}

export type SearchResponse = {
  hits: Attorney[]
  total: number
  limit: number
  offset: number
}

const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").trim()

export async function searchAttorneys(params: {
  query?: string
  city?: string
  title?: string
  firm?: string
  practice?: string
  jd_min?: number
  jd_max?: number
  limit?: number
  offset?: number
} = {}): Promise<SearchResponse> {
  const u = new URL(`${BASE}/search`, "http://dummy")
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v))
  })
  // Always request meta from the backend
  u.searchParams.set('meta', '1')

  const limitVal = typeof params.limit === 'number' ? params.limit : 20
  const offsetVal = typeof params.offset === 'number' ? params.offset : 0

  let r: Response
  try {
    r = await fetch(`${BASE}/search?${u.searchParams.toString()}`, { cache: "no-store" })
  } catch {
    return { hits: [], total: 0, limit: limitVal, offset: offsetVal }
  }
  if (!r.ok) return { hits: [], total: 0, limit: limitVal, offset: offsetVal }

  const ct = r.headers.get('content-type') || 'application/json'
  if (!ct.includes('json')) return { hits: [], total: 0, limit: limitVal, offset: offsetVal }

  type Raw = SearchResponse | Attorney[] | { hits?: Attorney[]; total?: number; limit?: number; offset?: number }
  let json: Raw
  try {
    json = await r.json()
  } catch {
    return { hits: [], total: 0, limit: limitVal, offset: offsetVal }
  }

  const hits: Attorney[] = Array.isArray(json) ? json : (Array.isArray(json?.hits) ? json.hits! : [])
  const total: number = !Array.isArray(json) && typeof json?.total === 'number' ? json.total : hits.length
  const limit: number = !Array.isArray(json) && typeof json?.limit === 'number' ? json.limit : limitVal
  const offset: number = !Array.isArray(json) && typeof json?.offset === 'number' ? json.offset : offsetVal

  return { hits, total, limit, offset }
}

export type Facets = Record<string, Record<string, number>>

export async function fetchFacets(): Promise<Facets> {
  let r: Response
  try {
    r = await fetch(`${BASE}/search/facets`, { cache: "no-store" })
  } catch {
    return {}
  }
  if (!r.ok) return {}
  const ct = r.headers.get('content-type') || 'application/json'
  if (!ct.includes('json')) return {}
  let json: unknown
  try {
    json = await r.json()
  } catch {
    return {}
  }
  const raw = (json && typeof json === "object") ? (json as Record<string, unknown>).facets ?? json : {}
  return (raw && typeof raw === "object") ? raw as Facets : {}
}