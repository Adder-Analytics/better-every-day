'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import Link from 'next/link'
import {
  type Task,
  loadPlanner,
  savePlanner,
  newTask,
  parseQuickAdd,
  todayStr,
  addDaysStr,
  isDueOn,
  isCompletedOn,
  isSkippedOn,
  formatTime,
  formatTimeRange,
  formatDuration,
  formatRepeatDays,
  formatInterval,
  PLANNER_VERSION,
} from '@/lib/planner'
import { extractTags, stripTags } from '@/lib/tags'
import TagChip from '@/components/TagChip'

const emptySubscribe = () => () => {}

// True only after hydration, so this localStorage- and clock-backed view never
// mismatches the server HTML (same guard the planner uses).
function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// How many days the week view lays out: today plus the next six.
const SPAN = 7

// Heroicons "calendar" (a due routine), sized for a task row's leading marker.
function RepeatMark({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356M2.985 19.644v-4.992h4.992m-4.681-2.72a7.5 7.5 0 0112.548-3.364l3.18 3.182m0 0V9.349m0 2.401a7.5 7.5 0 01-12.548 3.364l-3.18-3.182" />
    </svg>
  )
}

// A short label for a routine's cadence, mirroring the wording used on the task
// row and in the repeat menu elsewhere in the app.
function repeatLabel(task: Task): string {
  if (task.repeat === 'daily') return 'Every day'
  if (task.repeat === 'weekdays') return 'Weekdays'
  if (task.repeat === 'weekly') return 'Weekly'
  if (task.repeat === 'monthly') return 'Monthly'
  if (task.repeat === 'interval') return formatInterval(task.repeatEvery ?? 2)
  if (task.repeat === 'days') return formatRepeatDays(task.repeatDays ?? [])
  return ''
}

// A day's heading: "Today", "Tomorrow", or a weekday name, paired with a short
// date. Parsed from parts so the weekday is correct in every timezone.
function dayHeading(dateStr: string, offset: number): { label: string; date: string } {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long' })
  return { label, date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
}

// Whether a date (YYYY-MM-DD) falls on a weekend, parsed from parts.
function isWeekend(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dow = new Date(y, m - 1, d).getDay()
  return dow === 0 || dow === 6
}

// One task as it sits in a day: the underlying task plus whether it's done on
// that specific day (a routine tracks completion per day) and whether it's a
// past task still carried into today.
type DayTask = { task: Task; done: boolean; carriedFrom?: string }

// Everything planned for a given date: routines due (and not rested) that day,
// plus one-off tasks scheduled for it. Today also gathers the unfinished tasks
// carried over from earlier days, since those are really today's load.
function tasksForDay(tasks: Task[], date: string, today: string): DayTask[] {
  const out: DayTask[] = []
  for (const t of tasks) {
    if (t.repeat) {
      if (isDueOn(t, date) && !isSkippedOn(t, date)) out.push({ task: t, done: isCompletedOn(t, date) })
    } else if (!t.someday && t.createdDate === date) {
      out.push({ task: t, done: t.done })
    } else if (date === today && !t.someday && t.createdDate < today && !t.done) {
      out.push({ task: t, done: false, carriedFrom: t.createdDate })
    }
  }
  // Timed tasks lead in time order; still-to-do above finished, matching the
  // agenda's ordering elsewhere. Sort is stable, so ties keep their input order.
  return out.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    const at = a.task.timeMin, bt = b.task.timeMin
    if (at == null && bt == null) return 0
    if (at == null) return 1
    if (bt == null) return -1
    return at - bt
  })
}

export default function WeekView() {
  const mounted = useHydrated()
  const [tasks, setTasks] = useState<Task[]>(() =>
    typeof window === 'undefined' ? [] : loadPlanner().tasks
  )
  // A per-day draft, keyed by the day's date, for the quick-add inputs.
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const persist = useRef(false)

  // Save on change — but not on the first render, so simply visiting the page
  // never rewrites storage (and never trims finished tasks a moment early).
  useEffect(() => {
    if (!persist.current) { persist.current = true; return }
    savePlanner({ version: PLANNER_VERSION, tasks })
  }, [tasks])

  const today = todayStr()
  const days = Array.from({ length: SPAN }, (_, i) => {
    const date = addDaysStr(i)
    return { offset: i, date, items: tasksForDay(tasks, date, today) }
  })
  // The busiest day's task count anchors the load meter, so each day's bar reads
  // relative to the fullest one. At least 1 to avoid dividing by zero.
  const maxCount = Math.max(1, ...days.map(d => d.items.length))

  // Add a task under a given day. The column sets the default day; a schedule
  // typed into the text still wins (an explicit "next week" overrides the
  // column), and a recognized recurrence becomes a routine that starts that day.
  // Times, ranges, and estimates are read inline exactly as on the home add box.
  const addForDay = (date: string) => {
    const draft = (drafts[date] ?? '').trim()
    if (!draft) return
    const { text, date: typedDate, repeat, estimateMin, timeMin } = parseQuickAdd(draft)
    if (!text) return
    const base = newTask(text, repeat ? date : typedDate ?? date)
    const task: Task = repeat
      ? { ...base, repeat, estimateMin, timeMin }
      : { ...base, estimateMin, timeMin }
    setTasks(prev => [...prev, task])
    setDrafts(prev => ({ ...prev, [date]: '' }))
  }

  // Remove a one-off task from the plan. Only offered for one-offs — a routine
  // spans many days, so deleting it from a single column would be a surprise;
  // routines are managed from the task's own row on the home page.
  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  if (!mounted) {
    return (
      <div className="py-14 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="px-1 text-xs leading-relaxed text-zinc-400">
        Your next seven days at a glance. Drop a task under any day to plan ahead — add a time like{' '}
        <span className="text-zinc-500 dark:text-zinc-300">9am</span>, a block like{' '}
        <span className="text-zinc-500 dark:text-zinc-300">9–11am</span>, or make it repeat with{' '}
        <span className="text-zinc-500 dark:text-zinc-300">every day</span>.
      </p>

      {days.map(({ offset, date, items }) => {
        const heading = dayHeading(date, offset)
        const isToday = offset === 0
        const weekend = isWeekend(date)
        const remaining = items.filter(i => !i.done).length
        const plannedMin = items.filter(i => !i.done).reduce((sum, i) => sum + (i.task.estimateMin ?? 0), 0)

        return (
          <section
            key={date}
            className={`rounded-2xl border px-4 py-3.5 ${
              isToday
                ? 'border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/40 dark:bg-emerald-950/20'
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2 min-w-0">
                <h2
                  className={`text-sm font-semibold ${
                    isToday ? 'text-emerald-700 dark:text-emerald-300' : weekend ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-900 dark:text-white'
                  }`}
                >
                  {heading.label}
                </h2>
                <span className="text-xs tabular-nums text-zinc-400">{heading.date}</span>
              </div>
              {items.length > 0 && (
                <span className="flex-shrink-0 text-xs tabular-nums text-zinc-400">
                  {remaining > 0 ? (
                    <>
                      <span className="font-semibold text-zinc-600 dark:text-zinc-300">{remaining}</span> left
                    </>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">all done</span>
                  )}
                  {plannedMin > 0 && <span className="text-zinc-300 dark:text-zinc-600"> · {formatDuration(plannedMin)}</span>}
                </span>
              )}
            </div>

            {/* Load meter — each day's task count against the busiest day, so a
                lopsided week (everything piled on one day) reads at a glance. */}
            <div className="mt-2 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isToday ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'
                }`}
                style={{ width: `${(items.length / maxCount) * 100}%` }}
              />
            </div>

            {items.length > 0 && (
              <ul className="mt-2.5 space-y-1">
                {items.map(({ task, done, carriedFrom }) => {
                  const tags = extractTags(task.text)
                  const title = stripTags(task.text)
                  return (
                    <li key={task.id} className="group flex items-start gap-2 py-0.5">
                      <span className="mt-1 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
                        {done ? (
                          <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : task.repeat ? (
                          <RepeatMark className="h-3 w-3 text-zinc-300 dark:text-zinc-600" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                          {task.timeMin != null && (
                            <span className="flex-shrink-0 text-xs font-medium tabular-nums text-zinc-400">
                              {task.estimateMin ? formatTimeRange(task.timeMin, task.estimateMin) : formatTime(task.timeMin)}
                            </span>
                          )}
                          <span
                            className={`text-sm break-words ${
                              done ? 'text-zinc-400 line-through dark:text-zinc-600' : 'text-zinc-700 dark:text-zinc-200'
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
                        {(tags.length > 0 || task.estimateMin != null || task.repeat || carriedFrom) && (
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            {task.repeat && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                                <RepeatMark className="h-3 w-3" />
                                {repeatLabel(task)}
                              </span>
                            )}
                            {carriedFrom && (
                              <span className="text-[11px] text-amber-600/80 dark:text-amber-500/80">carried over</span>
                            )}
                            {task.estimateMin != null && task.timeMin == null && (
                              <span className="text-[11px] tabular-nums text-zinc-400">{formatDuration(task.estimateMin)}</span>
                            )}
                            {tags.map(tag => (
                              <TagChip key={tag} tag={tag} />
                            ))}
                          </div>
                        )}
                      </div>
                      {!task.repeat && (
                        <button
                          type="button"
                          onClick={() => removeTask(task.id)}
                          title="Remove this task"
                          aria-label={`Remove “${title}”`}
                          className="flex-shrink-0 rounded-md p-1 text-zinc-300 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-600 focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}

            {items.length === 0 && (
              <p className="mt-2.5 text-xs text-zinc-400 dark:text-zinc-500">Nothing planned yet.</p>
            )}

            {/* Per-day quick-add — drop a task straight onto this day. */}
            <input
              type="text"
              value={drafts[date] ?? ''}
              onChange={e => setDrafts(prev => ({ ...prev, [date]: e.target.value }))}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); addForDay(date) }
                if (e.key === 'Escape') setDrafts(prev => ({ ...prev, [date]: '' }))
              }}
              placeholder={`Add to ${heading.label}…`}
              aria-label={`Add a task to ${heading.label}, ${heading.date}`}
              className="mt-2.5 w-full rounded-lg border border-transparent bg-zinc-50 dark:bg-zinc-800/50 px-2.5 py-1.5 text-sm text-zinc-800 placeholder-zinc-400 transition-colors hover:border-zinc-200 focus:border-zinc-300 focus:bg-white focus:outline-none dark:text-zinc-100 dark:hover:border-zinc-700 dark:focus:border-zinc-600 dark:focus:bg-zinc-900"
            />
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
