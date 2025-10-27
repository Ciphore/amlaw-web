'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabaseClient'
import { addToList, createList, deleteList, getLists, removeFromList, type UserList } from '@/lib/lists'
import { Button } from '@/components/ui/button'

export default function ListsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [lists, setLists] = useState<UserList[]>([])
  const [name, setName] = useState('')

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        const uid = data.session?.user?.id || null
        setUserId(uid)
        setLists(getLists(uid))
      })
    } else {
      setUserId(null)
      setLists(getLists(null))
    }
  }, [])

  function refresh() {
    setLists(getLists(userId))
  }

  function onCreate() {
    if (!name.trim()) return
    createList(userId, name.trim())
    setName('')
    refresh()
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">My Lists</h1>

      <div className="mt-4 flex gap-2">
        <input className="border rounded px-3 py-2 flex-1" placeholder="New list name" value={name} onChange={(e)=>setName(e.target.value)} />
        <Button onClick={onCreate}>Create</Button>
      </div>

      <div className="mt-8 space-y-6">
        {lists.length === 0 && <p className="text-sm text-foreground/70">No lists yet. Create one above, then add attorneys from Search or their profile page.</p>}
        {lists.map((l) => (
          <div key={l.id} className="border rounded p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{l.name}</h2>
              <Button variant="outline" size="sm" onClick={()=>{ deleteList(userId, l.id); refresh() }}>Delete</Button>
            </div>
            <ul className="mt-3 space-y-2">
              {l.items.length === 0 && <li className="text-sm text-foreground/60">No attorneys in this list.</li>}
              {l.items.map((it) => (
                <li key={it.attorney_id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.full_name}</div>
                    <div className="text-sm text-foreground/60">{it.title} @ {it.firm_name} — {it.office_city}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a className="text-primary underline" href={`/attorney/${encodeURIComponent(it.attorney_id)}?name=${encodeURIComponent(it.full_name)}`}>View</a>
                    <Button variant="outline" size="sm" onClick={()=>{ removeFromList(userId, l.id, it.attorney_id); refresh() }}>Remove</Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  )
}