import type { NextRequest } from 'next/server'

type Attorney = {
  attorney_id: string
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  title?: string | null
  practice_areas?: string[] | null
  firm_id?: string | null
  firm_name?: string | null
  office_city?: string | null
  office_country?: string | null
  jd_year?: number | null
  bio?: string | null
  headshot_url?: string | null
}

type UpstreamAttorneysResponse = Attorney[] | { hits: Attorney[] }

function extractList(payload: UpstreamAttorneysResponse): Attorney[] {
  return Array.isArray(payload) ? payload : payload.hits
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const upstream = process.env.UPSTREAM_API_BASE_URL || 'https://api.viewport.software'
    const target = new URL('/attorneys', upstream)
    target.searchParams.set('id', id)

    const r = await fetch(target, { cache: 'no-store' })
    if (!r.ok) {
      return new Response(JSON.stringify({ error: 'attorneys_failed' }), {
        status: r.status,
        headers: { 'content-type': 'application/json' },
      })
    }
    const json = (await r.json()) as UpstreamAttorneysResponse
    const list = extractList(json)
    const found = list.find((x) => x && x.attorney_id === id)
    if (!found) {
      return new Response(JSON.stringify({ error: 'not_found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      })
    }
    return new Response(JSON.stringify(found), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'attorneys_failed', detail: (e as Error).message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}