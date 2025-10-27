'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabaseClient'
import { addToList, createList, getLists, type ListItem, type UserList } from '@/lib/lists'
import { Button } from '@/components/ui/button'

function hasCookieAuth() {
  if (typeof document === 'undefined') return false
  return /(?:^|;\s*)(sb-access-token|sb-.*-auth-token)=/.test(document.cookie || '')
}

export default function AddToListButton({ item }: { item: ListItem }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [lists, setLists] = useState<UserList[]>([])
  const [open, setOpen] = useState(false)

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

  const defaultList = useMemo(() => lists[0], [lists])

  function ensureDefaultList() {
    if (!defaultList) {
      const l = createList(userId, 'My List')
      setLists(getLists(userId))
      return l
    }
    return defaultList
  }

  function onAdd() {
    if (!hasCookieAuth()) {
      const redirect = typeof location !== 'undefined' ? encodeURIComponent(location.pathname + location.search) : encodeURIComponent('/explore')
      location.href = `/login?redirect=${redirect}`
      return
    }
    const target = ensureDefaultList()
    addToList(userId, target.id, item)
    setLists(getLists(userId))
    setOpen(false)
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Button variant="outline" onClick={onAdd}>Add to list</Button>
    </div>
  )
}