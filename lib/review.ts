// The weekly review: a plain, once-a-week look back that the day-by-day views
// don't give on their own. It reads the same completion history the planner
// already keeps (nothing is stored differently) and assembles it into one
// reflective page — how the week went, how it compares to the week before,
// which routines held, and what's still open — so the week can be closed out
// and the next one set up. Weeks run Sunday–Saturday, matching the app's
// activity calendar; a week is named by its Sunday (YYYY-MM-DD).

import {
  type Task,
  todayStr,
  completionCounts,
  isDueOn,
  isCompletedOn,
  isSkippedOn,
  routineStreak,
} from './planner'
import { stripTags } from './tags'

// --- Week arithmetic ----------------------------------------------------------
// All built from YYYY-MM-DD parts (never `new Date('2026-06-14')`, which is
// parsed as UTC and can shift a day), so weekday alignment is correct in every
// timezone — the same care the planner's date helpers take.

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// N days from a YYYY-MM-DD string (local), YYYY-MM-DD. Negative reaches back.
export function shiftDate(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + n)
  return fmt(dt)
}

// The Sunday on or before a date — the start of the week that contains it.
export function weekStartOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dow = new Date(y, m - 1, d).getDay() // 0 = Sun … 6 = Sat
  return shiftDate(dateStr, -dow)
}

// The seven dates of a week (Sun … Sat), given its Sunday.
export function weekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => shiftDate(weekStart, i))
}

// A short label for a week's span: "Sep 7 – 13" when it stays in one month,
// "Aug 31 – Sep 6" when it crosses one. The year is appended only when the week
// isn't in the current calendar year, so a look back a few weeks stays terse
// while an older one is still unambiguous.
export function formatWeekRange(weekStart: string, today: string = todayStr()): string {
  const end = shiftDate(weekStart, 6)
  const [sy, sm, sd] = weekStart.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const startDt = new Date(sy, sm - 1, sd)
  const endDt = new Date(ey, em - 1, ed)
  const mon = (dt: Date) => dt.toLocaleDateString('en-US', { month: 'short' })
  const sameMonth = sy === ey && sm === em
  const left = `${mon(startDt)} ${sd}`
  const right = sameMonth ? String(ed) : `${mon(endDt)} ${ed}`
  const thisYear = Number(today.split('-')[0])
  const suffix = ey === thisYear ? '' : `, ${ey}`
  return `${left} – ${right}${suffix}`
}

// How one routine fared over a week: how many of its due days were completed,
// out of how many had come around by the cutoff. Skipped days (deliberate rest)
// count as neither due nor missed, matching how the streak reads them.
export type RoutineWeek = {
  id: string
  text: string // the task title with #tags stripped, as the review shows it
  dueCount: number // due days in the week that had arrived by the cutoff, minus rest days
  doneCount: number // of those, how many were completed
  streak: number // current streak as of today (context, not the week's own)
}

// Everything the review page reads for one week, all derived from completion
// history so nothing new is stored. `openNow` is meaningful only for the current
// week — you can't have "still open" work in a week that's already over — so the
// caller passes it and the view shows it only for the week containing today.
export type WeekReview = {
  weekStart: string
  dates: string[] // the seven Sun…Sat dates
  counts: number[] // tasks completed on each of those dates
  total: number // tasks completed across the week
  activeDays: number // days in the week with at least one completion
  busiestIndex: number | null // 0 = Sun … 6 = Sat, null when nothing was done
  busiestCount: number
  // Completions in the week before, counted over the same number of elapsed
  // days as this week — so a week still in progress compares fairly against the
  // same stretch of last week, not against last week's full seven days.
  prevTotal: number
  routines: RoutineWeek[] // routines that were due in the week, most-active first
}

// Assemble the review for the week that starts on `weekStart`. `today` bounds
// the routine adherence and the busiest-day read so a week in progress is judged
// only on the days that have actually happened.
export function weekReview(
  tasks: Task[],
  weekStart: string,
  today: string = todayStr()
): WeekReview {
  const counts = completionCounts(tasks)
  const dates = weekDates(weekStart)
  const dayCounts = dates.map(d => counts.get(d) ?? 0)

  let total = 0
  let activeDays = 0
  let busiestIndex: number | null = null
  let busiestCount = 0
  dates.forEach((date, i) => {
    // Days past today don't count toward the busiest read, so a quiet week in
    // progress isn't crowned on a day that hasn't come.
    if (date > today) return
    const c = dayCounts[i]
    total += c
    if (c > 0) {
      activeDays++
      if (c > busiestCount) {
        busiestCount = c
        busiestIndex = i
      }
    }
  })

  // The week before, for a plain "up/down from last week" line — counted over
  // the same number of elapsed days (1–7) as this week, so a Wednesday is
  // compared against last week through its Wednesday rather than its Saturday.
  const elapsed = dates.filter(d => d <= today).length || 7
  const prevDates = weekDates(shiftDate(weekStart, -7)).slice(0, elapsed)
  const prevTotal = prevDates.reduce((sum, d) => sum + (counts.get(d) ?? 0), 0)

  // Routine adherence within the week: for each routine, its due days that have
  // arrived (rest days set aside), and how many of those were completed.
  const cutoff = today < dates[6] ? today : dates[6]
  const routines: RoutineWeek[] = []
  for (const t of tasks) {
    if (!t.repeat) continue
    let due = 0
    let done = 0
    for (const date of dates) {
      if (date > cutoff) break
      if (!isDueOn(t, date)) continue
      if (isSkippedOn(t, date)) continue // a rest day is neither expected nor missed
      due++
      if (isCompletedOn(t, date)) done++
    }
    if (due === 0) continue
    routines.push({
      id: t.id,
      text: stripTags(t.text) || t.text,
      dueCount: due,
      doneCount: done,
      streak: routineStreak(t, today),
    })
  }
  // Most-completed first, then most-due, then alphabetically — a stable order
  // that puts the week's strongest routines at the top.
  routines.sort(
    (a, b) => b.doneCount - a.doneCount || b.dueCount - a.dueCount || a.text.localeCompare(b.text)
  )

  return {
    weekStart,
    dates,
    counts: dayCounts,
    total,
    activeDays,
    busiestIndex,
    busiestCount,
    prevTotal,
    routines,
  }
}
