'use client'
import { useEffect, useState } from 'react'

export default function Home() {
  const [data, setData] = useState<any[]>([])
  const [q, setQ] = useState('private equity')

  useEffect(() => {
    const run = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API ?? process.env.API_BASE_URL ?? ''}/search?query=${encodeURIComponent(q)}&city=New%20York`)
      const json = await res.json()
      setData(json)
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
      <ul className="mt-6 space-y-3">
        {data.map((a: any) => (
          <li key={a.attorney_id} className="border rounded p-3">
            <div className="font-semibold">{a.full_name}</div>
            <div className="text-sm text-gray-600">
              {a.title} — {a.firm_name} — {a.office_city}
            </div>
            <div className="text-sm mt-1">{a.practice_areas?.join(', ')}</div>
          </li>
        ))}
      </ul>
    </main>
  )
}
