'use client'

import Link from 'next/link'
import type { Task } from '@/lib/planner'
import { activityStreak, weekActivity } from '@/lib/planner'

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

// Heroicons "fire" — the same glyph the per-task streaks use, so the overall
// day streak reads in the app's existing streak vocabulary.
function FlameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
    </svg>
  )
}

// Parse from parts so the weekday is correct in every timezone
// (new Date('2026-06-14') would be parsed as UTC midnight and can shift a day).
function weekdayInitial(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return WEEKDAY[new Date(y, m - 1, d).getDay()]
}

export default function WeekActivity({ tasks }: { tasks: Task[] }) {
  const days = weekActivity(tasks)
  const total = days.reduce((sum, d) => sum + d.count, 0)

  // Nothing to look back on yet — stay out of the way.
  if (total === 0) return null

  const max = Math.max(...days.map(d => d.count))
  // A run only reads as a streak at two days and up — a single day is just a day
  // done, not yet a habit taking hold.
  const streak = activityStreak(tasks)

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3">
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="text-xs font-medium text-zinc-400">This week</p>
          {streak >= 2 && (
            <span
              title={`${streak}-day streak — you’ve completed a task ${streak} days in a row`}
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400"
            >
              <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-600">·</span>
              <FlameIcon className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
              <span className="tabular-nums">
                <span className="font-semibold text-zinc-700 dark:text-zinc-200">{streak}</span>-day streak
              </span>
            </span>
          )}
        </div>
        {/* The count doubles as the way into the full look-back — visible (not
            hover-revealed), so it works by touch too. */}
        <Link
          href="/history"
          title="See everything you got done, day by day"
          className="group/history flex items-center gap-0.5 text-xs text-zinc-400 tabular-nums hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{total}</span> done
          </span>
          <svg
            className="w-3 h-3 text-zinc-300 dark:text-zinc-600 group-hover/history:text-zinc-500 group-hover/history:translate-x-0.5 transition-all"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="sr-only">Open history</span>
        </Link>
      </div>
      <div className="flex justify-between gap-1.5 h-12">
        {days.map((d, i) => {
          const isToday = i === days.length - 1
          const heightPct = d.count === 0 ? 0 : Math.max((d.count / max) * 100, 14)
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              {/* Bars are absolutely anchored to the bottom of this box — a
                  percentage height on a plain flex child resolves against an
                  auto height and collapses to nothing. */}
              <div
                className="relative w-full flex-1"
                title={`${d.count} task${d.count === 1 ? '' : 's'} on ${d.date}`}
              >
                {d.count === 0 ? (
                  <div className="absolute bottom-0 w-full h-1 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                ) : (
                  <div
                    className={`absolute bottom-0 w-full rounded-md transition-all duration-500 ${
                      isToday ? 'bg-emerald-500' : 'bg-emerald-400/70 dark:bg-emerald-500/55'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                )}
              </div>
              <span
                className={`text-[10px] tabular-nums ${
                  isToday ? 'text-zinc-600 dark:text-zinc-300 font-semibold' : 'text-zinc-400'
                }`}
              >
                {weekdayInitial(d.date)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
