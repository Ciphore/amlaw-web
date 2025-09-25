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

export default async function AttorneyPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const p = await params
  const spRaw = (await searchParams?.catch(() => ({}))) || {}
  const sp = spRaw as Record<string, string | string[] | undefined>
  const pick = (v: string | string[] | undefined) => (typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined)
  const debug = pick(sp['debug']) === '1'
  const id = decodeURIComponent(p.id)

  type AnyRec = Record<string, unknown>
  type Trace = { url: string; ok: boolean; status?: number; reason?: string }
  const traces: Trace[] = []

  async function tryFetch(u: string): Promise<Attorney | undefined> {
    try {
      const r = await fetch(u, { cache: 'no-store' })
      traces.push({ url: u, ok: r.ok, status: r.status })
      if (!r.ok) return undefined
      const raw: unknown = await r.json()

      let arr: unknown[] | null = null
      if (Array.isArray(raw)) {
        arr = raw
      } else if (raw && typeof raw === 'object') {
        const o = raw as AnyRec
        if (Array.isArray(o.hits)) arr = o.hits as unknown[]
        else if (Array.isArray(o.data)) arr = o.data as unknown[]
        else if ('attorney_id' in o || 'id' in o || 'full_name' in o) {
          return o as unknown as Attorney
        }
      }

      if (!arr) return undefined
      const match = arr.find((x) => {
        if (!x || typeof x !== 'object') return false
        const t = x as Partial<Attorney> & { id?: string; slug?: string }
        return t.attorney_id === id || t.id === id || t.slug === id
      }) as Attorney | undefined
      return match
    } catch (e) {
      traces.push({ url: u, ok: false, reason: (e as Error).message })
      return undefined
    }
  }

  const base = '/api/attorney'
  const enc = encodeURIComponent
  const candidates: string[] = [
    `${base}/${enc(id)}`,
  ]

  let a: Attorney | undefined
  for (const u of candidates) {
    a = await tryFetch(u)
    if (a) break
  }

  if (!a) {
    return (
      <div className="p-6 space-y-4">
        <div>Not found</div>
        {debug && (
          <details className="mt-4" open>
            <summary className="cursor-pointer">Debug traces</summary>
            <ul className="text-sm text-gray-600 list-disc pl-6">
              {traces.map((t, i) => (
                <li key={i}><code>{t.url}</code> — {String(t.ok)}{t.status ? ` (${t.status})` : ''}{t.reason ? ` — ${t.reason}` : ''}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    )
  }

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