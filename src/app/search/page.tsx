import { fetchFacets, searchAttorneys } from "@/lib/api"

export default async function SearchPage({
  searchParams,
}: { searchParams: Record<string, string | string[] | undefined> }) {
  const query = typeof searchParams.query === "string" ? searchParams.query : ""
  const city = typeof searchParams.city === "string" ? searchParams.city : undefined
  const results = await searchAttorneys({ query, city, limit: 20 })
  const facets = await fetchFacets()

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1>Attorney Search</h1>
      <form method="get" style={{ margin: "16px 0" }}>
        <input
          name="query"
          defaultValue={query}
          placeholder="Search e.g. private equity"
          style={{ padding: 8, width: 320 }}
        />
        <input
          name="city"
          defaultValue={city}
          placeholder="City filter"
          style={{ padding: 8, marginLeft: 8 }}
        />
        <button type="submit" style={{ marginLeft: 8, padding: "8px 12px" }}>
          Search
        </button>
      </form>

      <p>Facet (office_city): {facets.office_city ? Object.keys(facets.office_city).join(", ") : "—"}</p>

      <ul style={{ marginTop: 16 }}>
        {results.map((r) => (
          <li key={r.attorney_id} style={{ marginBottom: 12 }}>
            <strong>{r.full_name}</strong> — {r.title} @ {r.firm_name} — {r.office_city}
          </li>
        ))}
      </ul>
    </main>
  )
}
