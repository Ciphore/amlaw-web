export type Attorney = {
  attorney_id: string
  full_name: string
  first_name: string
  last_name: string
  firm_id: string
  firm_name: string
  office_city: string
  office_country: string
  practice_areas: string[]
  title: string
  bio: string
  jd_year: number
  headshot_url: string | null
}

export type SearchParams = {
  q?: string
  limit?: number
  offset?: number
  firm_id?: string
  office_city?: string
  practice?: string
}

export type SearchResponse = {
  hits: Attorney[]
  total: number
  limit: number
  offset: number
}

export async function searchAttorneys(params: SearchParams = {}): Promise<SearchResponse> {
  const limit = typeof params.limit === 'number' ? params.limit : 20
  const offset = typeof params.offset === 'number' ? params.offset : 0
  const q = (params.q || '').trim()

  const makeEmpty = (): SearchResponse => ({ hits: [], total: 0, limit, offset })

  const API_URL = process.env.UPSTREAM_API_BASE_URL || 'https://api.viewport.software'
  const u = new URL('/v1/search/attorneys', API_URL)

  const usp = u.searchParams
  if (q) usp.set('q', q)
  usp.set('limit', String(limit))
  usp.set('offset', String(offset))
  if (params.office_city) usp.set('office_city', params.office_city)
  if (params.firm_id) usp.set('firm_id', params.firm_id)
  if (params.practice) usp.set('practice', params.practice)

  let r: Response
  try {
    r = await fetch(u.toString(), { cache: 'no-store' })
  } catch {
    return makeEmpty()
  }
  if (!r.ok) return makeEmpty()

  const ct = r.headers.get('content-type') || 'application/json'
  if (!ct.includes('json')) return makeEmpty()

  let json: unknown
  try {
    json = await r.json()
  } catch {
    return makeEmpty()
  }

  const obj = (json || {}) as { items?: Attorney[]; hits?: Attorney[]; estimatedTotal?: number; total?: number }
  const items = obj.items ?? obj.hits ?? []
  const estimatedTotal = obj.estimatedTotal ?? obj.total ?? items.length

  return { hits: items, total: estimatedTotal, limit, offset }
}

export type Facets = Record<string, Record<string, number>>

export async function fetchFacets(): Promise<Facets> {
  const API_URL = process.env.UPSTREAM_API_BASE_URL || 'https://api.viewport.software'
  const u = new URL('/v1/search/facets', API_URL)

  let r: Response
  try {
    r = await fetch(u.toString(), { cache: 'no-store' })
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
  const raw = (json && typeof json === 'object') ? (json as Record<string, unknown>).facets ?? json : {}
  // Gracefully handle array-based facet metadata (searchable/filterable attributes)
  if (raw && typeof raw === 'object') {
    const maybeSA = (raw as Record<string, unknown>).searchableAttributes
    const maybeFA = (raw as Record<string, unknown>).filterableAttributes
    if (Array.isArray(maybeSA) || Array.isArray(maybeFA)) {
      const known = ['practice_areas','office_city','title','firm_name','jd_year']
      const out: Facets = {}
      for (const k of known) out[k] = {}
      return out
    }
  }
  return (raw && typeof raw === 'object') ? raw as Facets : {}
}