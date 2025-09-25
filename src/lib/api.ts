export type Attorney = {
  attorney_id: string
  firm_id?: string
  firm_name?: string
  first_name?: string
  last_name?: string
  full_name?: string
  title?: string
  practice_areas?: string[]
  office_city?: string
  office_country?: string
  jd_year?: number
  headshot_url?: string
  bio?: string
}

export type Facets = {
  practice_areas?: Record<string, number>
  office_city?: Record<string, number>
  title?: Record<string, number>
  firm_name?: Record<string, number>
  jd_year?: Record<string, number>
}

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api"

export async function fetchFacets(): Promise<Facets> {
  const r = await fetch(`${BASE}/search/facets`, { next: { revalidate: 60 } })
  if (!r.ok) throw new Error("facets_failed")
  return r.json()
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
}): Promise<Attorney[]> {
  const u = new URL(`${BASE}/search`, "http://dummy")
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v))
  })
  const qs = u.searchParams.toString()
  const r = await fetch(`${BASE}/search?${qs}`, { cache: "no-store" })
  if (!r.ok) throw new Error("search_failed")
  return r.json()
}
