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
  isDueOn,
  isCompletedOn,
  isSkippedOn,
  formatTime,
  formatTimeRange,
  formatDuration,
  formatRepeatDays,
  formatInterval,
  formatDue,
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

// Heroicons "calendar" (a due routine), sized for a task row's leading marker.
function RepeatMark({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356M2.985 19.644v-4.992h4.992m-4.681-2.72a7.5 7.5 0 0112.548-3.364l3.18 3.182m0 0V9.349m0 2.401a7.5 7.5 0 01-12.548 3.364l-3.18-3.182" />
    </svg>
  )
}

// A short label for a routine's cadence, mirroring the wording used on the task
// row and in the week view.
function repeatLabel(task: Task): string {
  if (task.repeat === 'daily') return 'Every day'
  if (task.repeat === 'weekdays') return 'Weekdays'
  if (task.repeat === 'weekly') return 'Weekly'
  if (task.repeat === 'monthly') return 'Monthly'
  if (task.repeat === 'interval') return formatInterval(task.repeatEvery ?? 2)
  if (task.repeat === 'days') return formatRepeatDays(task.repeatDays ?? [])
  return ''
}

// Assemble a YYYY-MM-DD from parts (month is 1-based here), zero-padded so it
// sorts and compares like the strings stored on tasks.
function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// One task as it sits on a day: the underlying task plus whether it's done on
// that specific day (a routine tracks completion per day) and whether it's a
// past one-off carried into today. Mirrors the week view.
type DayTask = { task: Task; done: boolean; carriedFrom?: string }

// Everything planned for a given date: routines due (and not rested) that day,
// plus one-off tasks scheduled for it. Today also gathers the unfinished tasks
// carried over from earlier days, since those are really today's load. Same
// rule the week view uses, so the two agree on what a day holds.
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
  return out.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    const at = a.task.timeMin, bt = b.task.timeMin
    if (at == null && bt == null) return 0
    if (at == null) return 1
    if (bt == null) return -1
    return at - bt
  })
}

// The color of a day-cell dot, by what the item is: finished (emerald),
// important (amber), a routine (sky), or a plain to-do (zinc).
function dotClass(it: DayTask): string {
  if (it.done) return 'bg-emerald-400 dark:bg-emerald-500'
  if (it.task.priority) return 'bg-amber-400'
  if (it.task.repeat) return 'bg-sky-400 dark:bg-sky-500'
  return 'bg-zinc-300 dark:bg-zinc-600'
}

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function MonthView() {
  const mounted = useHydrated()
  const [tasks, setTasks] = useState<Task[]>(() =>
    typeof window === 'undefined' ? [] : loadPlanner().tasks
  )
  const today = todayStr()
  const [ty, tm] = today.split('-').map(Number)
  // Which month the grid is showing (year, 1-based month), and which day is
  // open in the detail panel. Both start on today.
  const [view, setView] = useState<{ y: number; m: number }>({ y: ty, m: tm })
  const [selected, setSelected] = useState<string>(today)
  const [draft, setDraft] = useState('')
  const persist = useRef(false)

  // Save on change — but not on first render, so simply visiting never rewrites
  // storage (nor trims finished tasks a moment early). Same guard as elsewhere.
  useEffect(() => {
    if (!persist.current) { persist.current = true; return }
    savePlanner({ version: PLANNER_VERSION, tasks })
  }, [tasks])

  // The 42 cells (six weeks, Sunday-first) that cover the shown month with its
  // leading and trailing days from the neighbouring months.
  const firstDow = new Date(view.y, view.m - 1, 1).getDay()
  const gridStart = new Date(view.y, view.m - 1, 1 - firstDow)
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    const date = ymd(d.getFullYear(), d.getMonth() + 1, d.getDate())
    return { date, day: d.getDate(), inMonth: d.getMonth() + 1 === view.m, dow: d.getDay() }
  })

  // Deadlines that land on each day (only unfinished ones still count down), so
  // a day with something due shows a marker even when nothing is scheduled on it.
  const dueByDay = new Map<string, Task[]>()
  for (const t of tasks) {
    if (t.dueDate && !t.done) {
      const list = dueByDay.get(t.dueDate)
      if (list) list.push(t)
      else dueByDay.set(t.dueDate, [t])
    }
  }

  const monthLabel = new Date(view.y, view.m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const viewingNow = view.y === ty && view.m === tm

  const step = (delta: number) => {
    const d = new Date(view.y, view.m - 1 + delta, 1)
    setView({ y: d.getFullYear(), m: d.getMonth() + 1 })
  }
  const goToday = () => { setView({ y: ty, m: tm }); setSelected(today) }
  const selectCell = (date: string) => {
    const [y, m] = date.split('-').map(Number)
    if (m !== view.m || y !== view.y) setView({ y, m })
    setSelected(date)
    setDraft('')
  }

  // Add a task under the selected day. The day sets the default; a schedule
  // typed into the text still wins, and a recognized recurrence becomes a
  // routine that starts that day. Times, estimates, deadlines, and a trailing
  // "!" are read inline exactly as on the home add box.
  const addForDay = () => {
    const text0 = draft.trim()
    if (!text0) return
    const { text, date: typedDate, repeat, repeatEvery, estimateMin, timeMin, dueDate, priority } = parseQuickAdd(text0)
    if (!text) return
    const base = newTask(text, repeat ? selected : typedDate ?? selected)
    const task: Task = {
      ...base,
      ...(repeat ? { repeat, repeatEvery } : {}),
      ...(estimateMin != null ? { estimateMin } : {}),
      ...(timeMin != null ? { timeMin } : {}),
      ...(dueDate ? { dueDate } : {}),
      ...(priority ? { priority: true } : {}),
    }
    setTasks(prev => [...prev, task])
    setDraft('')
  }

  const removeTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id))

  if (!mounted) {
    return (
      <div className="py-14 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
      </div>
    )
  }

  const selItems = tasksForDay(tasks, selected, today)
  const selDue = dueByDay.get(selected) ?? []
  const [sy, sm, sd] = selected.split('-').map(Number)
  const selDate = new Date(sy, sm - 1, sd)
  const selLabel = selected === today
    ? 'Today'
    : selDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  const selShort = selDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="space-y-3">
      <p className="px-1 text-xs leading-relaxed text-zinc-400">
        The whole month at a glance — scheduled tasks, routines, and deadlines. Tap a day to see or
        add what falls on it, further out than the week view reaches.
      </p>

      {/* Month navigation */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => step(-1)}
            aria-label="Previous month"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h2 className="min-w-[9.5rem] text-center text-sm font-semibold tabular-nums text-zinc-900 dark:text-white">
            {monthLabel}
          </h2>
          <button
            onClick={() => step(1)}
            aria-label="Next month"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
        {!(viewingNow && selected === today) && (
          <button
            onClick={goToday}
            className="rounded-full px-2.5 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            Today
          </button>
        )}
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 px-0.5 text-center">
        {WEEKDAY_INITIALS.map((w, i) => (
          <div key={i} className={`text-[11px] font-medium ${i === 0 || i === 6 ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>
            {w}
          </div>
        ))}
      </div>

      {/* The grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ date, day, inMonth, dow }) => {
          const items = tasksForDay(tasks, date, today)
          const due = dueByDay.get(date) ?? []
          const isToday = date === today
          const isSel = date === selected
          const weekend = dow === 0 || dow === 6
          return (
            <button
              key={date}
              onClick={() => selectCell(date)}
              aria-label={`${new Date(date + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}${items.length ? `, ${items.length} planned` : ''}${due.length ? `, ${due.length} due` : ''}`}
              aria-pressed={isSel}
              className={`flex min-h-[3.25rem] flex-col items-center gap-1 rounded-xl border px-1 pt-1.5 pb-1 transition-colors ${
                isSel
                  ? 'border-zinc-400 bg-white ring-1 ring-zinc-300 dark:border-zinc-500 dark:bg-zinc-800 dark:ring-zinc-600'
                  : isToday
                    ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800/70 dark:bg-emerald-950/20'
                    : 'border-transparent hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-800 dark:hover:bg-zinc-900'
              }`}
            >
              <span
                className={`text-xs tabular-nums leading-none ${
                  isToday
                    ? 'font-bold text-emerald-600 dark:text-emerald-400'
                    : !inMonth
                      ? 'text-zinc-300 dark:text-zinc-700'
                      : weekend
                        ? 'font-medium text-zinc-400 dark:text-zinc-500'
                        : 'font-medium text-zinc-700 dark:text-zinc-200'
                }`}
              >
                {day}
              </span>
              {(items.length > 0 || due.length > 0) && (
                <span className="flex min-h-[0.5rem] items-center gap-[3px]">
                  {items.slice(0, 3).map((it, i) => (
                    <span key={i} className={`h-1.5 w-1.5 rounded-full ${inMonth ? '' : 'opacity-40'} ${dotClass(it)}`} />
                  ))}
                  {due.length > 0 && (
                    <span className={`h-1.5 w-1.5 rounded-full ring-1 ring-rose-400 dark:ring-rose-500 ${inMonth ? '' : 'opacity-40'}`} title="Deadline" />
                  )}
                  {items.length > 3 && (
                    <span className="text-[9px] leading-none text-zinc-400 tabular-nums">+{items.length - 3}</span>
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px] text-zinc-400">
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" /> task</span>
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-sky-400 dark:bg-sky-500" /> routine</span>
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> important</span>
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full ring-1 ring-rose-400 dark:ring-rose-500" /> deadline</span>
      </div>

      {/* Selected-day detail */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className={`text-sm font-semibold ${selected === today ? 'text-emerald-700 dark:text-emerald-300' : 'text-zinc-900 dark:text-white'}`}>
            {selLabel}
          </h3>
          {selItems.length > 0 && (
            <span className="flex-shrink-0 text-xs tabular-nums text-zinc-400">
              {selItems.filter(i => !i.done).length > 0
                ? <><span className="font-semibold text-zinc-600 dark:text-zinc-300">{selItems.filter(i => !i.done).length}</span> to do</>
                : <span className="text-emerald-600 dark:text-emerald-400">all done</span>}
            </span>
          )}
        </div>

        {selItems.length > 0 ? (
          <ul className="mt-2.5 space-y-1">
            {selItems.map(({ task, done, carriedFrom }) => {
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
                      <span className={`text-sm break-words ${done ? 'text-zinc-400 line-through dark:text-zinc-600' : 'text-zinc-700 dark:text-zinc-200'}`}>
                        {title}
                      </span>
                      {task.priority && (
                        <svg className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 24 24" aria-label="Important">
                          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      )}
                    </div>
                    {(tags.length > 0 || task.estimateMin != null || task.repeat || carriedFrom || task.dueDate) && (
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
                        {task.dueDate && !task.repeat && (() => {
                          const d = formatDue(task.dueDate, selected)
                          if (!d) return null
                          const tone = d.tone === 'overdue' ? 'text-rose-500' : d.tone === 'soon' ? 'text-amber-600 dark:text-amber-500' : 'text-zinc-400'
                          return <span className={`text-[11px] ${tone}`}>{d.label}</span>
                        })()}
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
        ) : (
          <p className="mt-2.5 text-xs text-zinc-400 dark:text-zinc-500">Nothing planned yet.</p>
        )}

        {/* Deadlines landing on this day — tasks that live elsewhere but are due
            now. Read-only here: they're managed from their own row on today. */}
        {selDue.length > 0 && (
          <div className="mt-3 border-t border-zinc-100 dark:border-zinc-800 pt-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-rose-500/80">Due this day</p>
            <ul className="mt-1 space-y-0.5">
              {selDue.map(t => (
                <li key={t.id} className="flex items-baseline gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ring-1 ring-rose-400 dark:ring-rose-500" />
                  <span className="break-words">{stripTags(t.text)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Per-day quick-add — drop a task straight onto the selected day. */}
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); addForDay() }
            if (e.key === 'Escape') setDraft('')
          }}
          placeholder={`Add to ${selShort}…`}
          aria-label={`Add a task to ${selLabel}`}
          className="mt-3 w-full rounded-lg border border-transparent bg-zinc-50 dark:bg-zinc-800/50 px-2.5 py-1.5 text-sm text-zinc-800 placeholder-zinc-400 transition-colors hover:border-zinc-200 focus:border-zinc-300 focus:bg-white focus:outline-none dark:text-zinc-100 dark:hover:border-zinc-700 dark:focus:border-zinc-600 dark:focus:bg-zinc-900"
        />
      </section>

      <div className="flex items-center justify-center gap-4 pt-1">
        <Link href="/week" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
          The week
        </Link>
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
        <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
          Back to today
        </Link>
      </div>
    </div>
  )
}
