// The clock preference: a 12-hour ("2:30 PM") or 24-hour ("14:30") display of
// every time in the app. Much of the world reads the 24-hour clock, so this is
// a display choice, not a data one — it changes how a time is written, never
// what's stored. A tiny external store (mirroring lib/theme) lets components
// read it via useSyncExternalStore, so a change re-renders every time on screen
// at once and syncs across tabs.

import { useSyncExternalStore } from 'react'

export type TimeFormat = '12' | '24'

const STORAGE_KEY = 'bed-timeformat'

const listeners = new Set<() => void>()

export const timeFormatStore = {
  subscribe(cb: () => void) {
    listeners.add(cb)
    window.addEventListener('storage', cb)
    return () => {
      listeners.delete(cb)
      window.removeEventListener('storage', cb)
    }
  },
  get(): TimeFormat {
    try {
      return localStorage.getItem(STORAGE_KEY) === '24' ? '24' : '12'
    } catch {
      return '12'
    }
  },
  set(t: TimeFormat) {
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {}
    listeners.forEach(l => l())
  },
}

// Whether times should render on a 12-hour clock. Reads the stored preference,
// outside React — for the odd caller that formats a time in a callback (a
// reminder firing, a plan copied to the clipboard) rather than during render.
export function isHour12(): boolean {
  return timeFormatStore.get() === '12'
}

// The render-time hook. 12-hour on the server and the first client paint (the
// getServerSnapshot value), then the stored preference — so a 24-hour reader
// sees the clock switch just after hydration, with no server/client mismatch,
// the same way the theme is applied before paint.
export function useHour12(): boolean {
  return useSyncExternalStore(
    timeFormatStore.subscribe,
    () => timeFormatStore.get() === '12',
    () => true
  )
}
