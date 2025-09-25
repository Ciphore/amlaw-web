export const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API ?? process.env.API_BASE_URL ?? ""

export type Attorney = {
  attorney_id?: string
  id?: string
  full_name?: string
  title?: string
  firm_name?: string
  office_city?: string
  practice_areas?: string[]
}

export async function searchAttorneys(params: Record<string, string | number | undefined>): Promise<Attorney[]> {
  const u = new URL(`${BASE}/search`, "http://dummy")
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v))
  })
  const qs = u.searchParams.toString()

  const r = await fetch(`${BASE}/search?${qs}`, { cache: "no-store" })
  if (!r.ok) throw new Error("search_failed")
  const data = await r.json()

  return Array.isArray(data) ? data : (Array.isArray(data?.hits) ? data.hits : [])
}

export type Facets = Record<string, Record<string, number>>

export async function fetchFacets(): Promise<Facets> {
  // Try a primary facets endpoint; adjust if your API uses a different path.
  const r = await fetch(`${BASE}/facets`, { cache: "no-store" })
  if (!r.ok) throw new Error("facets_failed")
  const json = await r.json()
  const facets = (json && typeof json === "object" ? (json.facets ?? json) : {}) as unknown
  return (facets && typeof facets === "object") ? facets as Facets : {}
}