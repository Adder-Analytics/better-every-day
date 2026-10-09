'use client'

import { useState, useMemo, useSyncExternalStore } from 'react'
import { historyByDay, loadPlanner, savePlanner, newTask, todayStr, PLANNER_VERSION, type Task, addDaysStr, HISTORY_WINDOW_DAYS, formatPastDayLabel, formatTime, formatTimeRange, formatDuration, completionMinuteOn, routineStreak, bestRoutineStreak, streakUnitOf } from '@/lib/planner'
import { useHour12 } from '@/lib/timeformat'
import { stripTags } from '@/lib/tags'
import { loadDayNotes } from '@/lib/daynotes'
import ActivityCalendar from '@/components/ActivityCalendar'
import HistoryStats from '@/components/HistoryStats'
import NoteText from '@/components/NoteText'

const emptySubscribe = () => () => {}

// True only after hydration, so localStorage-backed UI never mismatches server HTML.
function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// The quiet date beside a day's heading. "Today" or "Tuesday" gets its date;
// an older heading already reads "Tue, Sep 29", so it only gains the year,
// and only when that's not this year.
function dateAside(dateStr: string): string | null {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (/\d/.test(formatPastDayLabel(dateStr))) return y === new Date().getFullYear() ? null : String(y)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Heroicons magnifier and x-mark, for the history search box.
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.35-5.4a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z" />
    </svg>
  )
}
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

// Heroicons plus and check, for the "do again" button on a finished one-off.
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

// A fresh, unfinished copy of a finished one-off, on today's list. It keeps what
// describes the task (text and tags, note, estimate, star, steps unchecked) and
// drops what belonged to the day it was done: its time slot and any deadline.
function againToday(src: Task): Task {
  const base = newTask(src.text, todayStr())
  return {
    ...base,
    note: src.note,
    estimateMin: src.estimateMin,
    priority: src.priority,
    subtasks: src.subtasks?.map((s, i) => ({ ...s, id: `s${base.id.slice(1)}${i}`, done: false })),
  }
}

// The completed-task text with the matched part emphasized, so a match is easy
// to spot when scanning results. Case-insensitive; only the first hit per task
// is highlighted (there's rarely more than one in a short title).
function Highlighted({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-amber-200/70 dark:bg-amber-400/25 text-inherit">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

// The look-back: everything completed, grouped by day, newest first. It opens
// on the last 30 days and pages further back on request; search reaches the
// whole year the planner keeps. The only write is "do again", which adds a fresh
// copy of a finished one-off to today; the finished task itself is never changed.
export default function HistoryList() {
  const mounted = useHydrated()
  const hour12 = useHour12()
  const [tasks, setTasks] = useState<Task[]>(() => (typeof window === 'undefined' ? [] : loadPlanner().tasks))
  // Finished task id -> the id of the copy "do again" put on today, so a second
  // tap can take it back off while it's still untouched.
  const [again, setAgain] = useState<Record<string, string>>({})

  // Write against a fresh read of storage rather than this page's snapshot, so
  // a planner open in another tab since this page loaded isn't overwritten.
  const commit = (change: (prev: Task[]) => Task[]) => {
    const next = change(loadPlanner().tasks)
    savePlanner({ version: PLANNER_VERSION, tasks: next })
    setTasks(next)
  }

  const toggleAgain = (src: Task) => {
    const copyId = again[src.id]
    if (copyId) {
      commit(prev => prev.filter(t => !(t.id === copyId && !t.done)))
      setAgain(prev => {
        const rest = { ...prev }
        delete rest[src.id]
        return rest
      })
      return
    }
    const copy = againToday(src)
    commit(prev => [...prev, copy])
    setAgain(prev => ({ ...prev, [src.id]: copy.id }))
  }
  const [dayNotes] = useState(() => (typeof window === 'undefined' ? {} : loadDayNotes()))
  const [query, setQuery] = useState('')
  // How many days back the unfiltered list reaches. Grows a window at a time.
  const [spanDays, setSpanDays] = useState(HISTORY_WINDOW_DAYS)

  const allDays = useMemo(() => historyByDay(tasks), [tasks])

  // When searching, narrow each day to the tasks whose text matches, dropping
  // days left with none. Matching runs over the raw text (tags included), so a
  // "#work" or a bare word both find their tasks; the display still strips tags.
  const q = query.trim().toLowerCase()
  const days = useMemo(() => {
    if (!q) return allDays
    return allDays
      .map(day => ({ date: day.date, items: day.items.filter(t => t.text.toLowerCase().includes(q)) }))
      .filter(day => day.items.length > 0)
  }, [allDays, q])
  const matchCount = useMemo(() => days.reduce((sum, d) => sum + d.items.length, 0), [days])

  if (!mounted) {
    return (
      <div className="py-14 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
      </div>
    )
  }

  const total = allDays.reduce((sum, d) => sum + d.items.length, 0)
  const searching = q.length > 0

  // Unfiltered, show only the days inside the current span; a search runs
  // over everything kept. Days are newest first, so the hidden ones are a tail.
  const spanCutoff = addDaysStr(-(spanDays - 1))
  const shownDays = searching ? days : days.filter(d => d.date >= spanCutoff)
  const earlierDays = searching ? [] : days.filter(d => d.date < spanCutoff)
  const earlierCount = earlierDays.reduce((sum, d) => sum + d.items.length, 0)

  // Live streaks for every routine that has one going. Current runs lead;
  // the best-ever run tags along quietly once it's been beaten before.
  const streaks = tasks
    .filter(t => t.repeat)
    .map(t => ({ task: t, current: routineStreak(t), best: bestRoutineStreak(t) }))
    .filter(s => s.current >= 1)
    .sort((a, b) => b.current - a.current)

  if (total === 0) {
    return (
      <div className="text-center py-14">
        <svg className="w-10 h-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-zinc-600 dark:text-zinc-300 font-medium">Nothing to look back on yet</p>
        <p className="text-zinc-400 text-sm mt-1">Tasks you complete will show up here, day by day.</p>
      </div>
    )
  }

  return (
    <div className="py-2 space-y-2">
      {/* Look back for something specific — "when did I last go to the gym?",
          "did I pay that invoice?" Filters the completed tasks below as you
          type; the overview cards step aside while a search is running. */}
      <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 focus-within:border-zinc-300 dark:focus-within:border-zinc-600 transition-colors">
        <SearchIcon className="h-4 w-4 flex-shrink-0 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape' && query) { e.preventDefault(); setQuery('') } }}
          placeholder="Search what you got done"
          aria-label="Search your history"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
        />
        {searching && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="flex-shrink-0 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {searching && (
        <p className="px-1 text-xs text-zinc-400 tabular-nums" aria-live="polite">
          {matchCount === 0
            ? 'No matches'
            : `${matchCount} ${matchCount === 1 ? 'task' : 'tasks'} across ${days.length} ${days.length === 1 ? 'day' : 'days'}`}
        </p>
      )}

      {searching && matchCount === 0 && (
        <div className="text-center py-14">
          <SearchIcon className="w-10 h-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
          <p className="text-zinc-600 dark:text-zinc-300 font-medium">Nothing found</p>
          <p className="text-zinc-400 text-sm mt-1">
            No completed task in the last year matches “{query.trim()}”.
          </p>
        </div>
      )}

      {!searching && <HistoryStats tasks={tasks} />}
      {!searching && <ActivityCalendar tasks={tasks} />}
      {!searching && streaks.length > 0 && (
        <div className="mt-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3">
          <p className="mb-2 px-0.5 text-xs font-medium text-zinc-400">Streaks</p>
          <ul className="space-y-1.5">
            {streaks.map(({ task, current, best }) => {
              const unit = streakUnitOf(task)
              return (
                <li key={task.id} className="flex items-center gap-2.5 px-0.5 min-w-0">
                  <svg
                    aria-hidden="true"
                    className="w-3.5 h-3.5 flex-shrink-0 text-amber-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
                  </svg>
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300">{stripTags(task.text)}</span>
                  <span className="flex-shrink-0 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-200">{current}</span>
                    {' '}{unit}{current === 1 ? '' : 's'}
                    {best > current && (
                      <span className="text-zinc-400 dark:text-zinc-500"> · best {best}</span>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      <ol className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
        {shownDays.map(day => (
          <li key={day.date} className="py-4">
            <div className="flex items-baseline justify-between gap-2 px-1">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {formatPastDayLabel(day.date)}
                {dateAside(day.date) && (
                  <span className="ml-2 font-normal text-zinc-400 dark:text-zinc-500">
                    <time dateTime={day.date}>{dateAside(day.date)}</time>
                  </span>
                )}
              </p>
              <p className="text-xs text-zinc-400 tabular-nums flex-shrink-0">{day.items.length} done</p>
            </div>
            {dayNotes[day.date] && (
              <NoteText
                text={dayNotes[day.date]}
                className="mt-2 px-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-zinc-500 dark:text-zinc-400"
              />
            )}
            <ul className="mt-2 space-y-1.5">
              {/* A routine can appear under several days, so keys pair date + id. */}
              {day.items.map(task => {
                // The minute this task was actually finished, if it was recorded.
                // When present it leads the row as a quiet "done at" stamp — the
                // most honest read for a look-back; the planned time or estimate
                // stands in only where no completion time was tracked.
                const doneAt = completionMinuteOn(task, day.date)
                return (
                <li key={`${day.date}-${task.id}`} className="flex items-center gap-2.5 px-1 min-w-0">
                  <svg
                    aria-hidden="true"
                    className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="min-w-0 truncate text-sm text-zinc-700 dark:text-zinc-300">
                    <Highlighted text={stripTags(task.text)} query={query} />
                  </span>
                  {doneAt != null ? (
                    <span
                      title={`Finished at ${formatTime(doneAt, hour12)}`}
                      className="flex-shrink-0 text-[10px] font-medium tabular-nums text-zinc-400 dark:text-zinc-500"
                    >
                      {formatTime(doneAt, hour12)}
                    </span>
                  ) : task.timeMin != null ? (
                    <span className="flex-shrink-0 text-[10px] font-medium tabular-nums text-zinc-400 dark:text-zinc-500">
                      {task.estimateMin ? formatTimeRange(task.timeMin, task.estimateMin, hour12) : formatTime(task.timeMin, hour12)}
                    </span>
                  ) : (
                    task.estimateMin && (
                      <span className="flex-shrink-0 text-[10px] font-medium tabular-nums text-zinc-400 dark:text-zinc-500">
                        {formatDuration(task.estimateMin)}
                      </span>
                    )
                  )}
                  {task.repeat && (
                    <svg
                      aria-label="Repeats"
                      className="w-3 h-3 flex-shrink-0 text-zinc-300 dark:text-zinc-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356M2.985 19.644v-4.992h4.992m-4.681-2.72a7.5 7.5 0 0112.548-3.364l3.18 3.182m0 0V9.349m0 2.401a7.5 7.5 0 01-12.548 3.364l-3.18-3.182" />
                    </svg>
                  )}
                  {/* Put a finished one-off back on today — the errand that came
                      round again, the call that needs another go. A second tap
                      takes the copy back off. Routines already come back. */}
                  {!task.repeat && (
                    again[task.id] ? (
                      <button
                        type="button"
                        onClick={() => toggleAgain(task)}
                        aria-label={`Added to today: ${stripTags(task.text)}. Remove it`}
                        title="On today's list. Tap to take it off."
                        className="ml-auto -my-1 flex flex-shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-emerald-600 transition-colors hover:bg-zinc-100 dark:text-emerald-400 dark:hover:bg-zinc-800"
                      >
                        <CheckIcon className="h-3 w-3" />
                        On today
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleAgain(task)}
                        aria-label={`Do again today: ${stripTags(task.text)}`}
                        title="Do again today"
                        className="ml-auto -my-1 flex flex-shrink-0 items-center justify-center rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                    )
                  )}
                </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ol>
      {earlierCount > 0 && (
        <button
          type="button"
          onClick={() => setSpanDays(s => s + HISTORY_WINDOW_DAYS)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:hover:border-zinc-700 dark:hover:text-white"
        >
          <svg aria-hidden="true" className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
          Show earlier
          <span className="font-normal text-zinc-400 tabular-nums">
            · {earlierCount} more {earlierCount === 1 ? 'task' : 'tasks'}
          </span>
        </button>
      )}
    </div>
  )
}
