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

// Enforce absolute API base; fall back to upstream if provided value is relative
const envApiUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim()
const API_URL = /^https?:\/\//.test(envApiUrl) ? envApiUrl : 'https://api.viewport.software'
const RAW_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || '/v1'
const API_PREFIX = RAW_PREFIX.startsWith('/') ? RAW_PREFIX : `/${RAW_PREFIX}`

export async function searchAttorneys(params: SearchParams = {}): Promise<SearchResponse> {
  const url = new URL(`${API_URL}${API_PREFIX}/search/attorneys`)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  })

  let res: Response
  try {
    res = await fetch(url.toString(), { cache: 'no-store' })
  } catch (e) {
    // Network failure: return empty results to avoid 500s
    return { hits: [], total: 0, limit: Number(url.searchParams.get('limit') || 20), offset: Number(url.searchParams.get('offset') || 0) }
  }

  // If upstream returns 404 or other non-OK, degrade gracefully
  if (!res.ok) {
    return { hits: [], total: 0, limit: Number(url.searchParams.get('limit') || 20), offset: Number(url.searchParams.get('offset') || 0) }
  }

  // Attempt JSON parse, fallback if body isn’t JSON
  let data: unknown
  try {
    data = await res.json()
  } catch {
    return { hits: [], total: 0, limit: Number(url.searchParams.get('limit') || 20), offset: Number(url.searchParams.get('offset') || 0) }
  }

  const obj = (data || {}) as {
    items?: Attorney[]
    estimatedTotal?: number
    hits?: Attorney[]
    total?: number
  }

  const items = obj.items ?? obj.hits ?? []
  const estimatedTotal = obj.estimatedTotal ?? obj.total ?? items.length

  return {
    hits: items,
    total: estimatedTotal,
    limit: Number(url.searchParams.get('limit') || 20),
    offset: Number(url.searchParams.get('offset') || 0),
  }
}

export type Facets = Record<string, Record<string, number>>

export async function fetchFacets(): Promise<Facets> {
  // Fetch via Next proxy to avoid CORS in browser; mirrors /v1/search/facets
  const base = (typeof window === 'undefined') ? process.env.NEXT_PUBLIC_SITE_URL || '' : ''
  let r: Response
  try {
    r = await fetch(`${base}/api/search/facets`, { cache: 'no-store' })
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