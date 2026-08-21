// How often a task repeats. Absent means it's a one-off. 'days' recurs on a
// chosen set of weekdays (see `repeatDays`); 'monthly' recurs on the same
// day-of-month it was created (clamped to a short month's last day);
// 'interval' recurs every N days counting from the day it was created (see
// `repeatEvery`) — the rest are fixed weekly/daily cadences.
export type RepeatRule = 'daily' | 'weekdays' | 'weekly' | 'days' | 'monthly' | 'interval'

// A single step within a task — a way to break one thing into the smaller
// pieces it actually takes. Each is checked off on its own; they don't drive
// the parent's completion, they just show how far along it is.
export type Subtask = {
  id: string
  text: string
  done: boolean
}

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
  // Which weekdays a 'days' routine recurs on (0 = Sun … 6 = Sat). Only read
  // when `repeat === 'days'`; the fixed cadences ignore it.
  repeatDays?: number[]
  // How many days apart an 'interval' routine recurs — the N in "every N days"
  // ("every other day" is 2). Counted from `createdDate`. Integer ≥ 2; only
  // read when `repeat === 'interval'`, ignored by every other cadence.
  repeatEvery?: number
  completions?: string[] // dates (YYYY-MM-DD) this routine was completed
  // Rest days: dates (YYYY-MM-DD) this routine was deliberately skipped. A
  // skipped due day steps out of that day's list and counts as neither done nor
  // missed — it bridges the streak rather than breaking it. Only meaningful on a
  // routine; a one-off is moved or deleted instead.
  skips?: string[]
  estimateMin?: number // optional rough time estimate, in minutes
  timeMin?: number // optional time of day, minutes since local midnight (0–1439)
  priority?: boolean // starred as important — floats to the top of the day
  subtasks?: Subtask[] // optional checklist of steps that make up the task
  // Held in the Someday list instead of on a day: a task captured without
  // committing it to a date. Someday tasks stay out of Today, carryovers,
  // upcoming days, and the tab count until they're scheduled or brought to
  // today (which clears this flag). A routine is never a someday task.
  someday?: boolean
}

// v1: original. v2: added task notes. v3: added repeating tasks (routines).
// v4: added optional time estimates. v5: added optional time of day. v6: added
// an optional priority (star) flag. v7: added an optional subtask checklist.
// v8: added the 'days' repeat rule and an optional `repeatDays` weekday set.
// v9: added an optional `someday` flag (the Someday backlog list).
// v10: added the 'monthly' repeat rule (a new repeat value old data never used).
// v11: added an optional `skips` list (routine rest days).
// v12: added the 'interval' repeat rule and an optional `repeatEvery` count
// (every-N-days routines) — a new repeat value and field old data never used.
// Each version only adds optional fields (or a new repeat value old data never
// used), so older stored data is already valid under the current shape —
// loadPlanner reads v1–v12 alike.
export const PLANNER_VERSION = 12

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
  return (
    value === 'daily' || value === 'weekdays' || value === 'weekly' || value === 'days' ||
    value === 'monthly' || value === 'interval'
  )
}

function isWeekdaySet(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(d => Number.isInteger(d) && d >= 0 && d <= 6)
}

function isSubtask(value: unknown): value is Subtask {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return typeof s.id === 'string' && typeof s.text === 'string' && typeof s.done === 'boolean'
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
    (t.repeatDays === undefined || isWeekdaySet(t.repeatDays)) &&
    (t.repeatEvery === undefined ||
      (typeof t.repeatEvery === 'number' && Number.isInteger(t.repeatEvery) && t.repeatEvery >= 2)) &&
    (t.completions === undefined ||
      (Array.isArray(t.completions) && t.completions.every(c => typeof c === 'string'))) &&
    (t.skips === undefined ||
      (Array.isArray(t.skips) && t.skips.every(s => typeof s === 'string'))) &&
    (t.estimateMin === undefined ||
      (typeof t.estimateMin === 'number' && Number.isFinite(t.estimateMin) && t.estimateMin > 0)) &&
    (t.timeMin === undefined ||
      (typeof t.timeMin === 'number' && Number.isInteger(t.timeMin) && t.timeMin >= 0 && t.timeMin <= 1439)) &&
    (t.priority === undefined || typeof t.priority === 'boolean') &&
    (t.subtasks === undefined || (Array.isArray(t.subtasks) && t.subtasks.every(isSubtask))) &&
    (t.someday === undefined || typeof t.someday === 'boolean')
  )
}

// A compact, human duration: "45m", "1h", "1h 30m". Used by the estimate pill,
// the quick-add preview, and the day's time summary.
export function formatDuration(min: number): string {
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

// Minutes since local midnight, right now. Reads the wall clock, so it's
// client-only — call it after hydration to keep server and client HTML in sync.
export function currentMin(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

// How far ahead a time is, as a short phrase: "in 25m", "in 1h", "in 2h 30m".
// Only the future is described; callers gate on a positive delta. Used by the
// live agenda to label the next timed task that's coming up.
export function formatStartsIn(deltaMin: number): string {
  if (deltaMin < 60) return `in ${deltaMin}m`
  const h = Math.floor(deltaMin / 60)
  const m = deltaMin % 60
  return m === 0 ? `in ${h}h` : `in ${h}h ${m}m`
}

// How far past a time is, as a short phrase: "5m late", "1h late", "2h 30m late".
// The mirror of formatStartsIn — callers gate on a positive delta — used by the
// live agenda to flag a timed task whose moment has slipped by unfinished.
export function formatOverdue(deltaMin: number): string {
  if (deltaMin < 60) return `${deltaMin}m late`
  const h = Math.floor(deltaMin / 60)
  const m = deltaMin % 60
  return m === 0 ? `${h}h late` : `${h}h ${m}m late`
}

// A time of day from minutes-since-midnight: "9 AM", "9:30 AM", "12 PM",
// "2:30 PM". Used by the agenda time pill and the quick-add preview.
export function formatTime(min: number): string {
  const h24 = Math.floor(min / 60)
  const m = min % 60
  const period = h24 < 12 ? 'AM' : 'PM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, '0')} ${period}`
}

// A time-of-day block from a start and a duration: "9 – 11 AM", "9:30 – 10:30 AM",
// "11 AM – 1 PM". The meridiem is shared when both ends fall in the same half of
// the day, so the window reads as one span. Used on a timed task that also
// carries an estimate, so its row reads as a block rather than just a start. A
// block that would run to or past midnight falls back to just the start time.
export function formatTimeRange(startMin: number, durationMin: number): string {
  const endMin = startMin + durationMin
  if (endMin >= 1440) return formatTime(startMin)
  const startStr = formatTime(startMin)
  const endStr = formatTime(endMin)
  const samePeriod = startMin < 720 === endMin < 720
  const start = samePeriod ? startStr.replace(/\s[AP]M$/, '') : startStr
  return `${start} – ${endStr}`
}

// Which of a day's timed tasks collide with one another — a quiet check against
// double-booking. Each task holds a span: a block runs its estimate's length; a
// bare time is a moment, widened to a single minute so two things at the same
// time still register as a clash while back-to-back blocks (9–11, then 11–12)
// don't. Two spans conflict when they actually overlap (touching ends don't).
// Returns, for each conflicting task id, the ids of everything it overlaps —
// callers turn that into the heads-up shown on the row. Order-independent, and
// callers pass only the tasks they want compared (today's still-to-do agenda).
export function timeBlockConflicts(
  items: { id: string; timeMin: number; estimateMin?: number }[]
): Map<string, string[]> {
  const spans = items.map(t => ({ id: t.id, start: t.timeMin, end: t.timeMin + Math.max(t.estimateMin ?? 0, 1) }))
  const out = new Map<string, string[]>()
  const link = (a: string, b: string) => {
    const list = out.get(a)
    if (list) list.push(b)
    else out.set(a, [b])
  }
  for (let i = 0; i < spans.length; i++) {
    for (let j = i + 1; j < spans.length; j++) {
      const a = spans[i], b = spans[j]
      if (a.start < b.end && b.start < a.end) {
        link(a.id, b.id)
        link(b.id, a.id)
      }
    }
  }
  return out
}

// Day-of-week (0 = Sunday … 6 = Saturday) for a YYYY-MM-DD string, parsed from
// parts so it's correct in every timezone (new Date('2026-06-14') is UTC).
function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

// Whole calendar days between two YYYY-MM-DD strings (to − from). Built from
// parts and rounded, so a daylight-saving hour never throws the count off by a
// day. Used to place an every-N-days routine relative to the day it began.
function daysBetween(fromStr: string, toStr: string): number {
  const [fy, fm, fd] = fromStr.split('-').map(Number)
  const [ty, tm, td] = toStr.split('-').map(Number)
  return Math.round((new Date(ty, tm - 1, td).getTime() - new Date(fy, fm - 1, fd).getTime()) / 86_400_000)
}

// Whether a repeating task is scheduled to appear on the given date. A routine
// never shows before the day it was created; after that it follows its cadence.
export function isDueOn(task: Task, dateStr: string): boolean {
  if (!task.repeat) return false
  if (dateStr < task.createdDate) return false
  if (task.repeat === 'daily') return true
  // monthly: recurs on the same day-of-month it was created on. Months shorter
  // than that day (a 31st routine in February) fall to the month's last day, so
  // it still fires once every month rather than skipping the short ones.
  if (task.repeat === 'monthly') {
    const anchorDay = Number(task.createdDate.split('-')[2])
    const [y, m, d] = dateStr.split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    return d === Math.min(anchorDay, lastDay)
  }
  // interval: recurs every N days counting from the day it was created, so the
  // create day itself is day 0 (due), then every Nth day after.
  if (task.repeat === 'interval') {
    const every = Math.max(2, task.repeatEvery ?? 2)
    return daysBetween(task.createdDate, dateStr) % every === 0
  }
  const dow = weekdayOf(dateStr)
  if (task.repeat === 'weekdays') return dow >= 1 && dow <= 5
  // days: recurs on each chosen weekday (0 = Sun … 6 = Sat).
  if (task.repeat === 'days') return (task.repeatDays ?? []).includes(dow)
  // weekly: recurs on the same weekday it was created on.
  return weekdayOf(task.createdDate) === dow
}

// Whether a repeating task has been completed on the given date.
export function isCompletedOn(task: Task, dateStr: string): boolean {
  return !!task.repeat && (task.completions ?? []).includes(dateStr)
}

// Whether a repeating task was taken as a rest day (skipped) on the given date.
// A skipped due day is held out of that day's list and treated as neither done
// nor missed — it bridges the streak instead of breaking it.
export function isSkippedOn(task: Task, dateStr: string): boolean {
  return !!task.repeat && (task.skips ?? []).includes(dateStr)
}

// Short weekday names, keyed by day-of-week (0 = Sun … 6 = Sat).
export const WEEKDAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// A short label for a 'days' routine's weekday set: "Every day", "Weekdays" or
// "Weekends" when the set matches one, otherwise an abbreviated list like
// "Mon Wed Fri". Input order and duplicates don't matter.
export function formatRepeatDays(days: number[]): string {
  const set = [...new Set(days)].filter(d => d >= 0 && d <= 6).sort((a, b) => a - b)
  if (set.length === 0) return 'No days'
  if (set.length === 7) return 'Every day'
  const key = set.join(',')
  if (key === '1,2,3,4,5') return 'Weekdays'
  if (key === '0,6') return 'Weekends'
  return set.map(d => WEEKDAY_ABBR[d]).join(' ')
}

// A short label for an 'interval' routine's cadence: "Every other day" for a
// two-day gap, "Every 3 days" beyond that. The shared wording for the task row,
// the repeat menu, the routines page, and search.
export function formatInterval(every: number): string {
  const n = Math.max(2, Math.round(every))
  return n === 2 ? 'Every other day' : `Every ${n} days`
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// An ordinal day-of-month: "1st", "2nd", "3rd", "21st", "31st". Used to name the
// day a monthly routine recurs on, in its tooltip and the History streak line.
export function ordinalDay(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

// The day-of-month a monthly routine recurs on, read from the date it was
// anchored to: "the 15th". Empty for any non-monthly task.
export function monthlyDayLabel(task: Task): string {
  if (task.repeat !== 'monthly') return ''
  return `the ${ordinalDay(Number(task.createdDate.split('-')[2]))}`
}

// A routine's current streak: how many of its due days in a row have been
// completed, counting back from today. The streak follows the task's own
// cadence — a weekend never breaks a weekday streak, and a weekly routine
// counts weeks — and today is a grace day: not-yet-done doesn't break the
// run while the day is still in progress, but completing it counts. A rest day
// (a skipped due day) is neutral: it neither adds to the run nor ends it, so a
// deliberate day off keeps the streak alive.
export function routineStreak(task: Task, today: string = todayStr()): number {
  if (!task.repeat) return 0
  const done = new Set(task.completions ?? [])
  if (done.size === 0) return 0
  const skips = new Set(task.skips ?? [])
  const [y, m, d] = today.split('-').map(Number)
  const cursor = new Date(y, m - 1, d)
  let streak = 0
  // Scan back until we've counted every completion there could be, or run out
  // of history. A skipped due day bridges the gap, so the bound is on completed
  // days seen (streak), not calendar days visited.
  for (let isToday = true; streak < done.size; isToday = false) {
    const date = fmtDate(cursor)
    if (date < task.createdDate) break
    if (isDueOn(task, date)) {
      if (skips.has(date)) { /* rest day — bridge the run */ }
      else if (done.has(date)) streak++
      else if (!isToday) break
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// A routine's longest-ever run of completed due days, by the same cadence
// rules as routineStreak. An unfinished today never ends a run early, and a
// rest day (a skipped due day) is neutral — it bridges a run rather than
// ending it, matching how the current streak counts.
export function bestRoutineStreak(task: Task, today: string = todayStr()): number {
  if (!task.repeat) return 0
  const done = new Set(task.completions ?? [])
  if (done.size === 0) return 0
  const skips = new Set(task.skips ?? [])
  const first = [...done].sort()[0]
  const [y, m, d] = first.split('-').map(Number)
  const cursor = new Date(y, m - 1, d)
  let best = 0
  let run = 0
  for (;;) {
    const date = fmtDate(cursor)
    if (date > today) break
    if (isDueOn(task, date)) {
      if (skips.has(date)) {
        // Rest day — carry the run across without adding to it.
      } else if (done.has(date)) {
        run++
        if (run > best) best = run
      } else if (date !== today) {
        run = 0
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return best
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
    // v1 (pre-notes), v2 (notes), v3 (routines), v4 (estimates), v5 (time of
    // day), v6 (priority), v7 (subtasks), v8 (specific-day routines), v9 (the
    // Someday list), v10 (monthly routines), v11 (routine rest days) and v12
    // (every-N-days routines) only add optional fields (or a repeat value old
    // data never used), so every version's tasks load cleanly into the current
    // shape.
    if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(data.version as number) || !Array.isArray(data.tasks)) return empty
    const cutoff = daysAgoStr(COMPLETED_RETENTION_DAYS)
    const tasks = data.tasks
      .filter(isTask)
      // Forget long-finished one-off tasks. Routines keep their full
      // completion log — it's what streaks are counted from, so trimming it
      // would cap every streak at the retention window. (History and the
      // weekly chart window their own views at render time.)
      .filter(t => !(!t.repeat && t.done && (t.completedDate ?? t.createdDate) < cutoff))
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

// How many tasks were completed on each date, across all of history. A one-off
// counts once on its completedDate; a routine counts on every day it was done.
// The shared basis for the weekly bars and the activity calendar.
export function completionCounts(tasks: Task[]): Map<string, number> {
  const counts = new Map<string, number>()
  const bump = (date: string) => counts.set(date, (counts.get(date) ?? 0) + 1)
  for (const t of tasks) {
    if (t.repeat) {
      for (const c of t.completions ?? []) bump(c)
    } else if (t.done && t.completedDate !== undefined) {
      bump(t.completedDate)
    }
  }
  return counts
}

// A daily consistency streak: how many days in a row, counting back from today,
// at least one task was completed. Today is a grace day — a not-yet-productive
// today never breaks a run that's going, but finishing something today extends
// it. Built from the same completion history the week bars and calendar read, so
// one-offs and routines both count. (Finished one-offs are trimmed after 30 days,
// so a run longer than that is honestly capped rather than overstated.)
export function activityStreak(tasks: Task[], today: string = todayStr()): number {
  const counts = completionCounts(tasks)
  const [y, m, d] = today.split('-').map(Number)
  const cursor = new Date(y, m - 1, d)
  let streak = 0
  for (let isToday = true; ; isToday = false) {
    const date = fmtDate(cursor)
    if ((counts.get(date) ?? 0) > 0) streak++
    else if (!isToday) break
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// A read on the last `windowDays` of history, summarized into a few plain
// numbers: how much got done, on how many days, which weekday carried the most,
// and the longest run of consecutive active days. All derived from the same
// completion history the week bars and calendar read, so one-offs and routines
// both count. Scoped to the window so the numbers stay honest against the
// 30-day retention of finished one-off tasks.
export type ActivityInsights = {
  windowDays: number
  total: number // tasks completed across the window
  activeDays: number // days in the window with at least one completion
  busiestDow: number | null // 0 = Sun … 6 = Sat, null when nothing's been done
  busiestCount: number // completions on that weekday, summed across the window
  bestStreak: number // longest run of consecutive active days in the window
}

export function activityInsights(
  tasks: Task[],
  windowDays: number = COMPLETED_RETENTION_DAYS
): ActivityInsights {
  const counts = completionCounts(tasks)
  const byDow = new Array(7).fill(0)
  let total = 0
  let activeDays = 0
  let bestStreak = 0
  let run = 0
  for (const date of lastNDates(windowDays)) {
    const c = counts.get(date) ?? 0
    total += c
    if (c > 0) {
      activeDays++
      run++
      if (run > bestStreak) bestStreak = run
      byDow[weekdayOf(date)] += c
    } else {
      run = 0
    }
  }
  // The heaviest weekday, first-wins on a tie (Sun leads Sat) so the pick is
  // stable. Null while nothing's been done, though callers gate on total first.
  let busiestDow: number | null = null
  let busiestCount = 0
  for (let d = 0; d < 7; d++) {
    if (byDow[d] > busiestCount) {
      busiestCount = byDow[d]
      busiestDow = d
    }
  }
  return { windowDays, total, activeDays, busiestDow, busiestCount, bestStreak }
}

// How many tasks were completed on each of the last 7 days, oldest first.
// Reads from the completion history the planner already retains.
export function weekActivity(tasks: Task[]): { date: string; count: number }[] {
  const counts = completionCounts(tasks)
  return lastNDates(7).map(date => ({ date, count: counts.get(date) ?? 0 }))
}

// One square in the activity calendar: a date, how many tasks were completed on
// it, and flags for the two special cells the grid renders differently.
export type CalendarCell = { date: string; count: number; isToday: boolean; isFuture: boolean }

// A calendar grid of the last `weeks` weeks, laid out Sunday-first and ending
// with the week containing today. Rows are weeks (oldest first), each a run of
// seven cells; days past today fill out the final week as `isFuture` blanks.
// Built from parts so weekday alignment is correct in every timezone.
export function activityCalendar(tasks: Task[], weeks = 5, today: string = todayStr()): CalendarCell[][] {
  const counts = completionCounts(tasks)
  const [ty, tm, td] = today.split('-').map(Number)
  // Saturday that closes today's week — the last cell of the grid's final row.
  const end = new Date(ty, tm - 1, td)
  end.setDate(end.getDate() + (6 - end.getDay()))
  const cursor = new Date(end)
  cursor.setDate(end.getDate() - (weeks * 7 - 1))
  const rows: CalendarCell[][] = []
  for (let w = 0; w < weeks; w++) {
    const row: CalendarCell[] = []
    for (let d = 0; d < 7; d++) {
      const date = fmtDate(cursor)
      row.push({ date, count: counts.get(date) ?? 0, isToday: date === today, isFuture: date > today })
      cursor.setDate(cursor.getDate() + 1)
    }
    rows.push(row)
  }
  return rows
}

// A friendly heading for a past day: "Today"/"Yesterday", a weekday name
// within the past week ("Tuesday"), or "Mon, Jun 23" further back. The
// look-back counterpart of formatDayLabel, parsed from parts for the same
// timezone reasons.
export function formatPastDayLabel(dateStr: string): string {
  if (dateStr === todayStr()) return 'Today'
  if (dateStr === addDaysStr(-1)) return 'Yesterday'
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const [ty, tm, td] = todayStr().split('-').map(Number)
  const diff = Math.round((new Date(ty, tm - 1, td).getTime() - date.getTime()) / 86_400_000)
  return diff > 1 && diff < 7
    ? date.toLocaleDateString('en-US', { weekday: 'long' })
    : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export type HistoryDay = { date: string; items: Task[] }

// Everything completed in the last `days` days, grouped by day, newest first.
// Days with nothing done are skipped. A one-off lands on its completedDate; a
// routine appears on every day in its completion log, so the same task can
// show up under several days. Within a day, timed tasks lead chronologically —
// the order the day itself ran in.
export function historyByDay(tasks: Task[], days = COMPLETED_RETENTION_DAYS): HistoryDay[] {
  const today = todayStr()
  const cutoff = daysAgoStr(days - 1)
  const byDate = new Map<string, Task[]>()
  const add = (date: string, t: Task) => {
    if (date < cutoff || date > today) return
    const list = byDate.get(date)
    if (list) list.push(t)
    else byDate.set(date, [t])
  }
  for (const t of tasks) {
    if (t.repeat) {
      for (const c of t.completions ?? []) add(c, t)
    } else if (t.done && t.completedDate) {
      add(t.completedDate, t)
    }
  }
  const byTime = (a: Task, b: Task) => {
    if (a.timeMin == null && b.timeMin == null) return 0
    if (a.timeMin == null) return 1
    if (b.timeMin == null) return -1
    return a.timeMin - b.timeMin
  }
  return [...byDate.keys()]
    .sort()
    .reverse()
    .map(date => ({ date, items: byDate.get(date)!.sort(byTime) }))
}

export function newTask(text: string, date: string = todayStr()): Task {
  return {
    id: `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    text,
    done: false,
    createdDate: date,
  }
}

// A fresh, unchecked step. Its own id namespace ("s…") keeps it distinct from a
// task id, though the two never mix in the same list.
export function newSubtask(text: string): Subtask {
  return { id: `s${Date.now()}${Math.random().toString(36).slice(2, 6)}`, text, done: false }
}

// How many of a task's steps are done, and how many there are. Zero total means
// the task has no checklist. Used for the progress pill on a task row.
export function subtaskProgress(task: Task): { done: number; total: number } {
  const subs = task.subtasks ?? []
  return { done: subs.filter(s => s.done).length, total: subs.length }
}

// Render a day's tasks as a plain-text checklist, ready to paste into a
// standup note, a message, or a journal. One line per task in the order given,
// with any time of day leading it, an estimate trailing in parentheses, and a
// checked box for finished ones. Tags stay in the text as written. A heading
// (the date) leads, so a pasted plan says which day it was. Callers pass tasks
// already in display order; an empty list yields just the heading.
export function formatPlanText(tasks: Task[], heading: string): string {
  const lines = tasks.map(t => {
    const box = t.done ? '- [x]' : '- [ ]'
    const time = t.timeMin != null ? `${formatTime(t.timeMin)} · ` : ''
    const estimate = t.estimateMin ? ` (${formatDuration(t.estimateMin)})` : ''
    return `${box} ${time}${t.text}${estimate}`
  })
  return lines.length ? `${heading}\n\n${lines.join('\n')}` : heading
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
  repeatEvery?: number // the N of an 'interval' recurrence ("every 3 days")
  estimateMin?: number // a rough time estimate (minutes) read from the text
  timeMin?: number // a time of day (minutes since midnight) read from the text
  schedule?: QuickAddSchedule // what was recognized, for the live preview
}

// Trailing recurrence phrases, most specific first so "every weekday" isn't
// mistaken for a daily "every day". A leading \s+ keeps a bare word like
// "weekly" a literal task; the optional trailing period tolerates "tomorrow.".
const REPEAT_PHRASES: { re: RegExp; rule: RepeatRule; label: string }[] = [
  { re: /\s+(?:every\s+weekday|on\s+weekdays|weekdays?)\.?\s*$/i, rule: 'weekdays', label: 'Weekdays' },
  { re: /\s+(?:every\s+month|monthly)\.?\s*$/i, rule: 'monthly', label: 'Monthly' },
  { re: /\s+(?:every\s+week|weekly)\.?\s*$/i, rule: 'weekly', label: 'Weekly' },
  { re: /\s+(?:every\s*day|everyday|daily)\.?\s*$/i, rule: 'daily', label: 'Every day' },
]
// Trailing every-N-days phrases: "every other day", "every 3 days". These name
// an interval routine (a start-anchored cadence, N ≥ 2), so they're read before
// the fixed recurrences above — "every 3 days" is an interval, not a mistaken
// daily. A bare "every day"/"daily" stays with the daily rule above.
const INTERVAL_OTHER_RE = /\s+every\s+other\s+day\.?\s*$/i
const INTERVAL_N_RE = /\s+every\s+(\d{1,3})\s+days?\.?\s*$/i

// Strip a trailing every-N-days phrase and resolve it to an interval count
// (2–365). Returns null when nothing is recognized, when stripping would empty
// the title, or when the count is out of range.
function parseTrailingInterval(text: string): { text: string; every: number } | null {
  const other = text.replace(INTERVAL_OTHER_RE, '').trim()
  if (other && other !== text) return { text: other, every: 2 }

  const nDays = text.match(INTERVAL_N_RE)
  if (nDays) {
    const n = Number(nDays[1])
    const stripped = text.replace(INTERVAL_N_RE, '').trim()
    if (stripped && n >= 2 && n <= 365) return { text: stripped, every: n }
  }
  return null
}

// Trailing day phrases, each resolving the title to an absolute date so the
// preview and the stored task always agree. The three-letter prefix of a
// matched weekday name keys its day-of-week. "today" is intentionally absent,
// so a real title like "What did I get done today" is never rewritten.
const DOW3: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }
const TOMORROW_RE = /\s+(?:tomorrow|tmrw|tmw)\.?\s*$/i
const NEXT_WEEK_RE = /\s+next\s+week\.?\s*$/i
const IN_DAYS_RE = /\s+in\s+(\d{1,3})\s+days?\.?\s*$/i
const IN_WEEKS_RE = /\s+in\s+(\d{1,2})\s+weeks?\.?\s*$/i
const WEEKDAY_RE =
  /\s+(?:(?:on|next|this)\s+)?(sun(?:day)?|mon(?:day)?|tue(?:s|sday)?|wed(?:s|nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?)\.?\s*$/i

// The three-letter prefix of a month name keys its month (0 = Jan … 11 = Dec),
// so "Aug", "August", and "Sept" all resolve the same way. The alternation
// below tolerates the common long forms and the "Sept" spelling of September.
const MONTH3: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}
const MONTH_NAME =
  '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
// A trailing calendar date, written either way round: "Aug 20", "on August 3rd",
// "20 Aug", "3rd of December". The day carries an optional ordinal suffix. A
// meridiem-less number and a required month name keep it clear of a time of day.
const MONTH_DAY_RE = new RegExp(`\\s+(?:on\\s+)?${MONTH_NAME}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\.?\\s*$`, 'i')
const DAY_MONTH_RE = new RegExp(`\\s+(?:on\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_NAME}\\.?\\s*$`, 'i')

// Days in a given month (0 = Jan … 11 = Dec) of a given year — day 0 of the
// next month is the last day of this one, so February's length follows the
// year's leap rule.
function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate()
}

// Resolve a bare month-and-day to the next date that lands on it (YYYY-MM-DD).
// Like a weekday name, a calendar date always points forward: a day already
// past this year rolls to next year. Returns null for a day the month can't
// hold (e.g. "Feb 30", or "Feb 29" in the coming non-leap years), so an
// impossible date stays literal text rather than being quietly moved.
function nextDateOnMonthDay(month0: number, day: number): string | null {
  const today = todayStr()
  const thisYear = Number(today.split('-')[0])
  for (const year of [thisYear, thisYear + 1]) {
    if (day < 1 || day > daysInMonth(year, month0)) continue
    const candidate = `${year}-${String(month0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (candidate >= today) return candidate
  }
  return null
}

// Strip a trailing day phrase ("tomorrow", "friday", "in 3 days", "next week",
// "in 2 weeks", "Aug 20", "20 August") and resolve it to an absolute date.
// Returns null when nothing is recognized, or when stripping would empty the
// title (so "friday" or "August" typed alone stays a literal task).
function parseTrailingDate(text: string): { text: string; date: string } | null {
  const tomorrow = text.replace(TOMORROW_RE, '').trim()
  if (tomorrow && tomorrow !== text) return { text: tomorrow, date: addDaysStr(1) }

  const nextWeek = text.replace(NEXT_WEEK_RE, '').trim()
  if (nextWeek && nextWeek !== text) return { text: nextWeek, date: addDaysStr(7) }

  const inWeeks = text.match(IN_WEEKS_RE)
  if (inWeeks) {
    const n = Number(inWeeks[1])
    const stripped = text.replace(IN_WEEKS_RE, '').trim()
    if (stripped && n >= 1 && n <= 52) return { text: stripped, date: addDaysStr(n * 7) }
  }

  const inDays = text.match(IN_DAYS_RE)
  if (inDays) {
    const n = Number(inDays[1])
    const stripped = text.replace(IN_DAYS_RE, '').trim()
    if (stripped && n >= 1 && n <= 365) return { text: stripped, date: addDaysStr(n) }
  }

  // A calendar date, either order ("Aug 20" or "20 Aug"). Both need a month
  // name, so a bare number is never mistaken for one; an impossible day leaves
  // the phrase in the title.
  const monthDay = text.match(MONTH_DAY_RE)
  if (monthDay) {
    const stripped = text.replace(MONTH_DAY_RE, '').trim()
    const date = nextDateOnMonthDay(MONTH3[monthDay[1].slice(0, 3).toLowerCase()], Number(monthDay[2]))
    if (stripped && date) return { text: stripped, date }
  }
  const dayMonth = text.match(DAY_MONTH_RE)
  if (dayMonth) {
    const stripped = text.replace(DAY_MONTH_RE, '').trim()
    const date = nextDateOnMonthDay(MONTH3[dayMonth[2].slice(0, 3).toLowerCase()], Number(dayMonth[1]))
    if (stripped && date) return { text: stripped, date }
  }

  const weekday = text.match(WEEKDAY_RE)
  if (weekday) {
    const stripped = text.replace(WEEKDAY_RE, '').trim()
    if (stripped) return { text: stripped, date: nextWeekdayStr(DOW3[weekday[1].slice(0, 3).toLowerCase()]) }
  }

  return null
}

// Trailing time-estimate phrases: "30m", "45 min", "1h", "2 hours", "1h 30m".
// An hours unit always needs h/hr/hour and a minutes unit always needs
// m/min/minute, so a bare trailing number ("Read chapter 3", "Run 5km") is
// never mistaken for a duration. The combined form is tried first.
const EST_HM_RE = /\s+(\d{1,2})\s*h(?:rs?|ours?)?\s*(\d{1,2})\s*m(?:ins?|inutes?)?\.?\s*$/i
const EST_H_RE = /\s+(\d{1,2})\s*h(?:rs?|ours?)?\.?\s*$/i
const EST_M_RE = /\s+(\d{1,3})\s*m(?:ins?|inutes?)?\.?\s*$/i

// Strip a trailing duration and resolve it to minutes (1–1440). Returns null
// when nothing is recognized, or when stripping would empty the title (so a
// bare "30m" stays a literal task).
function parseTrailingEstimate(text: string): { text: string; estimateMin: number } | null {
  const tries: { re: RegExp; minutes: (m: RegExpMatchArray) => number }[] = [
    { re: EST_HM_RE, minutes: m => Number(m[1]) * 60 + Number(m[2]) },
    { re: EST_H_RE, minutes: m => Number(m[1]) * 60 },
    { re: EST_M_RE, minutes: m => Number(m[1]) },
  ]
  for (const { re, minutes } of tries) {
    const match = text.match(re)
    if (!match) continue
    const min = minutes(match)
    const stripped = text.replace(re, '').trim()
    if (stripped && min >= 1 && min <= 1440) return { text: stripped, estimateMin: min }
  }
  return null
}

// Trailing time-of-day *ranges*: "9-11am", "9am-1pm", "9:30-10:30am",
// "2-3:30pm", "14:00-15:30". A range names a block — a start time and, from the
// gap between the two ends, a duration — so "Deep work 9-11am" becomes a 9 AM
// task with a 2h estimate in one phrase. As with a single time, a meridiem
// (am/pm) on either end or a 24-hour "HH:MM" on both is required, so a bare
// "Read pages 9-11" is never mistaken for a block.
const MERIDIEM = '(?:([ap])\\.?m\\.?)?'
const TIME_RANGE_RE = new RegExp(
  `\\s+(?:from\\s+)?(\\d{1,2})(?::([0-5]\\d))?\\s*${MERIDIEM}\\s*(?:-|–|—|to|until)\\s*(\\d{1,2})(?::([0-5]\\d))?\\s*${MERIDIEM}\\.?\\s*$`,
  'i'
)

// Strip a trailing time range and resolve it to a start time (minutes since
// midnight) and a duration (minutes). Returns null when nothing is recognized,
// when stripping would empty the title, or when the ends don't form a real
// forward block.
function parseTrailingTimeRange(
  text: string
): { text: string; timeMin: number; estimateMin: number } | null {
  const m = text.match(TIME_RANGE_RE)
  if (!m) return null
  const stripped = text.replace(TIME_RANGE_RE, '').trim()
  if (!stripped) return null
  const h1 = Number(m[1]), min1 = m[2] ? Number(m[2]) : 0, ap1 = m[3]?.toLowerCase()
  const h2 = Number(m[4]), min2 = m[5] ? Number(m[5]) : 0, ap2 = m[6]?.toLowerCase()

  let startMin: number
  let endMin: number
  if (ap1 || ap2) {
    // 12-hour clock. Hours must be 1–12; a missing meridiem on one end borrows
    // the other's, so "9-11am" is all morning and "9am-11" likewise.
    if (h1 < 1 || h1 > 12 || h2 < 1 || h2 > 12) return null
    const to12 = (h: number, min: number, ap: string): number => (h % 12 + (ap === 'p' ? 12 : 0)) * 60 + min
    const startAp = ap1 ?? ap2!
    const endAp = ap2 ?? ap1!
    startMin = to12(h1, min1, startAp)
    endMin = to12(h2, min2, endAp)
    // A shared meridiem that lands the end at or before the start usually means
    // the block crosses noon ("11-1pm" is 11 AM–1 PM): flip the borrowed end.
    if (endMin <= startMin) {
      if (!ap2 && endAp === 'a') endMin = to12(h2, min2, 'p')
      else if (!ap1 && startAp === 'p') startMin = to12(h1, min1, 'a')
    }
  } else {
    // 24-hour clock, required on *both* ends ("14:00-15:30"), so a bare "9-11"
    // is never read as a block.
    if (m[2] === undefined || m[5] === undefined || h1 > 23 || h2 > 23) return null
    startMin = h1 * 60 + min1
    endMin = h2 * 60 + min2
  }

  const estimateMin = endMin - startMin
  if (startMin < 0 || startMin > 1439 || estimateMin < 1 || estimateMin > 1440) return null
  return { text: stripped, timeMin: startMin, estimateMin }
}

// Trailing time-of-day phrases: "9am", "9:30 am", "at 2pm", "at 14:00". A
// meridiem (am/pm) or a 24-hour "HH:MM" makes the intent unambiguous, so a bare
// trailing number ("Read chapter 5", "Call 911") is never read as a time.
const TIME_AMPM_RE = /\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?\s*$/i
const TIME_24H_RE = /\s+(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\.?\s*$/i

// Strip a trailing time of day and resolve it to minutes since midnight.
// Returns null when nothing is recognized, or when stripping would empty the
// title (so a bare "9am" stays a literal task).
function parseTrailingTime(text: string): { text: string; timeMin: number } | null {
  const ampm = text.match(TIME_AMPM_RE)
  if (ampm) {
    let h = Number(ampm[1])
    const m = ampm[2] ? Number(ampm[2]) : 0
    const stripped = text.replace(TIME_AMPM_RE, '').trim()
    if (stripped && h >= 1 && h <= 12 && m <= 59) {
      if (h === 12) h = 0 // 12am → 0, 12pm → 12 (after the +12 below)
      if (ampm[3].toLowerCase() === 'p') h += 12
      return { text: stripped, timeMin: h * 60 + m }
    }
  }
  const h24 = text.match(TIME_24H_RE)
  if (h24) {
    const stripped = text.replace(TIME_24H_RE, '').trim()
    if (stripped) return { text: stripped, timeMin: Number(h24[1]) * 60 + Number(h24[2]) }
  }
  return null
}

// Trailing named times of day: "noon", "midnight", "morning", "tonight". People
// reach for the word before the clock face — "Lunch noon", "Call mom tonight",
// "Meds midnight" — so quick-add reads these the same way it reads "9am", and
// maps each to a round hour. "noon" and "midnight" are exact; the vaguer words
// take a conventional time (previewed before you commit, so the exact minute is
// never a surprise, and the time menu can nudge it after). An optional leading
// "at" ("at noon") or "this" ("this morning") is tolerated. Most specific first
// so "tonight" wins before a bare "night". A leading \s keeps a one-word task
// like "Morning" literal, and each phrase must leave a non-empty title behind.
const NAMED_TIME_PHRASES: { re: RegExp; timeMin: number }[] = [
  { re: /\s+(?:at\s+)?midnight\.?\s*$/i, timeMin: 0 },
  { re: /\s+(?:at\s+)?noon\.?\s*$/i, timeMin: 12 * 60 },
  { re: /\s+(?:this\s+)?morning\.?\s*$/i, timeMin: 9 * 60 },
  { re: /\s+(?:this\s+)?afternoon\.?\s*$/i, timeMin: 14 * 60 },
  { re: /\s+(?:this\s+)?evening\.?\s*$/i, timeMin: 18 * 60 },
  { re: /\s+(?:tonight|(?:at\s+|this\s+)?night)\.?\s*$/i, timeMin: 21 * 60 },
]

// Strip a trailing named time of day and resolve it to minutes since midnight.
// Returns null when nothing is recognized, or when stripping would empty the
// title (so a bare "noon" stays a literal task).
function parseTrailingNamedTime(text: string): { text: string; timeMin: number } | null {
  for (const { re, timeMin } of NAMED_TIME_PHRASES) {
    const stripped = text.replace(re, '').trim()
    if (stripped && stripped !== text) return { text: stripped, timeMin }
  }
  return null
}

// A single trailing hashtag, matched the same way tags.ts recognizes one (a
// leading letter, then up to 30 word characters or hyphens). Tags live inline in
// the task text, so a natural entry often ends with one — "Standup 10am #work".
// Peeling it aside lets the schedule phrase behind it be read, then it's put
// back; the leading \s keeps a task typed as just "#work" a literal title.
const TRAILING_TAG_RE = /\s#[A-Za-z][\w-]{0,29}$/

// Strip recognized trailing phrases from `input`, returning the cleaned title
// and everything found. People stack these in any order ("Standup 9am 15m",
// "Call Sam friday 2pm"), so each kind — recurrence, day, time of day, estimate
// — is peeled off the end in turn until none remains, at most one of each.
// Trailing hashtags are peeled aside the same way and reattached at the end, so
// a tag written after the schedule ("Gym 6pm every day #health") doesn't hide
// it. Never strips down to an empty title. Recurrence wins as the schedule,
// since the task will recur.
export function parseQuickAdd(input: string): QuickAdd {
  let text = input.trim()
  if (!text) return { text }

  let repeat: RepeatRule | undefined
  let repeatEvery: number | undefined
  let repeatLabel = ''
  let date: string | undefined
  let timeMin: number | undefined
  let estimateMin: number | undefined
  // Hashtags peeled off the end, newest first, so a schedule phrase sitting
  // behind them can be read. Reattached after the loop in their original order.
  const trailingTags: string[] = []

  // Peel one recognized trailing token per pass, newest match first, until a
  // pass finds nothing — so order in the text doesn't matter.
  for (;;) {
    // A trailing hashtag is set aside first each pass, so "Standup 10am #work"
    // reads the time behind it. Skipped when it would empty the title, leaving a
    // bare "#work" as its own literal task.
    const tag = text.match(TRAILING_TAG_RE)
    if (tag) {
      const stripped = text.slice(0, tag.index).trim()
      if (stripped) {
        trailingTags.unshift(tag[0].trim())
        text = stripped
        continue
      }
    }
    if (repeat === undefined) {
      // An every-N-days interval is tried before the fixed phrases, so "every 3
      // days" reads as an interval rather than being missed by them.
      const interval = parseTrailingInterval(text)
      if (interval) {
        text = interval.text
        repeat = 'interval'
        repeatEvery = interval.every
        repeatLabel = formatInterval(interval.every)
        continue
      }
      const hit = REPEAT_PHRASES.find(({ re }) => {
        const stripped = text.replace(re, '').trim()
        return stripped && stripped !== text
      })
      if (hit) {
        text = text.replace(hit.re, '').trim()
        repeat = hit.rule
        repeatLabel = hit.label
        continue
      }
    }
    if (date === undefined) {
      const trailing = parseTrailingDate(text)
      if (trailing) {
        text = trailing.text
        date = trailing.date
        continue
      }
    }
    // A time range fills both slots at once ("9-11am" → 9 AM start, 2h long),
    // so it's tried before the single-time and estimate checks and only while
    // neither has been set.
    if (timeMin === undefined && estimateMin === undefined) {
      const range = parseTrailingTimeRange(text)
      if (range) {
        text = range.text
        timeMin = range.timeMin
        estimateMin = range.estimateMin
        continue
      }
    }
    if (timeMin === undefined) {
      const time = parseTrailingTime(text)
      if (time) {
        text = time.text
        timeMin = time.timeMin
        continue
      }
      // A named time — "noon", "tonight" — reads the same slot as a clock time.
      const named = parseTrailingNamedTime(text)
      if (named) {
        text = named.text
        timeMin = named.timeMin
        continue
      }
    }
    if (estimateMin === undefined) {
      const estimate = parseTrailingEstimate(text)
      if (estimate) {
        text = estimate.text
        estimateMin = estimate.estimateMin
        continue
      }
    }
    break
  }

  // Put the peeled tags back on the title, so they still render as chips and
  // drive the tag filter — only the schedule phrase between them was removed.
  if (trailingTags.length > 0) text = `${text} ${trailingTags.join(' ')}`.trim()

  const schedule: QuickAddSchedule | undefined = repeat
    ? { kind: 'repeat', label: repeatLabel }
    : date
      ? { kind: 'date', label: formatDayLabel(date) }
      : undefined

  return { text, date, repeat, repeatEvery, estimateMin, timeMin, schedule }
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
