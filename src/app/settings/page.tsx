import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const hasAuth = cookieStore.getAll().some((c) => c.name === 'sb-access-token' || /^sb-.*-auth-token$/.test(c.name))

  if (!hasAuth) {
    redirect(`/login?redirect=/settings`)
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Account Settings</h1>
      {!hasAuth && (
        <div className="mt-2 text-sm">
          <p>You are not signed in.</p>
          <Link href="/login" className="underline text-primary">Sign in</Link>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="border rounded p-4">
          <h2 className="font-semibold mb-2">Profile</h2>
          <p className="text-sm text-foreground/70">Email, name, and preferences.</p>
          {hasAuth ? (
            <p className="text-sm mt-2">Signed in. Profile management coming soon.</p>
          ) : (
            <p className="text-sm mt-2">Sign in to manage your profile.</p>
          )}
        </section>
        <section className="border rounded p-4">
          <h2 className="font-semibold mb-2">Subscription</h2>
          <p className="text-sm text-foreground/70">Plan type and billing status.</p>
          <p className="text-sm mt-2">Coming soon.</p>
        </section>
        <section className="border rounded p-4">
          <h2 className="font-semibold mb-2">Analytics</h2>
          <p className="text-sm text-foreground/70">Usage insights for your account.</p>
          <p className="text-sm mt-2">Coming soon.</p>
        </section>
      </div>
    </main>
  )
}