// When this browser last saved a backup. Your tasks live only here, so the
// "Your data" card says how long it's been since a copy left the browser —
// a plain fact, not a nag. Kept as a single local date (YYYY-MM-DD) under its
// own `bed-lastbackup` key: it describes this device, so it isn't part of the
// planner's stored shape and doesn't ride along in the backup itself. A tiny
// external store (like lib/tagcolors) keeps every tab in step.

import { useSyncExternalStore } from 'react'
import { todayStr } from '@/lib/planner'

const STORAGE_KEY = 'bed-lastbackup'
const listeners = new Set<() => void>()

function read(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
  } catch {
    return null
  }
}

export const lastBackupStore = {
  subscribe(cb: () => void) {
    listeners.add(cb)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) cb()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(cb)
      window.removeEventListener('storage', onStorage)
    }
  },
  // A string, so identical snapshots compare equal without a cache.
  getSnapshot: read,
  getServerSnapshot: (): string | null => null,
  markToday() {
    try {
      localStorage.setItem(STORAGE_KEY, todayStr())
    } catch {
      // Storage full or blocked: the backup file was still saved.
    }
    listeners.forEach(cb => cb())
  },
}

// The last backup date, or null if this browser has never saved one (and on
// the server, so first paint matches).
export function useLastBackup(): string | null {
  return useSyncExternalStore(lastBackupStore.subscribe, lastBackupStore.getSnapshot, lastBackupStore.getServerSnapshot)
}

// Whole calendar days between two local dates (YYYY-MM-DD), b minus a.
function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000)
}

// "Last backup today", "… yesterday", "… 12 days ago", "… on Mar 4, 2026".
export function formatLastBackup(date: string, today: string = todayStr()): string {
  const n = daysBetween(date, today)
  if (n <= 0) return 'Last backup today'
  if (n === 1) return 'Last backup yesterday'
  if (n < 60) return `Last backup ${n} days ago`
  const [y, m, d] = date.split('-').map(Number)
  const label = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `Last backup on ${label}`
}

// How old a backup has to be before the line turns amber.
export const STALE_BACKUP_DAYS = 30

export function isBackupStale(date: string | null, today: string = todayStr()): boolean {
  return date === null || daysBetween(date, today) >= STALE_BACKUP_DAYS
}

// Ask the browser not to clear this site's storage on its own. Some browsers
// (Safari in particular) wipe storage for sites that go unvisited for a while,
// unless the site has been granted persistent storage. Called from the export
// button, so a browser that asks permission does so in response to a tap about
// keeping your data. Quietly does nothing where unsupported.
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (!navigator.storage?.persist) return
    if (await navigator.storage.persisted()) return
    await navigator.storage.persist()
  } catch {
    // Not supported or refused; the app works the same either way.
  }
}
