// Recently deleted: a 30-day safety net for tasks that leave the planner.
// The Undo toast only lasts a few seconds; this keeps a copy of every removed
// task under its own `bed-trash` key, so one deleted by mistake (on any page,
// in a bulk delete, or by a stale second tab saving over the first) can still
// be put back exactly as it was. It sits beside the planner rather than inside
// it, so the `bed-planner` shape is unchanged.
//
// Recording happens in savePlanner: whatever was stored before but is missing
// from the new save goes in here, and anything that comes back (an Undo, a
// restore, an import) comes out. Tasks the planner forgets on purpose — one-offs
// finished more than a year ago — are not recorded.

import type { Task } from '@/lib/planner'

export type TrashItem = { task: Task; deletedAt: number }

const STORAGE_KEY = 'bed-trash'
const VERSION = 1
export const TRASH_DAYS = 30
// A ceiling, so a replaced import of thousands of tasks can't fill storage.
const MAX_ITEMS = 500

function looksLikeTask(v: unknown): v is Task {
  if (typeof v !== 'object' || v === null) return false
  const t = v as Record<string, unknown>
  return typeof t.id === 'string' && typeof t.text === 'string' && typeof t.createdDate === 'string'
}

// Drop entries older than the window, newest first.
function fresh(items: TrashItem[], now = Date.now()): TrashItem[] {
  const cutoff = now - TRASH_DAYS * 86_400_000
  return items.filter(i => i.deletedAt >= cutoff).sort((a, b) => b.deletedAt - a.deletedAt)
}

export function loadTrash(): TrashItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { version?: unknown; items?: unknown }
    if (parsed?.version !== VERSION || !Array.isArray(parsed.items)) return []
    const items = parsed.items.filter(
      (i): i is TrashItem =>
        typeof i === 'object' && i !== null && typeof (i as TrashItem).deletedAt === 'number' && looksLikeTask((i as TrashItem).task)
    )
    return fresh(items)
  } catch {
    return []
  }
}

export function saveTrash(items: TrashItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, items: fresh(items).slice(0, MAX_ITEMS) }))
  } catch {
    // Storage full or blocked: the planner's own save still happened.
  }
}

// Compare what was stored with what is about to be stored. `prevRaw` is the
// planner's raw JSON before this save; `keep` says whether a vanished task was
// removed by the user (true) rather than aged out on purpose (false).
export function recordRemovals(prevRaw: string | null, next: Task[], keep: (t: Task) => boolean): void {
  let prev: Task[] = []
  try {
    const parsed = prevRaw ? (JSON.parse(prevRaw) as { tasks?: unknown }) : null
    if (parsed && Array.isArray(parsed.tasks)) prev = parsed.tasks.filter(looksLikeTask)
  } catch {
    return
  }
  const nextIds = new Set(next.map(t => t.id))
  const removed = prev.filter(t => !nextIds.has(t.id) && keep(t))
  const trash = loadTrash()
  const back = trash.some(i => nextIds.has(i.task.id))
  if (removed.length === 0 && !back) return
  const now = Date.now()
  const removedIds = new Set(removed.map(t => t.id))
  saveTrash([
    ...removed.map(task => ({ task, deletedAt: now })),
    ...trash.filter(i => !nextIds.has(i.task.id) && !removedIds.has(i.task.id)),
  ])
}
