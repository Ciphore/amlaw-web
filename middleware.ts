import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  // Only protect specific routes; see matcher below.
  const res = NextResponse.next()

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
    return res
  }

  const supabase = createServerClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        res.cookies.set(name, value, options)
      },
      remove(name: string, options: any) {
        res.cookies.set(name, '', { ...options, maxAge: 0 })
      },
    },
  })

  const { data: { session } } = await supabase.auth.getSession()

  // Allow home page even when unauthenticated; protect everything else
  if ((!session || !session.user) && !isLoginRoute && !isHome) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  return res
}

export const config = {
  // Match all routes except Next internal, favicon, health checks, and login page
  matcher: ['/((?!_next|favicon.ico|login|health).*)'],
}