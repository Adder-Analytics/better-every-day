'use client'

import { useState, useSyncExternalStore } from 'react'
import { historyByDay, loadPlanner, formatPastDayLabel, formatTime, formatDuration, routineStreak, bestRoutineStreak } from '@/lib/planner'
import ActivityCalendar from '@/components/ActivityCalendar'

const emptySubscribe = () => () => {}

// True only after hydration, so localStorage-backed UI never mismatches server HTML.
function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

function formatFullDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// The look-back: everything completed in the last 30 days, grouped by day,
// newest first. Read-only — it never writes the planner, it just shows what
// the planner already remembers.
export default function HistoryList() {
  const mounted = useHydrated()
  const [tasks] = useState(() => (typeof window === 'undefined' ? [] : loadPlanner().tasks))

  if (!mounted) {
    return (
      <div className="py-14 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
      </div>
    )
  }

  const days = historyByDay(tasks)
  const total = days.reduce((sum, d) => sum + d.items.length, 0)

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
    <div className="py-2">
      <ActivityCalendar tasks={tasks} />
      {streaks.length > 0 && (
        <div className="mt-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3">
          <p className="mb-2 px-0.5 text-xs font-medium text-zinc-400">Streaks</p>
          <ul className="space-y-1.5">
            {streaks.map(({ task, current, best }) => {
              const unit = task.repeat === 'weekly' ? 'week' : 'day'
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
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300">{task.text}</span>
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
      <p className="px-1 py-2 text-xs text-zinc-400 tabular-nums">
        <span className="font-semibold text-zinc-700 dark:text-zinc-200">{total}</span>
        {' '}task{total === 1 ? '' : 's'} completed in the last 30 days
      </p>
      <ol className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
        {days.map(day => (
          <li key={day.date} className="py-4">
            <div className="flex items-baseline justify-between gap-2 px-1">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {formatPastDayLabel(day.date)}
                <span className="ml-2 font-normal text-zinc-400 dark:text-zinc-500">
                  <time dateTime={day.date}>{formatFullDate(day.date)}</time>
                </span>
              </p>
              <p className="text-xs text-zinc-400 tabular-nums flex-shrink-0">{day.items.length} done</p>
            </div>
            <ul className="mt-2 space-y-1.5">
              {/* A routine can appear under several days, so keys pair date + id. */}
              {day.items.map(task => (
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
                  <span className="min-w-0 truncate text-sm text-zinc-700 dark:text-zinc-300">{task.text}</span>
                  {task.timeMin != null && (
                    <span className="flex-shrink-0 text-[10px] font-medium tabular-nums text-zinc-400 dark:text-zinc-500">
                      {formatTime(task.timeMin)}
                    </span>
                  )}
                  {task.estimateMin && (
                    <span className="flex-shrink-0 text-[10px] font-medium tabular-nums text-zinc-400 dark:text-zinc-500">
                      {formatDuration(task.estimateMin)}
                    </span>
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
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  )
}
