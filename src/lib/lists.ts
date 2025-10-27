// Utilities for managing user-created attorney lists in localStorage
// Client-only; import inside client components.

export type ListItem = {
  attorney_id: string
  full_name: string
  title?: string
  firm_name?: string
  office_city?: string
  headshot_url?: string | null
}

export type UserList = {
  id: string
  name: string
  items: ListItem[]
}

function storageKey(userId: string | null) {
  const id = userId || 'guest'
  return `amlaw_lists_${id}`
}

export function getLists(userId: string | null): UserList[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(userId))
    const parsed = raw ? JSON.parse(raw) as UserList[] : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLists(userId: string | null, lists: UserList[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(lists))
  } catch {
    // ignore
  }
}

export function createList(userId: string | null, name: string): UserList {
  const lists = getLists(userId)
  const id = `${Date.now()}`
  const list: UserList = { id, name, items: [] }
  saveLists(userId, [...lists, list])
  return list
}

export function addToList(userId: string | null, listId: string, item: ListItem) {
  const lists = getLists(userId)
  const next = lists.map((l) => l.id === listId ? { ...l, items: upsertItem(l.items, item) } : l)
  saveLists(userId, next)
}

function upsertItem(items: ListItem[], item: ListItem) {
  const idx = items.findIndex((x) => x.attorney_id === item.attorney_id)
  if (idx >= 0) {
    const copy = [...items]
    copy[idx] = item
    return copy
  }
  return [...items, item]
}

export function removeFromList(userId: string | null, listId: string, attorney_id: string) {
  const lists = getLists(userId)
  const next = lists.map((l) => l.id === listId ? { ...l, items: l.items.filter((x)=>x.attorney_id !== attorney_id) } : l)
  saveLists(userId, next)
}

export function deleteList(userId: string | null, listId: string) {
  const lists = getLists(userId)
  saveLists(userId, lists.filter((l)=>l.id !== listId))
}