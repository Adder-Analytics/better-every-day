// Quick lists — a saved set of task lines you can drop into a day in one tap.
//
// Routines cover the things you do on a cadence (a task that recurs on its own
// each day it's due); "reuse a task" brings back a single title you've typed
// before. Neither covers the set of tasks that belong together but aren't a
// schedule: the five things you always do to close out the week, a trip's
// packing list, everything a new client needs set up. A quick list is that —
// named once, then added whole whenever the occasion comes round.
//
// A list is just an ordered set of plain lines. Adding one runs each line
// through the same quick-add parsing the add box uses, so a line can still carry
// a #tag, a time, an estimate, or a "!" — the list is a shortcut into the normal
// add path, not a second kind of task. Because of that, lists never touch the
// stored task shape: they live in their own `bed-lists` key, and a task export
// or import doesn't carry them (they're reusable scaffolding, not your day's
// data). A tiny external store (mirroring lib/tagcolors and lib/theme) lets the
// manager re-render on a change and syncs edits across tabs.

import { useSyncExternalStore } from 'react'

export type QuickList = {
  id: string
  name: string
  items: string[]
  createdDate: string // YYYY-MM-DD, local time — when the list was first saved
}

const STORAGE_KEY = 'bed-lists'

// Sane caps, so a runaway paste or a corrupt file can't bloat storage or the
// manager. Generous enough that a real list never hits them.
const MAX_LISTS = 50
const MAX_ITEMS = 50
const MAX_NAME = 80
const MAX_ITEM = 200

// A stable empty array for the server / first-paint snapshot, so the manager
// renders nothing until the client reads saved lists just after hydration — no
// server/client mismatch, the same way the theme and tag colors are applied.
const EMPTY: QuickList[] = Object.freeze([]) as unknown as QuickList[]

// The parsed lists, cached so getSnapshot hands back a stable reference between
// changes (useSyncExternalStore compares snapshots by identity). Invalidated on
// a cross-tab write and replaced on a local one, so a new reference always
// signals a real change and nothing else does.
let cache: QuickList[] | null = null

// A short, collision-resistant id — crypto.randomUUID where available, with a
// plain fallback so an older browser (or a non-secure context) still works.
function makeId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {}
  return `l-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Clean a list's items: trim each line, drop the blanks, clamp overlong lines,
// and cap the count. A list with nothing left is not a list.
function normalizeItems(items: unknown): string[] {
  if (!Array.isArray(items)) return []
  return items
    .filter((x): x is string => typeof x === 'string')
    .map(s => s.trim().slice(0, MAX_ITEM))
    .filter(Boolean)
    .slice(0, MAX_ITEMS)
}

// Read one stored entry into a valid QuickList, or null if it can't be trusted.
// Every field is checked, so a hand-edited or partial file degrades to "skip
// this entry" rather than rendering something broken.
function parseList(raw: unknown): QuickList | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const name = typeof o.name === 'string' ? o.name.trim().slice(0, MAX_NAME) : ''
  const items = normalizeItems(o.items)
  if (!name || items.length === 0) return null
  const id = typeof o.id === 'string' && o.id ? o.id : makeId()
  const createdDate = typeof o.createdDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.createdDate) ? o.createdDate : today()
  return { id, name, items, createdDate }
}

function load(): QuickList[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.lists) ? parsed.lists : []
    const out: QuickList[] = []
    for (const entry of arr) {
      const list = parseList(entry)
      if (list) out.push(list)
      if (out.length >= MAX_LISTS) break
    }
    return out
  } catch {
    return []
  }
}

const listeners = new Set<() => void>()

function persist(next: QuickList[]) {
  cache = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, lists: next }))
  } catch {}
  listeners.forEach(l => l())
}

export const listsStore = {
  subscribe(cb: () => void) {
    listeners.add(cb)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        cache = null
        cb()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(cb)
      window.removeEventListener('storage', onStorage)
    }
  },
  getSnapshot(): QuickList[] {
    if (cache === null) cache = load()
    return cache
  },
  getServerSnapshot(): QuickList[] {
    return EMPTY
  },
  all(): QuickList[] {
    return cache ?? (cache = load())
  },
  // Save a new list to the end. Ignored (returns null) when the name or the
  // items come out empty, or the cap is already reached, so a bad save is a
  // no-op rather than a broken entry.
  add(name: string, items: string[]): QuickList | null {
    const cleanName = name.trim().slice(0, MAX_NAME)
    const cleanItems = normalizeItems(items)
    if (!cleanName || cleanItems.length === 0) return null
    const cur = this.all()
    if (cur.length >= MAX_LISTS) return null
    const list: QuickList = { id: makeId(), name: cleanName, items: cleanItems, createdDate: today() }
    persist([...cur, list])
    return list
  },
  // Rename a list and/or replace its items in place, keeping its id and place in
  // the order. A change that empties the name or items is rejected (returns
  // false) so a list can't be edited into an invalid state.
  update(id: string, patch: { name?: string; items?: string[] }): boolean {
    const cur = this.all()
    const i = cur.findIndex(l => l.id === id)
    if (i === -1) return false
    const name = patch.name !== undefined ? patch.name.trim().slice(0, MAX_NAME) : cur[i].name
    const items = patch.items !== undefined ? normalizeItems(patch.items) : cur[i].items
    if (!name || items.length === 0) return false
    const next = [...cur]
    next[i] = { ...cur[i], name, items }
    persist(next)
    return true
  },
  remove(id: string) {
    const cur = this.all()
    const next = cur.filter(l => l.id !== id)
    if (next.length !== cur.length) persist(next)
  },
}

// The render-time hook: an empty array on the server and the first client paint,
// then the saved lists — so the manager fills in just after hydration with no
// mismatch.
export function useLists(): QuickList[] {
  return useSyncExternalStore(listsStore.subscribe, listsStore.getSnapshot, listsStore.getServerSnapshot)
}
