'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

function hasCookieAuth() {
  if (typeof document === 'undefined') return false
  const raw = document.cookie || ''
  // Supabase sets httpOnly cookies like sb-access-token and sb-<project>-auth-token
  return /(?:^|;\s*)(sb-access-token|sb-.*-auth-token)=/.test(raw)
}

export default function AuthNav() {
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      // Fallback to cookie presence when client is unavailable
      setAuthed(hasCookieAuth())
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(Boolean(data.session) || hasCookieAuth())
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(Boolean(session) || hasCookieAuth())
    })
    return () => {
      // @ts-expect-error - supabase types can vary; guard unsubscribe
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  async function onSignOut() {
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    // Reload to ensure middleware re-evaluates and redirects.
    window.location.href = '/login'
  }

  if (loading) return null

  return (
    <div className="flex items-center gap-2">
      {authed ? (
        <Button variant="outline" onClick={onSignOut}>Sign out</Button>
      ) : (
        <Link href="/login" className="text-sm underline">Sign in</Link>
      )}
    </div>
  )
}