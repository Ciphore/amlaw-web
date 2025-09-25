export async function GET(req: Request) {
  try {
    const upstream = process.env.UPSTREAM_API_BASE_URL || 'https://api.viewport.software'
    const incoming = new URL(req.url)
    const target = new URL('/search', upstream)
    target.search = incoming.search

    const r = await fetch(target, { cache: 'no-store' })
    const body = await r.text()
    const contentType = r.headers.get('content-type') || 'application/json'
    return new Response(body, { status: r.status, headers: { 'content-type': contentType } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'search_failed', detail: (e as Error).message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}