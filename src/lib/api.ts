import { headers } from 'next/headers'

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

const PUBLIC_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").trim()

async function resolveBase(): Promise<string> {
  if (PUBLIC_BASE.startsWith('http://') || PUBLIC_BASE.startsWith('https://')) return PUBLIC_BASE
  try {
    const h = await headers()
    const forwardedHost = h.get('x-forwarded-host') || undefined
    const host = forwardedHost || h.get('host') || process.env.VERCEL_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'localhost:3000'
    const protoHeader = h.get('x-forwarded-proto') || undefined
    const proto = protoHeader || (String(host).includes('localhost') ? 'http' : 'https')
    const site = host.startsWith('http') ? host : `${proto}://${host}`
    return `${site}${PUBLIC_BASE}`
  } catch {
    const fallbackSite = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    return `${fallbackSite}${PUBLIC_BASE}`
  }
}

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
  const base = await resolveBase()

  const limitVal = typeof params.limit === 'number' ? params.limit : 20
  const offsetVal = typeof params.offset === 'number' ? params.offset : 0

  const hasFilters = Boolean(
    (params.query && params.query.trim() !== '') ||
    params.city || params.title || params.firm || params.practice ||
    params.jd_min !== undefined || params.jd_max !== undefined
  )

  // Build URLs for search and attorneys
  const searchU = new URL(`${base}/search`, 'http://dummy')
  const attorneysU = new URL(`${base}/attorneys`, 'http://dummy')

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      searchU.searchParams.set(k, String(v))
      attorneysU.searchParams.set(k, String(v))
    }
  })
  // Ask for meta on search to normalize shapes
  searchU.searchParams.set('meta', '1')

  // Helper to normalize responses
  function normalize(json: unknown): SearchResponse {
    type Raw = SearchResponse | Attorney[] | { hits?: Attorney[]; total?: number; limit?: number; offset?: number }
    const raw = json as Raw
    const hits: Attorney[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.hits) ? raw.hits! : [])
    const total: number = !Array.isArray(raw) && typeof raw?.total === 'number' ? raw.total : hits.length
    const limit: number = !Array.isArray(raw) && typeof raw?.limit === 'number' ? raw.limit : limitVal
    const offset: number = !Array.isArray(raw) && typeof raw?.offset === 'number' ? raw.offset : offsetVal
    return { hits, total, limit, offset }
  }

  // First try search when filters are present; otherwise try search, then fall back to attorneys
  const tryFetch = async (url: URL): Promise<SearchResponse | null> => {
    let r: Response
    try {
      r = await fetch(`${url.origin}${url.pathname}?${url.searchParams.toString()}`, { cache: 'no-store' })
    } catch {
      return null
    }
    if (!r.ok) return null
    const ct = r.headers.get('content-type') || 'application/json'
    if (!ct.includes('json')) return null
    try {
      const json = await r.json()
      const norm = normalize(json)
      return norm
    } catch {
      return null
    }
  }

  if (hasFilters) {
    const fromSearch = await tryFetch(searchU)
    return fromSearch ?? { hits: [], total: 0, limit: limitVal, offset: offsetVal }
  }

  // No filters: prefer search; if it returns no hits, fallback to attorneys
  const fromSearch = await tryFetch(searchU)
  if (fromSearch && fromSearch.hits.length > 0) {
    return fromSearch
  }

  const fromAttorneys = await tryFetch(attorneysU)
  return fromAttorneys ?? { hits: [], total: 0, limit: limitVal, offset: offsetVal }
}

export type Facets = Record<string, Record<string, number>>

export async function fetchFacets(): Promise<Facets> {
  const base = await resolveBase()
  let r: Response
  try {
    r = await fetch(`${base}/search/facets`, { cache: 'no-store' })
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
  return (raw && typeof raw === 'object') ? raw as Facets : {}
}