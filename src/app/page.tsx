import { searchAttorneys } from "@/lib/api"

export default async function Home() {
  const data = await searchAttorneys({ query: "private equity", city: "New York", limit: 10 })
  const list = Array.isArray(data) ? data : []

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Attorney Search</h1>
      <p className="text-sm text-gray-500">Results: {list.length}</p>

      <ul className="mt-6 space-y-3">
        {list.map((a) => (
          <li key={a.attorney_id} className="border rounded p-3">
            <div className="font-semibold">{a.full_name}</div>
            <div className="text-sm text-gray-600">
              {a.title} · {a.firm_name} · {a.office_city}
            </div>
            {a.practice_areas?.length ? (
              <div className="text-xs text-gray-500 mt-1">{a.practice_areas.join(" · ")}</div>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  )
}