'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import Link from 'next/link'
import {
  type Task,
  loadPlanner,
  savePlanner,
  todayStr,
  addDaysStr,
  isDueOn,
  isCompletedOn,
  isSkippedOn,
  routineStreak,
  bestRoutineStreak,
  formatRepeatDays,
  monthlyDayLabel,
  formatDayLabel,
  PLANNER_VERSION,
} from '@/lib/planner'
import { extractTags, stripTags } from '@/lib/tags'
import TagChip from '@/components/TagChip'

const emptySubscribe = () => () => {}

// True only after hydration, so this localStorage- and clock-backed view never
// mismatches the server HTML (the same guard the planner and week view use).
function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// How many past due days the consistency strip shows — a few weeks of a daily
// routine, or a handful of months for a monthly one. Enough to read the recent
// rhythm without turning into a wall of dots.
const RECENT_DUE = 14
// How far the "next due" scan looks ahead before giving up. A year covers even a
// monthly routine landing on a short-month edge.
const LOOKAHEAD = 366
// How far back the consistency strip scans to gather RECENT_DUE due days. Wide
// enough that even a once-a-month routine fills its dots, bounded so the loop
// always ends.
const LOOKBACK = 800

// How a routine stands today: due and waiting, already done, taken as a rest
// day, or simply not scheduled for today.
type TodayState = 'due' | 'done' | 'resting' | 'off'

function todayState(task: Task, today: string): TodayState {
  if (isSkippedOn(task, today)) return 'resting'
  if (isDueOn(task, today)) return isCompletedOn(task, today) ? 'done' : 'due'
  return 'off'
}

// The unit a routine's streak counts in, so "5" reads as days, weeks, or months
// to match its cadence — the same vocabulary the task row uses.
function streakUnit(task: Task): string {
  return task.repeat === 'monthly' ? 'month' : task.repeat === 'weekly' ? 'week' : 'day'
}

// A short cadence label, mirroring the wording used on the task row, the repeat
// menu, and the week view. A monthly routine names the day it lands on.
function cadenceLabel(task: Task): string {
  switch (task.repeat) {
    case 'daily':
      return 'Every day'
    case 'weekdays':
      return 'Weekdays'
    case 'weekly':
      return 'Weekly'
    case 'monthly':
      return `Monthly on ${monthlyDayLabel(task)}`
    case 'days':
      return formatRepeatDays(task.repeatDays ?? [])
    default:
      return ''
  }
}

// The next date this routine is due (and not already rested), skipping today
// when it's already done — so "Next" always points at real upcoming work.
// Null when nothing falls in the look-ahead window.
function nextDueDate(task: Task): string | null {
  for (let i = 0; i <= LOOKAHEAD; i++) {
    const date = addDaysStr(i)
    if (!isDueOn(task, date) || isSkippedOn(task, date)) continue
    if (i === 0 && isCompletedOn(task, date)) continue
    return date
  }
  return null
}

// One dot in the consistency strip: a due day and how it went. 'pending' is
// today, still open — neither kept nor missed yet.
type DueMark = { date: string; state: 'done' | 'skip' | 'miss' | 'pending' }

// The routine's last RECENT_DUE due days, oldest first, each classified. Scans
// back from today, collecting only the days it was actually due, and never
// before it was created.
function recentDueDays(task: Task, today: string): DueMark[] {
  const out: DueMark[] = []
  for (let i = 0; i <= LOOKBACK && out.length < RECENT_DUE; i++) {
    const date = addDaysStr(-i)
    if (date < task.createdDate) break
    if (!isDueOn(task, date)) continue
    const state: DueMark['state'] = isSkippedOn(task, date)
      ? 'skip'
      : isCompletedOn(task, date)
        ? 'done'
        : date === today
          ? 'pending'
          : 'miss'
    out.push({ date, state })
  }
  return out.reverse()
}

// Everything the row needs, derived once per routine so the sort and the render
// read the same numbers.
type RoutineRow = {
  task: Task
  state: TodayState
  streak: number
  best: number
  next: string | null
  recent: DueMark[]
}

// Actionable first (a routine waiting on you today), then done, resting, and
// finally the ones not due today; within a group, the longer streak leads, ties
// broken by title so the order is stable.
const STATE_RANK: Record<TodayState, number> = { due: 0, done: 1, resting: 2, off: 3 }

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function ResumeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356M2.985 19.644v-4.992h4.992m-4.681-2.72a7.5 7.5 0 0112.548-3.364l3.18 3.182m0 0V9.349m0 2.401a7.5 7.5 0 01-12.548 3.364l-3.18-3.182" />
    </svg>
  )
}

// A single dot in the consistency strip. Kept, rested, missed, and today-pending
// each read at a glance and carry a plain title for the curious (or a screen
// reader hovering the row).
function DueDot({ mark }: { mark: DueMark }) {
  const label =
    mark.state === 'done'
      ? `Kept on ${mark.date}`
      : mark.state === 'skip'
        ? `Rested on ${mark.date}`
        : mark.state === 'pending'
          ? `Due today — still open`
          : `Missed on ${mark.date}`
  const cls =
    mark.state === 'done'
      ? 'bg-emerald-500'
      : mark.state === 'skip'
        ? 'bg-amber-300 dark:bg-amber-500/70'
        : mark.state === 'pending'
          ? 'bg-transparent ring-1 ring-inset ring-zinc-400 dark:ring-zinc-500'
          : 'bg-zinc-200 dark:bg-zinc-700'
  return <span title={label} className={`h-2 w-2 flex-shrink-0 rounded-full ${cls}`} />
}

export default function RoutinesView() {
  const mounted = useHydrated()
  const [tasks, setTasks] = useState<Task[]>(() =>
    typeof window === 'undefined' ? [] : loadPlanner().tasks
  )
  const persist = useRef(false)

  // Save on change — but not on the first render, so simply visiting the page
  // never rewrites storage (or trims a long-finished one-off a moment early).
  useEffect(() => {
    if (!persist.current) {
      persist.current = true
      return
    }
    savePlanner({ version: PLANNER_VERSION, tasks })
  }, [tasks])

  const today = todayStr()

  // Mark today's due routine kept, or clear it — the same per-day completion the
  // home page records, so a routine returns fresh tomorrow either way.
  const toggleToday = (id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id || !t.repeat) return t
        const done = (t.completions ?? []).includes(today)
        const completions = done
          ? (t.completions ?? []).filter(c => c !== today)
          : [...(t.completions ?? []), today]
        return { ...t, completions }
      })
    )
  }

  // End a rest day — drop today from the routine's skips so it returns to the
  // day's work. Stored as undefined when the list empties, keeping the shape
  // clean, exactly as the home page does.
  const resumeToday = (id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t
        const skips = (t.skips ?? []).filter(s => s !== today)
        return { ...t, skips: skips.length ? skips : undefined }
      })
    )
  }

  const rows: RoutineRow[] = tasks
    .filter(t => t.repeat)
    .map(task => ({
      task,
      state: todayState(task, today),
      streak: routineStreak(task, today),
      best: bestRoutineStreak(task, today),
      next: nextDueDate(task),
      recent: recentDueDays(task, today),
    }))
    .sort(
      (a, b) =>
        STATE_RANK[a.state] - STATE_RANK[b.state] ||
        b.streak - a.streak ||
        stripTags(a.task.text).localeCompare(stripTags(b.task.text))
    )

  const dueCount = rows.filter(r => r.state === 'due').length
  const doneCount = rows.filter(r => r.state === 'done').length

  if (!mounted) {
    return (
      <div className="py-14 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 px-5 py-12 text-center">
          <svg className="mx-auto mb-3 h-9 w-9 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356M2.985 19.644v-4.992h4.992m-4.681-2.72a7.5 7.5 0 0112.548-3.364l3.18 3.182m0 0V9.349m0 2.401a7.5 7.5 0 01-12.548 3.364l-3.18-3.182" />
          </svg>
          <p className="font-medium text-zinc-600 dark:text-zinc-300">No routines yet</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-zinc-400">
            Make a task repeat and it becomes a routine — it reappears each day it’s due and builds a
            streak. Add one with{' '}
            <span className="text-zinc-500 dark:text-zinc-300">“every day”</span> or{' '}
            <span className="text-zinc-500 dark:text-zinc-300">“weekdays”</span>, or turn on repeat from a
            task’s menu.
          </p>
        </div>
        <div className="text-center">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            Back to today
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="px-1 text-xs leading-relaxed text-zinc-400">
        Every routine you’re keeping, in one place. Check off today’s due ones here, and see each
        one’s streak and recent rhythm at a glance.
        {(dueCount > 0 || doneCount > 0) && (
          <>
            {' '}
            <span className="text-zinc-500 dark:text-zinc-300">
              {dueCount > 0 ? `${dueCount} due today` : 'all caught up'}
              {doneCount > 0 && ` · ${doneCount} done`}
            </span>
            .
          </>
        )}
      </p>

      {rows.map(({ task, state, streak, best, next, recent }) => {
        const tags = extractTags(task.text)
        const title = stripTags(task.text)
        const unit = streakUnit(task)
        const done = state === 'done'
        const resting = state === 'resting'
        const interactive = state === 'due' || state === 'done'

        return (
          <section
            key={task.id}
            className={`rounded-2xl border px-4 py-3.5 ${
              state === 'due'
                ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                : done
                  ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/50'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Today's control — check off a due routine (or undo it). Only a
                  routine due today is completable, matching the home page; a
                  resting or not-due one shows a static marker instead. */}
              {interactive ? (
                <button
                  type="button"
                  onClick={() => toggleToday(task.id)}
                  aria-pressed={done}
                  title={done ? 'Kept today — tap to undo' : 'Mark kept for today'}
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
                    done
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-zinc-300 text-transparent hover:border-emerald-500 hover:text-emerald-500/40 dark:border-zinc-600'
                  }`}
                >
                  <CheckIcon className="h-3 w-3" />
                  <span className="sr-only">{done ? 'Undo today' : 'Mark kept for today'}</span>
                </button>
              ) : (
                <span
                  title={resting ? 'Resting today' : 'Not due today'}
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      resting ? 'bg-amber-300 dark:bg-amber-500/70' : 'bg-zinc-200 dark:bg-zinc-700'
                    }`}
                  />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                  <span
                    className={`text-sm font-medium break-words ${
                      done ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-800 dark:text-zinc-100'
                    }`}
                  >
                    {title}
                  </span>
                  {task.priority && (
                    <svg className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 24 24" aria-label="Important">
                      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  )}
                </div>

                {/* Cadence, streak, best, and what's next — the routine's shape
                    in a quiet line. */}
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-400">
                  <span className="inline-flex items-center gap-1">
                    <ResumeIcon className="h-3 w-3" />
                    {cadenceLabel(task)}
                  </span>
                  {streak >= 2 && (
                    <span className="inline-flex items-center gap-1" title={`Current streak — kept ${streak} ${unit}s in a row`}>
                      <FlameIcon className="h-3 w-3 text-amber-500" />
                      <span className="tabular-nums">
                        <span className="font-semibold text-zinc-600 dark:text-zinc-300">{streak}</span> {unit}
                        {streak === 1 ? '' : 's'}
                      </span>
                    </span>
                  )}
                  {best >= 2 && best > streak && (
                    <span className="tabular-nums" title={`Longest run — ${best} ${unit}s in a row`}>
                      best {best}
                    </span>
                  )}
                  {state !== 'due' && next && (
                    <span title={`Next due ${formatDayLabel(next)}`}>
                      next {formatDayLabel(next)}
                    </span>
                  )}
                </div>

                {(tags.length > 0 || recent.length > 0) && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    {recent.length > 0 && (
                      <span className="inline-flex items-center gap-1" aria-hidden="true">
                        {recent.map(mark => (
                          <DueDot key={mark.date} mark={mark} />
                        ))}
                      </span>
                    )}
                    {tags.map(tag => (
                      <TagChip key={tag} tag={tag} />
                    ))}
                  </div>
                )}
              </div>

              {/* Today's standing — a quiet pill, plus the one action a non-due
                  state offers (resuming a rest day). */}
              <div className="flex-shrink-0 pt-0.5">
                {state === 'due' && (
                  <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Due</span>
                )}
                {done && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    Done
                  </span>
                )}
                {resting && (
                  <button
                    type="button"
                    onClick={() => resumeToday(task.id)}
                    title="End the rest day — bring this routine back to today"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-amber-600 transition-colors hover:bg-amber-50 dark:text-amber-500 dark:hover:bg-amber-950/30"
                  >
                    <ResumeIcon className="h-3.5 w-3.5" />
                    Resume
                  </button>
                )}
              </div>
            </div>
          </section>
        )
      })}

      <div className="pt-1 text-center">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
        >
          Back to today
        </Link>
      </div>
    </div>
  )
}
