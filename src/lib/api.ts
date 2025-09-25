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

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api"

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

  const r = await fetch(`${BASE}/search?${u.searchParams.toString()}`, { cache: "no-store" })
  if (!r.ok) throw new Error(`search_failed ${r.status}`)

  type Raw = SearchResponse | Attorney[] | { hits?: Attorney[]; total?: number; limit?: number; offset?: number }
  const json: Raw = await r.json()

  const hits: Attorney[] = Array.isArray(json) ? json : (Array.isArray(json?.hits) ? json.hits! : [])
  const total: number = !Array.isArray(json) && typeof json?.total === 'number' ? json.total : hits.length
  const limit: number = !Array.isArray(json) && typeof json?.limit === 'number' ? json.limit : (typeof params.limit === 'number' ? params.limit : hits.length)
  const offset: number = !Array.isArray(json) && typeof json?.offset === 'number' ? json.offset : (typeof params.offset === 'number' ? params.offset : 0)

  return { hits, total, limit, offset }
}

export type Facets = Record<string, Record<string, number>>

export async function fetchFacets(): Promise<Facets> {
  const r = await fetch(`${BASE}/search/facets`, { cache: "no-store" })
  if (!r.ok) throw new Error(`facets_failed ${r.status}`)
  const json = await r.json()
  const raw = (json && typeof json === "object") ? (json.facets ?? json) : {}
  return (raw && typeof raw === "object") ? raw as Facets : {}
}