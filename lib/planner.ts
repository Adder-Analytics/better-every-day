// How often a task repeats. Absent means it's a one-off.
export type RepeatRule = 'daily' | 'weekdays' | 'weekly'

export type Task = {
  id: string
  text: string
  done: boolean
  createdDate: string // YYYY-MM-DD, local time
  completedDate?: string
  note?: string // optional free-text detail the user attaches to a task
  // A repeating task ("routine") reappears each day it's due instead of
  // carrying over. It isn't completed once-and-for-all; instead each day it's
  // finished is recorded in `completions`, so it shows up fresh the next day.
  repeat?: RepeatRule
  completions?: string[] // dates (YYYY-MM-DD) this routine was completed
}

// v1: original. v2: added task notes. v3: added repeating tasks (routines).
// Each version only adds optional fields, so older stored data is already
// valid under the current shape — loadPlanner reads v1/v2/v3 alike.
export const PLANNER_VERSION = 3

export type PlannerData = {
  version: typeof PLANNER_VERSION
  tasks: Task[]
}

const STORAGE_KEY = 'bed-planner'
const COMPLETED_RETENTION_DAYS = 30

export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatDate(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

// A warm, time-of-day greeting. Depends on the local clock, so only call it
// on the client (after hydration) to avoid a server/client HTML mismatch.
export function greeting(date = new Date()): string {
  const h = date.getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 22) return 'Good evening'
  return 'Working late?'
}

function daysAgoStr(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Tomorrow's local date. A task created with this date stays out of today's
// list and quietly becomes a today task when tomorrow actually arrives.
export function tomorrowStr(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isRepeatRule(value: unknown): value is RepeatRule {
  return value === 'daily' || value === 'weekdays' || value === 'weekly'
}

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false
  const t = value as Record<string, unknown>
  return (
    typeof t.id === 'string' &&
    typeof t.text === 'string' &&
    typeof t.done === 'boolean' &&
    typeof t.createdDate === 'string' &&
    (t.note === undefined || typeof t.note === 'string') &&
    (t.repeat === undefined || isRepeatRule(t.repeat)) &&
    (t.completions === undefined ||
      (Array.isArray(t.completions) && t.completions.every(c => typeof c === 'string')))
  )
}

// Day-of-week (0 = Sunday … 6 = Saturday) for a YYYY-MM-DD string, parsed from
// parts so it's correct in every timezone (new Date('2026-06-14') is UTC).
function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

// Whether a repeating task is scheduled to appear on the given date. A routine
// never shows before the day it was created; after that it follows its cadence.
export function isDueOn(task: Task, dateStr: string): boolean {
  if (!task.repeat) return false
  if (dateStr < task.createdDate) return false
  if (task.repeat === 'daily') return true
  const dow = weekdayOf(dateStr)
  if (task.repeat === 'weekdays') return dow >= 1 && dow <= 5
  // weekly: recurs on the same weekday it was created on.
  return weekdayOf(task.createdDate) === dow
}

// Whether a repeating task has been completed on the given date.
export function isCompletedOn(task: Task, dateStr: string): boolean {
  return !!task.repeat && (task.completions ?? []).includes(dateStr)
}

// User data lives here. Future shape changes must bump `version` and migrate
// old data in this function — never discard what a user has saved.
export function loadPlanner(): PlannerData {
  const empty: PlannerData = { version: PLANNER_VERSION, tasks: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return empty
    const data = parsed as Record<string, unknown>
    // v1 (pre-notes), v2 (notes) and v3 (routines) only add optional fields, so
    // every version's tasks load cleanly into the current shape.
    if (![1, 2, 3].includes(data.version as number) || !Array.isArray(data.tasks)) return empty
    const cutoff = daysAgoStr(COMPLETED_RETENTION_DAYS)
    const tasks = data.tasks
      .filter(isTask)
      // Forget long-finished one-off tasks; routines persist, but their
      // completion log is trimmed to the same window to stay tidy.
      .filter(t => !(!t.repeat && t.done && (t.completedDate ?? t.createdDate) < cutoff))
      .map(t =>
        t.repeat && t.completions
          ? { ...t, completions: t.completions.filter(c => c >= cutoff) }
          : t
      )
    return { version: PLANNER_VERSION, tasks }
  } catch {
    return empty
  }
}

export function savePlanner(data: PlannerData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// The last `n` calendar dates (local time), oldest first, ending with today.
export function lastNDates(n: number): string[] {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) out.push(daysAgoStr(i))
  return out
}

// How many tasks were completed on each of the last 7 days, oldest first.
// Reads from the completion history the planner already retains.
export function weekActivity(tasks: Task[]): { date: string; count: number }[] {
  const counts = new Map(lastNDates(7).map(d => [d, 0]))
  const bump = (date: string) => {
    const c = counts.get(date)
    if (c !== undefined) counts.set(date, c + 1)
  }
  for (const t of tasks) {
    if (t.repeat) {
      // Each day a routine was completed counts toward that day's total.
      for (const c of t.completions ?? []) bump(c)
    } else if (t.done && t.completedDate !== undefined) {
      bump(t.completedDate)
    }
  }
  return [...counts].map(([date, count]) => ({ date, count }))
}

export function newTask(text: string, date: string = todayStr()): Task {
  return {
    id: `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    text,
    done: false,
    createdDate: date,
  }
}
