export type Task = {
  id: string
  text: string
  done: boolean
  createdDate: string // YYYY-MM-DD, local time
  completedDate?: string
  note?: string // optional free-text detail the user attaches to a task
}

// Bumped to 2 when task notes were added. Stored v1 data has no notes and
// is still valid v2 data, so loadPlanner accepts both and reads each as v2.
export const PLANNER_VERSION = 2

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

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false
  const t = value as Record<string, unknown>
  return (
    typeof t.id === 'string' &&
    typeof t.text === 'string' &&
    typeof t.done === 'boolean' &&
    typeof t.createdDate === 'string' &&
    (t.note === undefined || typeof t.note === 'string')
  )
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
    // v1 (pre-notes) and v2 share the same task shape — v1 tasks simply have
    // no `note`, so both load cleanly into the current version.
    if ((data.version !== 1 && data.version !== 2) || !Array.isArray(data.tasks)) return empty
    const cutoff = daysAgoStr(COMPLETED_RETENTION_DAYS)
    const tasks = data.tasks
      .filter(isTask)
      .filter(t => !(t.done && (t.completedDate ?? t.createdDate) < cutoff))
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
  for (const t of tasks) {
    if (t.done && t.completedDate !== undefined) {
      const c = counts.get(t.completedDate)
      if (c !== undefined) counts.set(t.completedDate, c + 1)
    }
  }
  return [...counts].map(([date, count]) => ({ date, count }))
}

export function newTask(text: string): Task {
  return {
    id: `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    text,
    done: false,
    createdDate: todayStr(),
  }
}
