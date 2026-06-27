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
  return addDaysStr(1)
}

// N days from today (local), YYYY-MM-DD. The general form behind today/tomorrow
// and any further-out scheduling. Negative N reaches into the past.
export function addDaysStr(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// The next future date (1–7 days out) that lands on the given weekday
// (0 = Sun … 6 = Sat). Naming a weekday always points ahead: "Monday" on a
// Monday means next Monday, never today.
export function nextWeekdayStr(dow: number): string {
  const delta = ((dow - new Date().getDay() + 7) % 7) || 7
  return addDaysStr(delta)
}

// A friendly heading for a scheduled day: "Today"/"Tomorrow", a weekday name
// within the coming week ("Saturday"), or "Mon, Jul 3" further out. Parsed
// from parts so the weekday is correct in every timezone.
export function formatDayLabel(dateStr: string): string {
  if (dateStr === todayStr()) return 'Today'
  if (dateStr === tomorrowStr()) return 'Tomorrow'
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const [ty, tm, td] = todayStr().split('-').map(Number)
  const diff = Math.round((date.getTime() - new Date(ty, tm - 1, td).getTime()) / 86_400_000)
  return diff > 1 && diff < 7
    ? date.toLocaleDateString('en-US', { weekday: 'long' })
    : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
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

// --- Quick add parsing --------------------------------------------------------
// People say *when* at the end of a task without thinking: "Pay rent tomorrow",
// "Stretch every day". Quick-add reads that trailing phrase, schedules the task
// accordingly, and removes it from the title — so adding stays as fast as
// talking, and a routine never needs the repeat menu. Only a *trailing* phrase
// is recognized, and never the ambiguous word "today", so it can't quietly
// rewrite a real title like "Plan the week" or "What did I get done today".

export type QuickAddSchedule = { kind: 'date' | 'repeat'; label: string }

export type QuickAdd = {
  text: string // the task title with any recognized schedule phrase removed
  date?: string // an explicit day (YYYY-MM-DD) read from the text
  repeat?: RepeatRule // a recurrence read from the text
  schedule?: QuickAddSchedule // what was recognized, for the live preview
}

// Trailing recurrence phrases, most specific first so "every weekday" isn't
// mistaken for a daily "every day". A leading \s+ keeps a bare word like
// "weekly" a literal task; the optional trailing period tolerates "tomorrow.".
const REPEAT_PHRASES: { re: RegExp; rule: RepeatRule; label: string }[] = [
  { re: /\s+(?:every\s+weekday|on\s+weekdays|weekdays?)\.?\s*$/i, rule: 'weekdays', label: 'Weekdays' },
  { re: /\s+(?:every\s+week|weekly)\.?\s*$/i, rule: 'weekly', label: 'Weekly' },
  { re: /\s+(?:every\s*day|everyday|daily)\.?\s*$/i, rule: 'daily', label: 'Every day' },
]
// Trailing day phrases, each resolving the title to an absolute date so the
// preview and the stored task always agree. The three-letter prefix of a
// matched weekday name keys its day-of-week. "today" is intentionally absent,
// so a real title like "What did I get done today" is never rewritten.
const DOW3: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }
const TOMORROW_RE = /\s+(?:tomorrow|tmrw|tmw)\.?\s*$/i
const NEXT_WEEK_RE = /\s+next\s+week\.?\s*$/i
const IN_DAYS_RE = /\s+in\s+(\d{1,3})\s+days?\.?\s*$/i
const WEEKDAY_RE =
  /\s+(?:(?:on|next|this)\s+)?(sun(?:day)?|mon(?:day)?|tue(?:s|sday)?|wed(?:s|nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?)\.?\s*$/i

// Strip a trailing day phrase ("tomorrow", "friday", "in 3 days", "next week")
// and resolve it to an absolute date. Returns null when nothing is recognized,
// or when stripping would empty the title (so "friday" typed alone stays a
// literal task).
function parseTrailingDate(text: string): { text: string; date: string } | null {
  const tomorrow = text.replace(TOMORROW_RE, '').trim()
  if (tomorrow && tomorrow !== text) return { text: tomorrow, date: addDaysStr(1) }

  const nextWeek = text.replace(NEXT_WEEK_RE, '').trim()
  if (nextWeek && nextWeek !== text) return { text: nextWeek, date: addDaysStr(7) }

  const inDays = text.match(IN_DAYS_RE)
  if (inDays) {
    const n = Number(inDays[1])
    const stripped = text.replace(IN_DAYS_RE, '').trim()
    if (stripped && n >= 1 && n <= 365) return { text: stripped, date: addDaysStr(n) }
  }

  const weekday = text.match(WEEKDAY_RE)
  if (weekday) {
    const stripped = text.replace(WEEKDAY_RE, '').trim()
    if (stripped) return { text: stripped, date: nextWeekdayStr(DOW3[weekday[1].slice(0, 3).toLowerCase()]) }
  }

  return null
}

// Strip a trailing schedule phrase from `input`, returning the cleaned title
// and what was found. Never strips down to an empty title. Recognizes at most
// one recurrence plus one day; recurrence wins, since the task will recur.
export function parseQuickAdd(input: string): QuickAdd {
  let text = input.trim()
  if (!text) return { text }

  let repeat: RepeatRule | undefined
  let repeatLabel = ''
  for (const { re, rule, label } of REPEAT_PHRASES) {
    const stripped = text.replace(re, '').trim()
    if (stripped && stripped !== text) {
      text = stripped
      repeat = rule
      repeatLabel = label
      break
    }
  }

  let date: string | undefined
  const trailing = parseTrailingDate(text)
  if (trailing) {
    text = trailing.text
    date = trailing.date
  }

  const schedule: QuickAddSchedule | undefined = repeat
    ? { kind: 'repeat', label: repeatLabel }
    : date
      ? { kind: 'date', label: formatDayLabel(date) }
      : undefined

  return { text, date, repeat, schedule }
}

// --- Backup & restore ---------------------------------------------------------
// The planner lives only in this browser, so the one real risk is losing it:
// clearing the browser, or switching to a new device. Export writes the tasks
// to a file the user keeps; import reads one back and merges it in. The wire
// format is just the stored task shape wrapped with a marker, so any version's
// export imports cleanly (tasks only ever gain optional fields).

const EXPORT_MARKER = 'better-every-day/tasks'

export type TaskExport = {
  format: typeof EXPORT_MARKER
  version: typeof PLANNER_VERSION
  exportedAt: string
  tasks: Task[]
}

// A dated, human-readable filename so backups sort and self-describe on disk.
export function exportFilename(date: string = todayStr()): string {
  return `better-every-day-${date}.json`
}

// Serialize the current tasks to the export format. `at` is injected so the
// caller owns the clock (this module's other date helpers read it directly,
// but a timestamp is data worth keeping explicit).
export function serializeExport(tasks: Task[], at: string = new Date().toISOString()): string {
  const payload: TaskExport = {
    format: EXPORT_MARKER,
    version: PLANNER_VERSION,
    exportedAt: at,
    tasks,
  }
  return JSON.stringify(payload, null, 2)
}

// Read tasks back out of an exported file. Lenient about the wrapper (accepts
// our envelope, a raw planner blob, or a bare task array) but strict about the
// tasks themselves — anything that isn't a valid Task is dropped. Throws a
// human-readable message when the file clearly isn't a backup, so the UI can
// show it verbatim.
export function parseImportedTasks(raw: string): Task[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error("That file isn't valid JSON — pick a backup exported from here.")
  }
  const rawTasks: unknown[] | null = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as Record<string, unknown>).tasks)
      ? ((parsed as Record<string, unknown>).tasks as unknown[])
      : null
  if (!rawTasks) {
    throw new Error("That doesn't look like a Better Every Day backup.")
  }
  const valid = rawTasks.filter(isTask)
  if (rawTasks.length > 0 && valid.length === 0) {
    throw new Error("That backup didn't contain any readable tasks.")
  }
  return valid
}

// Merge imported tasks into what's already here. Existing tasks always win on
// an id collision, so importing never overwrites or duplicates — it only adds
// what's genuinely new. Returns how many were added so the UI can report it.
export function mergeTasks(existing: Task[], incoming: Task[]): { tasks: Task[]; added: number } {
  const have = new Set(existing.map(t => t.id))
  const seen = new Set<string>()
  const fresh = incoming.filter(t => {
    if (have.has(t.id) || seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })
  return { tasks: fresh.length ? [...existing, ...fresh] : existing, added: fresh.length }
}
