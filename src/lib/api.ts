export async function searchAttorneys(params: {
  query?: string
  city?: string
  // ...
}): Promise<Attorney[]> {
  const u = new URL(`${BASE}/search`, "http://dummy")
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "")
      u.searchParams.set(k, String(v))
  })
  const qs = u.searchParams.toString()

  const r = await fetch(`${BASE}/search?${qs}`, { cache: "no-store" })
  if (!r.ok) throw new Error("search_failed")
  const data = await r.json()

  // Ensure we return an array
  return Array.isArray(data) ? data : data.hits || []
}