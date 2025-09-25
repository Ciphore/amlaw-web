'use client'

import { useEffect, useState } from 'react'

type Hit = {
  attorney_id?: string
  full_name?: string
  title?: string
  firm_name?: string
  office_city?: string
}

export default function TestPage() {
  const [data, setData] = useState<Hit[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'
    console.log('API Base (client):', BASE)

    fetch(`${BASE}/search?query=private%20equity&city=New%20York&limit=5`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((json) => setData(Array.isArray(json) ? json : json.hits ?? []))
      .catch((e) => setErr(e.message || 'fetch_failed'))
  }, [])

  if (err) return <pre>❌ Error: {err}</pre>
  if (!data) return <pre>Loading…</pre>

  return (
    <div style={{ padding: 20 }}>
      <h1>API Smoke Test</h1>
      <p>Env: <code>{process.env.NEXT_PUBLIC_API_BASE_URL}</code></p>
      <p>Results: {data.length}</p>
      <ul>
        {data.map((a, i) => (
          <li key={a.attorney_id ?? i}>
            <strong>{a.full_name}</strong> — {a.title} @ {a.firm_name} ({a.office_city})
          </li>
        ))}
      </ul>
    </div>
  )
}
