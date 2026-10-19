'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { currentDay, latestEntry } from '@/data/changelog'

// The last Day number whose banner was put away. Display state only, never
// task data: a new changelog entry has a higher day, so its banner shows again.
const STORAGE_KEY = 'bed-banner-dismissed'

const listeners = new Set<() => void>()

const dismissedStore = {
  subscribe(cb: () => void) {
    listeners.add(cb)
    window.addEventListener('storage', cb)
    return () => {
      listeners.delete(cb)
      window.removeEventListener('storage', cb)
    }
  },
  get(): number {
    try {
      return Number(localStorage.getItem(STORAGE_KEY)) || 0
    } catch {
      return 0
    }
  },
  set(day: number) {
    try {
      localStorage.setItem(STORAGE_KEY, String(day))
    } catch {}
    listeners.forEach(l => l())
  },
}

// The "what got better today" card above the plan. It shows once per new entry:
// closing it, or opening it to read, puts it away until the next one. Hidden on
// the server and first paint (getServerSnapshot reports it dismissed), so a
// reader who closed it never sees it flash in before hydration.
export default function DayBanner() {
  const entry = latestEntry()
  const day = currentDay()
  const dismissed = useSyncExternalStore(dismissedStore.subscribe, dismissedStore.get, () => day)

  if (dismissed >= day) return null

  return (
    <div className="relative rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors group">
      <Link
        href="/changelog"
        onClick={() => dismissedStore.set(day)}
        className="flex items-center gap-3 rounded-2xl py-3.5 pl-4 pr-14"
      >
        <span className="flex-shrink-0 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold tabular-nums">
          Day {day}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-zinc-400">What got better today</p>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{entry.title}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => dismissedStore.set(day)}
        aria-label="Hide until the next update"
        title="Hide until the next update"
        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
