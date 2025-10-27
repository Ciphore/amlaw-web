import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export function supabaseServer(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createServerClient(url, key, {
    cookies: {
      async getAll() {
        const store = await cookies()
        return store.getAll().map((c) => ({ name: c.name, value: c.value }))
      },
      async setAll(cookiesToSet) {
        const store = await cookies()
        cookiesToSet.forEach(({ name, value, options }) => {
          store.set(name, value, options)
        })
      },
    },
  })
}