import { headers, cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import AddToListButton from '@/components/AddToListButton'

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

async function sameOriginApiBase(): Promise<string> {
  const h = await headers()
  const forwardedHost = h.get('x-forwarded-host') || undefined
  const host = forwardedHost || h.get('host') || process.env.VERCEL_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'localhost:3000'
  const protoHeader = h.get('x-forwarded-proto') || undefined
  const proto = protoHeader || (String(host).includes('localhost') ? 'http' : 'https')
  const site = host.startsWith('http') ? host : `${proto}://${host}`
  return `${site}/api`
}

export default async function AttorneyPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const p = await params
  const sp = searchParams ? await searchParams : {}
  const rawName = sp.name
  const name = typeof rawName === 'string' ? rawName.replace(/\+/g, ' ').trim() : Array.isArray(rawName) ? String(rawName[0]).replace(/\+/g, ' ').trim() : undefined

  // Server-side auth gate: redirect unauthenticated users to login
  const cookieStore = await cookies()
  const all = cookieStore.getAll()
  const hasAuth = all.some((c) => c.name === 'sb-access-token' || /^sb-.*-auth-token$/.test(c.name))
  if (!hasAuth) {
    const qs = new URLSearchParams()
    if (name) qs.set('name', name)
    const redirectTo = `/attorney/${encodeURIComponent(p.id)}${qs.size ? `?${qs.toString()}` : ''}`
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`)
  }

  let r: Response
  try {
    const base = await sameOriginApiBase()
    const url = new URL(`${base}/attorney/${encodeURIComponent(p.id)}`)
    if (name && name.length > 0) url.searchParams.set('name', name)
    r = await fetch(url.toString(), { cache: 'no-store' })
  } catch (e) {
    return <div className="p-6">Not found</div>
  }
  if (!r.ok) return <div className="p-6">Not found</div>
  let data: unknown
  try {
    data = await r.json()
  } catch {
    return <div className="p-6">Not found</div>
  }
  const a: Attorney | undefined = (data && typeof data === 'object' && 'attorney_id' in (data as Record<string, unknown>)) ? (data as Attorney) : undefined

  if (!a) return <div className="p-6">Not found</div>

  const titleFirm = [a.title, a.firm_name].filter(Boolean).join(' @ ')

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
          <div className="text-gray-600">{titleFirm}</div>
          <div className="text-gray-600">{a.office_city}{a.office_country ? `, ${a.office_country}` : ''} • JD {a.jd_year ?? '—'}</div>
          <div className="mt-2">
            <AddToListButton item={{
              attorney_id: a.attorney_id,
              full_name: a.full_name,
              title: a.title,
              firm_name: a.firm_name,
              office_city: a.office_city,
              headshot_url: a.headshot_url
            }} />
          </div>
        </div>
      </div>
      {a.bio && <p className="leading-7 whitespace-pre-wrap">{a.bio}</p>}
    </main>
  )
}