// The week-start preference: whether weeks begin on Sunday or Monday. Most of
// the world starts the week on Monday, so the default follows the browser's
// locale until a choice is made. Like the clock preference this is a reading
// choice, not a data one — it changes how weeks are laid out and counted (the
// month grid, the history calendar, the weekly review, "3 times a week"), never
// what's stored. A tiny external store (mirroring lib/timeformat) lets
// components read it via useSyncExternalStore and syncs across tabs.

import { useSyncExternalStore } from 'react'

export type WeekStart = 0 | 1 // 0 = Sunday, 1 = Monday

const STORAGE_KEY = 'bed-weekstart'

const listeners = new Set<() => void>()

// The locale's first day of the week, folded to Sunday or Monday. Uses
// Intl.Locale week info where the browser has it (getWeekInfo() or the older
// weekInfo getter, where 7 = Sunday); anything else falls back to Sunday.
function localeWeekStart(): WeekStart {
  try {
    const loc = new Intl.Locale(navigator.language) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number }
      weekInfo?: { firstDay: number }
    }
    const info = loc.getWeekInfo?.() ?? loc.weekInfo
    return info?.firstDay === 1 ? 1 : 0
  } catch {
    return 0
  }
}

export const weekStartStore = {
  subscribe(cb: () => void) {
    listeners.add(cb)
    window.addEventListener('storage', cb)
    return () => {
      listeners.delete(cb)
      window.removeEventListener('storage', cb)
    }
  },
  get(): WeekStart {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      if (v === '0' || v === '1') return Number(v) as WeekStart
    } catch {
      return 0
    }
    return localeWeekStart()
  },
  set(w: WeekStart) {
    try {
      localStorage.setItem(STORAGE_KEY, String(w))
    } catch {}
    listeners.forEach(l => l())
  },
}

// The stored preference, read outside React — for date helpers that count
// weeks. Sunday on the server, where there's no storage or locale to read.
export function weekStartsOn(): WeekStart {
  return typeof window === 'undefined' ? 0 : weekStartStore.get()
}

// The render-time hook. Sunday on the server and the first client paint, then
// the stored (or locale) preference — the views that lay out weeks wait for
// hydration anyway, so there's no visible switch.
export function useWeekStart(): WeekStart {
  return useSyncExternalStore(weekStartStore.subscribe, weekStartStore.get, () => 0 as WeekStart)
}

// The seven weekday numbers (0 = Sun … 6 = Sat) in display order.
export function weekdayOrder(start: WeekStart): number[] {
  return Array.from({ length: 7 }, (_, i) => (start + i) % 7)
}
