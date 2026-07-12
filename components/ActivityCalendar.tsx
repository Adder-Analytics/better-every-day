'use client'

import type { Task } from '@/lib/planner'
import { activityCalendar, formatPastDayLabel } from '@/lib/planner'

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const WEEKS = 5

// A single-hue emerald ramp, light→dark, matching the weekly activity bars.
// Index 0 is the recessive "nothing done" neutral; 1–4 climb with the day's
// count. Each theme has its own steps, tuned against its surface rather than
// flipped, so the intensity reads on both zinc-50 and zinc-950.
const CELL_LEVEL = [
  'bg-zinc-100 dark:bg-zinc-800/70',
  'bg-emerald-200 dark:bg-emerald-900/70',
  'bg-emerald-300 dark:bg-emerald-700/80',
  'bg-emerald-400 dark:bg-emerald-600',
  'bg-emerald-500 dark:bg-emerald-500',
]

// Fixed thresholds, not a max-relative scale: for a daily planner the numbers
// are small, and a stable meaning ("this dark = four done") reads truer than a
// ramp that would paint a lone task the same as a packed day.
function level(count: number): number {
  if (count <= 0) return 0
  return Math.min(count, 4)
}

// A quiet look-back at consistency: one square per day for the last five weeks,
// shaded by how much got done. Read-only — it shows what the planner already
// remembers and never writes anything.
export default function ActivityCalendar({ tasks }: { tasks: Task[] }) {
  const weeks = activityCalendar(tasks, WEEKS)
  const cells = weeks.flat()
  const total = cells.reduce((sum, c) => sum + c.count, 0)

  return (
    <div className="mt-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3">
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <p className="text-xs font-medium text-zinc-400">Last {WEEKS} weeks</p>
        {/* A GitHub-style legend so the shading's meaning is visible, and exact
            counts never live in color alone (each cell also carries a tooltip). */}
        <div className="flex items-center gap-1 text-[10px] text-zinc-400">
          <span>Less</span>
          {CELL_LEVEL.map((c, i) => (
            <span key={i} className={`h-2.5 w-2.5 rounded-[3px] ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Weekday guides, aligned to the columns below. */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {WEEKDAY.map((w, i) => (
          <span key={i} className="text-center text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500">
            {w}
          </span>
        ))}
      </div>

      <div
        role="img"
        aria-label={`Tasks completed each day over the last ${WEEKS} weeks — ${total} in total.`}
        className="grid grid-cols-7 gap-1.5"
      >
        {cells.map(cell =>
          cell.isFuture ? (
            <span key={cell.date} aria-hidden="true" className="aspect-square" />
          ) : (
            <span
              key={cell.date}
              title={`${cell.count} task${cell.count === 1 ? '' : 's'} · ${formatPastDayLabel(cell.date)}`}
              className={`aspect-square rounded-[5px] ${CELL_LEVEL[level(cell.count)]} ${
                cell.isToday ? 'ring-1 ring-inset ring-emerald-500 dark:ring-emerald-400' : ''
              }`}
            />
          )
        )}
      </div>
    </div>
  )
}
