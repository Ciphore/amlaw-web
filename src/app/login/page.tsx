'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

function LoginContent() {
  const sp = useSearchParams()
  const router = useRouter()
  const redirect = sp.get('redirect') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function signInPassword() {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase env vars missing')
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push(redirect)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function signInMagicLink() {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase env vars missing')
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
      if (error) throw error
      setMessage('Check your email for a magic link to sign in.')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to send magic link'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Supabase env vars missing')
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setMessage('Signed out.')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign out failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const envMissing = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Access the attorney directory after authentication.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {envMissing && (
            <div className="text-red-600 text-sm">
              Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
            </div>
          )}
          {message && <div className="text-green-600 text-sm">{message}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={signInPassword} disabled={loading || envMissing}>Sign in</Button>
          <Button variant="outline" onClick={signInMagicLink} disabled={loading || envMissing}>Send magic link</Button>
          <Button variant="ghost" onClick={signOut} disabled={loading || envMissing}>Sign out</Button>
        </CardFooter>
      </Card>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}