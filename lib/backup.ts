// The rest of a backup: everything you've written or set up that isn't a task.
// Day notes, week notes, each day's focus line, wrap-up times, focused time,
// quick lists and tag colors each live under their own `bed-*` key, apart from
// the planner, so a task-only export left them behind — a restore on a new
// device brought the tasks back but not the notes written alongside them.
//
// These ride along in the export as an optional `extras` field (older exports
// simply don't have one, and older builds ignore it). Restoring merges the same
// way tasks do: what's already here always wins, so an import only fills gaps
// and never overwrites a note you've since edited. Display preferences that are
// about this device (theme, clock format, reminders) are left out on purpose.

import { tagColorStore, isTagColorKey } from '@/lib/tagcolors'
import { listsStore } from '@/lib/lists'

// The date-keyed maps, by storage key: the field the map sits under in the
// stored blob, a check for one value, and how to name a count of them.
type MapSpec = {
  key: string
  field: string
  valid: (v: unknown) => boolean
  one: string
  many: string
}

const isText = (v: unknown) => typeof v === 'string' && v.trim() !== ''
const isMinute = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 1439
const isSecondsByTask = (v: unknown) =>
  typeof v === 'object' && v !== null && !Array.isArray(v) &&
  Object.values(v).every(s => typeof s === 'number' && Number.isFinite(s) && s > 0)
const isDateKey = (k: string) => /^\d{4}-\d{2}-\d{2}$/.test(k)

const MAPS: MapSpec[] = [
  { key: 'bed-daynotes', field: 'notes', valid: isText, one: 'day note', many: 'day notes' },
  { key: 'bed-weeknotes', field: 'notes', valid: isText, one: 'week note', many: 'week notes' },
  { key: 'bed-dayfocus', field: 'focus', valid: isText, one: 'day focus', many: 'day focuses' },
  { key: 'bed-daytarget', field: 'target', valid: isMinute, one: 'wrap-up time', many: 'wrap-up times' },
  { key: 'bed-focuslog', field: 'log', valid: isSecondsByTask, one: 'day of focus time', many: 'days of focus time' },
]

export type BackupExtras = {
  maps: Record<string, Record<string, unknown>>
  lists: unknown[]
  tagColors: Record<string, string>
}

function readMap(spec: MapSpec): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(spec.key)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    const map = parsed?.[spec.field]
    return typeof map === 'object' && map !== null && !Array.isArray(map) ? map : {}
  } catch {
    return {}
  }
}

// Gather everything besides tasks that's worth carrying to another browser.
// Client-only: reads localStorage.
export function collectExtras(): BackupExtras {
  const maps: BackupExtras['maps'] = {}
  for (const spec of MAPS) maps[spec.key] = readMap(spec)
  return { maps, lists: listsStore.all(), tagColors: tagColorStore.getSnapshot() }
}

// How many entries the extras hold — for the "saved a backup" message.
export function countExtras(extras: BackupExtras): number {
  return (
    Object.values(extras.maps).reduce((n, m) => n + Object.keys(m).length, 0) +
    extras.lists.length +
    Object.keys(extras.tagColors).length
  )
}

// Merge a backup's extras into this browser, filling only what's missing.
// Returns a phrase per kind that gained something ("2 day notes"), in a fixed
// order, so the caller can say exactly what came back. Tolerant of a missing,
// partial or hand-edited `extras` — anything unreadable is skipped.
export function restoreExtras(raw: unknown): string[] {
  if (typeof raw !== 'object' || raw === null) return []
  const src = raw as Record<string, unknown>
  const out: string[] = []
  const say = (n: number, one: string, many: string) => {
    if (n > 0) out.push(`${n} ${n === 1 ? one : many}`)
  }

  const maps = typeof src.maps === 'object' && src.maps !== null ? (src.maps as Record<string, unknown>) : {}
  for (const spec of MAPS) {
    const incoming = maps[spec.key]
    if (typeof incoming !== 'object' || incoming === null || Array.isArray(incoming)) continue
    const current = readMap(spec)
    const next = { ...current }
    let added = 0
    for (const [k, v] of Object.entries(incoming)) {
      if (k in next || !isDateKey(k) || !spec.valid(v)) continue
      next[k] = v
      added++
    }
    if (added === 0) continue
    try {
      localStorage.setItem(spec.key, JSON.stringify({ version: 1, [spec.field]: next }))
      say(added, spec.one, spec.many)
    } catch {}
  }

  if (Array.isArray(src.lists)) say(listsStore.restore(src.lists), 'quick list', 'quick lists')

  if (typeof src.tagColors === 'object' && src.tagColors !== null) {
    let added = 0
    for (const [tag, color] of Object.entries(src.tagColors as Record<string, unknown>)) {
      if (!isTagColorKey(color) || tagColorStore.get(tag)) continue
      tagColorStore.set(tag, color)
      added++
    }
    say(added, 'tag color', 'tag colors')
  }

  return out
}

// "a", "a and b", "a, b, and c".
export function joinList(parts: string[]): string {
  if (parts.length <= 2) return parts.join(' and ')
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
}
