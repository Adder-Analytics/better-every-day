export type Task = {
  id: string
  text: string
  done: boolean
  createdDate: string // YYYY-MM-DD, local time
  completedDate?: string
}

export type PlannerData = {
  version: 1
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
    typeof t.createdDate === 'string'
  )
}

// User data lives here. Future shape changes must bump `version` and migrate
// old data in this function — never discard what a user has saved.
export function loadPlanner(): PlannerData {
  const empty: PlannerData = { version: 1, tasks: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return empty
    const data = parsed as Record<string, unknown>
    if (data.version !== 1 || !Array.isArray(data.tasks)) return empty
    const cutoff = daysAgoStr(COMPLETED_RETENTION_DAYS)
    const tasks = data.tasks
      .filter(isTask)
      .filter(t => !(t.done && (t.completedDate ?? t.createdDate) < cutoff))
    return { version: 1, tasks }
  } catch {
    return empty
  }
}

export function savePlanner(data: PlannerData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function newTask(text: string): Task {
  return {
    id: `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    text,
    done: false,
    createdDate: todayStr(),
  }
}
