'use client'

import Link from 'next/link'
import type { Task } from '@/lib/planner'
import { weekActivity } from '@/lib/planner'

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

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

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3">
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <p className="text-xs font-medium text-zinc-400">This week</p>
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
