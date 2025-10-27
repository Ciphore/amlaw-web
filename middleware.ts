import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  // Only protect specific routes; see matcher below.
  let supabaseRes = NextResponse.next({ request: req })

  const pathname = req.nextUrl.pathname
  const isLoginRoute = pathname.startsWith('/login')
  const isHome = pathname === '/'
  const isExplore = pathname === '/explore'

  const hasEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!hasEnv) {
    // Without Supabase env setup, force redirect to login for protected routes; only Home is public.
    if (!isLoginRoute && !isHome) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search)
      return NextResponse.redirect(loginUrl)
    }
    return supabaseRes
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Ensure cookies are applied to both the request and the response
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          supabaseRes = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) => supabaseRes.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Allow home page even when unauthenticated; protect everything else
  if ((!session || !session.user) && !isLoginRoute && !isHome) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseRes
}

export const config = {
  // Match all routes except Next internal, favicon, health checks, and login page
  matcher: ['/((?!_next|favicon.ico|login|health).*)'],
}