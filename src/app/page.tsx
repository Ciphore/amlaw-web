'use client'
import { useEffect, useState } from 'react'

type Attorney = {
  attorney_id?: string
  id?: string
  full_name?: string
  title?: string
  firm_name?: string
  office_city?: string
  practice_areas?: string[]
}

export default function Home() {
  const [data, setData] = useState<Attorney[]>([])
  const [q, setQ] = useState('private equity')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API ?? process.env.API_BASE_URL ?? ''
        const res = await fetch(`${base}/search?query=${encodeURIComponent(q)}&city=New%20York`, { cache: 'no-store' })
        const json = await res.json()
        const arr = Array.isArray(json) ? json : (Array.isArray(json?.hits) ? json.hits : [])
        setData(arr)
      } catch (e) {
        setError('Failed to fetch results')
        setData([])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [q])

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Attorney Search (MVP)</h1>
      <input
        className="border p-2 rounded w-full max-w-md"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search query"
      />
      {error && <div className="text-red-600 mt-3">{error}</div>}
      {loading && <div className="text-gray-600 mt-3">Loading...</div>}
      <ul className="mt-6 space-y-3">
        {data.map((a: Attorney) => (
          <li key={a.attorney_id ?? a.id ?? a.full_name} className="border rounded p-3">
            <div className="font-semibold">{a.full_name}</div>
            <div className="text-sm text-gray-600">
              {a.title} — {a.firm_name} — {a.office_city}
            </div>
            <div className="text-sm mt-1">{Array.isArray(a.practice_areas) ? a.practice_areas.join(', ') : ''}</div>
          </li>
        ))}
      </ul>
    </main>
  )
}
