'use client'

import type { Task } from '@/lib/planner'
import { activityInsights, WEEKDAY_ABBR } from '@/lib/planner'

// Full weekday names, for the busiest-day tooltip (the tile itself shows the
// short form so the four tiles stay the same width).
const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// One tile in the summary strip: a value on top, a quiet label beneath, and a
// tooltip spelling out exactly what the number means. Values are tabular so the
// row of four aligns cleanly.
function Stat({ value, label, title }: { value: string; label: string; title: string }) {
  return (
    <div title={title} className="px-0.5 py-1">
      <p className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-white leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-zinc-400">{label}</p>
    </div>
  )
}

// A plain summary of the last 30 days — how much got done, on how many days,
// which weekday carried the most, and the longest run in a row. It reads the
// completion history the planner already keeps, so nothing is stored
// differently; the calendar below shows the same window's day-by-day shape.
export default function HistoryStats({ tasks }: { tasks: Task[] }) {
  const { windowDays, total, activeDays, busiestDow, busiestCount, bestStreak } = activityInsights(tasks)

  // Nothing done in the window — no numbers worth showing. (History's own empty
  // state covers a truly empty log; this guards a window with only older data.)
  if (total === 0) return null

  const busy = busiestDow != null ? WEEKDAY_ABBR[busiestDow] : '—'

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3">
      <p className="mb-2.5 px-0.5 text-xs font-medium text-zinc-400">Last {windowDays} days</p>
      <div className="grid grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-4">
        <Stat
          value={String(total)}
          label={total === 1 ? 'task done' : 'tasks done'}
          title={`${total} task${total === 1 ? '' : 's'} completed in the last ${windowDays} days`}
        />
        <Stat
          value={`${activeDays}`}
          label={activeDays === 1 ? 'active day' : 'active days'}
          title={`${activeDays} of the last ${windowDays} days had at least one task completed`}
        />
        <Stat
          value={busy}
          label="busiest day"
          title={
            busiestDow != null
              ? `${WEEKDAY_FULL[busiestDow]} carried the most — ${busiestCount} task${busiestCount === 1 ? '' : 's'}`
              : 'The weekday you complete the most tasks on'
          }
        />
        <Stat
          value={`${bestStreak}`}
          label={bestStreak === 1 ? 'day in a row' : 'days in a row'}
          title={`Your longest run of days in a row with a task completed, within the last ${windowDays} days`}
        />
      </div>
    </div>
  )
}
