import { fetchFacets, searchAttorneys, type SearchResponse } from "@/lib/api"

export default async function SearchPage({
  searchParams,
}: { searchParams: Record<string, string | string[] | undefined> }) {
  const query = typeof searchParams.q === "string" ? searchParams.q : ""
  const city = typeof searchParams.office_city === "string" ? searchParams.office_city : undefined
  const limit = typeof searchParams.limit === 'string' ? Number(searchParams.limit) : 20
  const page = typeof searchParams.page === 'string' ? Number(searchParams.page) : 1
  const offset = (page - 1) * limit

  const data: SearchResponse = await searchAttorneys({ q: query, office_city: city, limit, offset })
  const facets = await fetchFacets()

  const totalPages = Math.max(1, Math.ceil(data.total / data.limit))

  const buildHref = (nextPage: number) => {
    const usp = new URLSearchParams()
    if (query) usp.set('q', query)
    if (city) usp.set('office_city', city)
    usp.set('page', String(nextPage))
    usp.set('limit', String(limit))
    return `?${usp.toString()}`
  }

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1>Attorney Search</h1>
      <form method="get" style={{ margin: "16px 0" }}>
        <input
          name="q"
          defaultValue={query}
          placeholder="Search e.g. private equity"
          style={{ padding: 8, width: 320 }}
        />
        <input
          name="office_city"
          defaultValue={city}
          placeholder="City filter"
          style={{ padding: 8, marginLeft: 8 }}
        />
        <button type="submit" style={{ marginLeft: 8, padding: "8px 12px" }}>
          Search
        </button>
      </form>

      <p>Facet (office_city): {facets.office_city ? Object.keys(facets.office_city).join(", ") : "—"}</p>

      <p style={{ marginTop: 8 }}>Results {data.offset + 1}–{Math.min(data.offset + data.limit, data.total)} of {data.total}</p>

      <ul style={{ marginTop: 16 }}>
        {data.hits.map((r) => (
          <li key={r.attorney_id} style={{ marginBottom: 12 }}>
            <strong>{r.full_name}</strong> — {r.title} @ {r.firm_name} — {r.office_city}
          </li>
        ))}
      </ul>

      {/* Simple pager */}
      <div className="mt-6 flex gap-2">
        <a className="border rounded px-3 py-1" href={buildHref(Math.max(1, page - 1))}>Prev</a>
        <a className="border rounded px-3 py-1" href={buildHref(Math.min(totalPages, page + 1))}>Next</a>
      </div>
    </main>
  )
}
