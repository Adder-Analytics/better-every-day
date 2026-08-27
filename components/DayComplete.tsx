'use client'

import { formatDuration } from '@/lib/planner'

// Shown once today's list is fully checked off — the app's whole premise, a day
// finished, so the moment gets a proper recap instead of a bare line. It reads
// numbers the planner already keeps (how many tasks, how much estimated time, the
// running daily streak) and offers the natural next step: plan tomorrow. Purely a
// read of existing state — nothing here is stored.
export default function DayComplete({
  doneCount,
  doneMin,
  streak,
  onPlanTomorrow,
}: {
  doneCount: number
  doneMin: number // summed estimate of completed tasks; 0 when nothing was estimated
  streak: number // consecutive days with at least one task completed
  onPlanTomorrow: () => void
}) {
  return (
    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-5 py-5 text-center animate-[daycomplete-in_260ms_ease-out]">
      <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>

      <p className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">That’s everything for today</p>
      <p className="text-emerald-600/70 dark:text-emerald-500/70 text-xs mt-0.5">
        Everything’s checked off. Enjoy the rest of your day.
      </p>

      {/* A quiet recap of what the day held — only the parts that carry a real
          number, so a day with no estimates or no streak doesn't show an empty
          or zeroed pill. */}
      <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/70 dark:bg-emerald-900/30 px-2.5 py-1 font-medium text-emerald-700 dark:text-emerald-300 tabular-nums">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {doneCount} {doneCount === 1 ? 'task done' : 'tasks done'}
        </span>

        {doneMin > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/70 dark:bg-emerald-900/30 px-2.5 py-1 font-medium text-emerald-700 dark:text-emerald-300 tabular-nums">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDuration(doneMin)} planned
          </span>
        )}

        {streak >= 2 && (
          <span
            title={`${streak}-day streak — you’ve completed a task ${streak} days in a row`}
            className="inline-flex items-center gap-1 rounded-full bg-white/70 dark:bg-emerald-900/30 px-2.5 py-1 font-medium text-amber-600 dark:text-amber-400 tabular-nums"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                fill="currentColor"
                d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.176 7.547 7.547 0 01-1.705-1.715.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
              />
            </svg>
            {streak}-day streak
          </span>
        )}
      </div>

      {/* The natural next step once today is done: get tomorrow's plan down while
          it's fresh. Sets the add box to Tomorrow and puts the cursor there. */}
      <button
        type="button"
        onClick={onPlanTomorrow}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-300 dark:border-emerald-700/70 bg-white/60 dark:bg-emerald-900/20 px-3.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-white dark:hover:bg-emerald-900/40"
      >
        Plan tomorrow
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>
    </div>
  )
}
