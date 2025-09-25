import { NextResponse } from "next/server"

// Minimal shared type
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

type AnyRec = Record<string, unknown>

type Trace = { url: string; ok: boolean; status?: number; reason?: string }

function getUpstreamBase(): string | null {
  const base = process.env.UPSTREAM_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || null
  if (!base) return null
  return base.endsWith("/") ? base.slice(0, -1) : base
}

async function tryFetch(id: string, url: string, traces: Trace[]): Promise<Attorney | undefined> {
  try {
    const r = await fetch(url, { cache: "no-store" })
    traces.push({ url, ok: r.ok, status: r.status })
    if (!r.ok) return undefined
    const raw = await r.json()

    let arr: unknown[] | null = null
    if (Array.isArray(raw)) arr = raw
    else if (raw && typeof raw === "object") {
      const o = raw as AnyRec
      if (Array.isArray(o.hits)) arr = o.hits as unknown[]
      else if (Array.isArray(o.data)) arr = o.data as unknown[]
      else if ("attorney_id" in o || "id" in o || "full_name" in o) return o as unknown as Attorney
    }
    if (!arr) return undefined

    const match = arr.find((x) => {
      if (!x || typeof x !== "object") return false
      const t = x as Partial<Attorney> & { id?: string; slug?: string }
      return t.attorney_id === id || t.id === id || t.slug === id
    }) as Attorney | undefined
    return match
  } catch (e) {
    traces.push({ url, ok: false, reason: (e as Error).message })
    return undefined
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: raw } = await ctx.params
  const id = decodeURIComponent(raw)

  const urlObj = new URL(req.url)
  const wantDebug = urlObj.searchParams.get("debug") === "1"

  const upstream = getUpstreamBase()
  if (!upstream) {
    return NextResponse.json({ error: "missing_upstream", hint: "Set UPSTREAM_API_BASE_URL" }, { status: 500 })
  }

  const enc = encodeURIComponent
  const candidates = [
    `${upstream}/attorneys/${enc(id)}`,
    `${upstream}/attorneys?id=${enc(id)}`,
    `${upstream}/search?attorney_id=${enc(id)}&limit=1`,
    `${upstream}/search?id=${enc(id)}&limit=1`,
    `${upstream}/search?ids=${enc(id)}&limit=1`,
    `${upstream}/search?attorney_ids=${enc(id)}&limit=1`,
    `${upstream}/search?attorneyId=${enc(id)}&limit=1`,
    `${upstream}/search?query=${enc(id)}&limit=5`,
  ]

  const traces: Trace[] = []
  let found: Attorney | undefined
  for (const u of candidates) {
    found = await tryFetch(id, u, traces)
    if (found) break
  }

  if (!found) {
    return NextResponse.json(
      wantDebug ? { error: "not_found", id, traces } : { error: "not_found" },
      { status: 404 }
    )
  }

  return NextResponse.json(wantDebug ? { data: found, traces } : found)
}