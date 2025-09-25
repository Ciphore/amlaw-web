// Ensure URL.canParse exists in runtimes where it's missing
// Minimal, typed polyfill executed at module load time
{
  type URLWithCanParse = typeof URL & { canParse?: (input: string, base?: string) => boolean }
  const URLPolyfill = (globalThis.URL as unknown) as URLWithCanParse
  if (typeof URL !== 'undefined' && !URLPolyfill.canParse) {
    URLPolyfill.canParse = (input: string, base?: string) => {
      try {
        // attempt parse
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        new URL(input, base)
        return true
      } catch {
        return false
      }
    }
  }
}

type Attorney = {
  attorney_id: string
  full_name: string
  title?: string
  firm_name?: string
  office_city?: string
  office_country?: string
  jd_year?: number
  bio?: string
  headshot_url?: string
}

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

function absoluteBase(): string {
  if (BASE.startsWith('http')) return BASE
  const site =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  return `${site}${BASE}`
}

export default async function AttorneyPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params
  const url = `${absoluteBase()}/attorneys?id=${encodeURIComponent(p.id)}`
  const r = await fetch(new URL(url), { cache: 'no-store' })
  const json = await r.json()
  let a: Attorney | undefined
  if (Array.isArray(json)) {
    const arr = json as Attorney[]
    a = arr.find((x) => x && x.attorney_id === p.id) ?? arr[0]
  } else {
    a = json as Attorney | undefined
  }

  if (!a) return <div className="p-6">Not found</div>

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex gap-4">
        {a.headshot_url ? (
          <img src={a.headshot_url} className="w-28 h-28 rounded object-cover" alt="" />
        ) : (
          <div className="w-28 h-28 rounded bg-gray-200" />
        )}
        <div>
          <h1 className="text-2xl font-semibold">{a.full_name}</h1>
          <div className="text-gray-600">{a.title} @ {a.firm_name}</div>
          <div className="text-gray-600">{a.office_city}{a.office_country ? `, ${a.office_country}` : ''} • JD {a.jd_year ?? '—'}</div>
        </div>
      </div>
      {a.bio && <p className="leading-7 whitespace-pre-wrap">{a.bio}</p>}
    </main>
  )
}