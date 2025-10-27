import { fetchFacets } from '@/lib/api'
import Link from 'next/link'

export default async function Home() {
  // Fetch facets to power high-level intelligence cards
  const facets = await fetchFacets()
  const topCities = Object.entries(facets.office_city || {}).sort((a,b)=>b[1]-a[1]).slice(0,8)
  const topPractices = Object.entries((facets.practice_areas || facets.practice || {})).sort((a,b)=>b[1]-a[1]).slice(0,8)
  const topFirms = Object.entries(facets.firm_name || {}).sort((a,b)=>b[1]-a[1]).slice(0,8)

  return (
    <main className="p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <section>
          <h1 className="text-3xl font-semibold">Legal Intelligence</h1>
          <p className="text-sm text-foreground/70 mt-2">Explore attorney distribution across firms, cities, and practice areas.</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded p-4">
            <h2 className="font-semibold mb-2">Top Cities</h2>
            <ul className="space-y-1">
              {topCities.length === 0 && <li className="text-sm text-foreground/60">No data available</li>}
              {topCities.map(([city,count])=> (
                <li key={city} className="text-sm flex justify-between"><span>{city}</span><span className="text-foreground/60">{count}</span></li>
              ))}
            </ul>
          </div>
          <div className="border rounded p-4">
            <h2 className="font-semibold mb-2">Top Practice Areas</h2>
            <ul className="space-y-1">
              {topPractices.length === 0 && <li className="text-sm text-foreground/60">No data available</li>}
              {topPractices.map(([pa,count])=> (
                <li key={pa} className="text-sm flex justify-between"><span>{pa}</span><span className="text-foreground/60">{count}</span></li>
              ))}
            </ul>
          </div>
          <div className="border rounded p-4">
            <h2 className="font-semibold mb-2">Top Firms</h2>
            <ul className="space-y-1">
              {topFirms.length === 0 && <li className="text-sm text-foreground/60">No data available</li>}
              {topFirms.map(([firm,count])=> (
                <li key={firm} className="text-sm flex justify-between"><span>{firm}</span><span className="text-foreground/60">{count}</span></li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex gap-3">
          <Link href="/explore" className="border rounded px-3 py-2">Explore Directory</Link>
          <Link href="/search" className="border rounded px-3 py-2">Advanced Search</Link>
          <Link href="/lists" className="border rounded px-3 py-2">Manage Lists</Link>
        </section>
      </div>
    </main>
  )
}