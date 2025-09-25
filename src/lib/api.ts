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
} = {}): Promise<Attorney[]> {
  const u = new URL(`${BASE}/search`, "http://dummy")
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v))
  })
  const r = await fetch(`${BASE}/search?${u.searchParams.toString()}`, { cache: "no-store" })
  if (!r.ok) throw new Error(`search_failed ${r.status}`)
  const json = await r.json()
  // API returns an array already; but be defensive:
  if (Array.isArray(json)) return json
  if (Array.isArray(json.hits)) return json.hits
  return []
}