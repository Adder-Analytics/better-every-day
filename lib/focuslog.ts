// A quiet, per-day record of where the day's focused work actually went. The
// Focus timer already lets you work a task in a block of time; this remembers
// how many seconds you spent running it, per task, per day — so the plan's
// estimates can be read against reality instead of staying guesses. Stored apart
// from the planner under its own key (like the day note and day focus), keyed by
// date then task id, so it never touches task data and each day gets its own.
// Old days are pruned on save so the record stays small.

import { addDaysStr, todayStr } from '@/lib/planner'

const STORAGE_KEY = 'bed-focuslog'
const FOCUSLOG_VERSION = 1
// How far back to keep the record — a little longer than the planner's own
// 30-day completed-task retention, so a task finished 30 days ago still has its
// focus time to show alongside it.
const RETENTION_DAYS = 45

// date (YYYY-MM-DD) → task id → seconds of focused time on that day.
export type FocusLog = Record<string, Record<string, number>>

type FocusLogData = {
  version: typeof FOCUSLOG_VERSION
  log: FocusLog
}

// Read the focus-log map. Tolerant of anything malformed — a bad blob reads as
// empty rather than throwing — and drops non-positive or non-numeric entries so
// the stored shape stays clean. Touches localStorage, so it's client-only.
export function loadFocusLog(): FocusLog {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    const log = (parsed as Record<string, unknown>).log
    if (typeof log !== 'object' || log === null) return {}
    const out: FocusLog = {}
    for (const [date, byTask] of Object.entries(log as Record<string, unknown>)) {
      if (typeof byTask !== 'object' || byTask === null) continue
      const day: Record<string, number> = {}
      for (const [id, sec] of Object.entries(byTask as Record<string, unknown>)) {
        if (typeof sec === 'number' && Number.isFinite(sec) && sec > 0) day[id] = Math.round(sec)
      }
      if (Object.keys(day).length > 0) out[date] = day
    }
    return out
  } catch {
    return {}
  }
}

function prune(log: FocusLog): FocusLog {
  const cutoff = addDaysStr(-RETENTION_DAYS)
  const out: FocusLog = {}
  for (const [date, day] of Object.entries(log)) {
    // YYYY-MM-DD compares correctly as a plain string.
    if (date >= cutoff) out[date] = day
  }
  return out
}

function save(log: FocusLog): void {
  try {
    const data: FocusLogData = { version: FOCUSLOG_VERSION, log: prune(log) }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

// Add `sec` seconds of focus to one task on one day, persist, and return the
// updated map so the caller can hold it in state. A non-positive delta is a
// no-op. Defaults to today, since focus is always logged as it happens.
export function addFocusSeconds(
  log: FocusLog,
  taskId: string,
  sec: number,
  date: string = todayStr()
): FocusLog {
  if (!(sec > 0)) return log
  const day = { ...(log[date] ?? {}) }
  day[taskId] = (day[taskId] ?? 0) + Math.round(sec)
  const next = { ...log, [date]: day }
  save(next)
  return next
}

// Seconds of focus logged for one task on a given day (0 when none).
export function focusSeconds(log: FocusLog, taskId: string, date: string = todayStr()): number {
  return log[date]?.[taskId] ?? 0
}

// Total seconds of focus logged across every task on a given day.
export function daySeconds(log: FocusLog, date: string = todayStr()): number {
  const day = log[date]
  if (!day) return 0
  return Object.values(day).reduce((sum, s) => sum + s, 0)
}

// A compact, human duration for a span of focused seconds: seconds below a
// minute ("40s"), then rounded whole minutes read the same way estimates do
// ("25m", "1h 30m"). Kept here so every focus-time surface reads alike.
export function formatFocus(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}
