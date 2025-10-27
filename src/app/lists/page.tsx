import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { getLists, saveLists, deleteList, createList, type UserList } from '@/lib/lists'

export default async function ListsPage() {
  const cookieStore = await cookies()
  const hasAuth = cookieStore.getAll().some((c)=>c.name === 'sb-access-token' || /^sb-.*-auth-token$/.test(c.name))
  if (!hasAuth) redirect('/login?redirect=/lists')

  const userId = null
  const lists: UserList[] = getLists(userId)

  function refresh() {
    // no-op for server component preview; real implementation would revalidate
  }

  function onCreate() {
    createList(userId, 'My List')
    refresh()
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Lists</h1>
        <Button variant="outline" onClick={onCreate}>New list</Button>
      </div>

      <div className="mt-6 grid gap-4">
        {lists.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No lists yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/70">Create your first list to start organizing attorneys.</p>
            </CardContent>
          </Card>
        )}

        {lists.map((l)=> (
          <Card key={l.id}>
            <CardContent>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{l.name}</h2>
                <Button variant="outline" onClick={()=>{ deleteList(userId, l.id); refresh() }}>Delete</Button>
              </div>
              <ul className="mt-3 space-y-2">
                {l.items.length === 0 && <li className="text-sm text-foreground/60">No attorneys in this list.</li>}
                {l.items.map((it)=> (
                  <li key={it.attorney_id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{it.full_name}</div>
                      {it.firm_name && <div className="text-sm text-foreground/60">{it.firm_name}</div>}
                    </div>
                    <Link href={`/attorney/${encodeURIComponent(it.attorney_id)}${it.full_name ? `?name=${encodeURIComponent(it.full_name)}` : ''}`} className="text-sm underline">View</Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}