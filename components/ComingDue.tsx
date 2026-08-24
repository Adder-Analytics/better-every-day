'use client'

// One task with a deadline worth surfacing: its text (tags already stripped),
// a short note of where it lives ("Someday", a weekday, a past-day label), the
// deadline's short label ("overdue", "due today", "due tomorrow"), and how much
// attention it deserves. `run` jumps to the task's row.
export type DueItem = {
  id: string
  text: string
  where: string
  label: string
  tone: 'overdue' | 'soon'
  run: () => void
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M3 4.5h11.25l-1.5 4.5 1.5 4.5H3" />
    </svg>
  )
}

// A quiet safety net for deadlines that don't sit in today's list — a task
// parked in Someday, scheduled for a later day, or carried over from a past one
// can still slip past its due date because its "due" chip only shows on its own
// row, far down the page. This gathers the ones that are overdue or due within
// a day and lifts them to the top, most urgent first. Each row taps through to
// the task itself. Shown only when there's something in that window, so a day
// with nothing looming stays uncluttered.
export default function ComingDue({ items }: { items: DueItem[] }) {
  if (items.length === 0) return null

  return (
    <section
      aria-label="Coming due"
      className="rounded-2xl border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
        <FlagIcon className="h-3.5 w-3.5 flex-shrink-0 text-amber-500 dark:text-amber-400" />
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
          Coming due
        </p>
        <span className="tabular-nums text-xs text-amber-600/70 dark:text-amber-500/70">{items.length}</span>
      </div>

      <ul className="px-1.5 pb-1.5">
        {items.map(item => {
          const overdue = item.tone === 'overdue'
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={item.run}
                title={`Go to “${item.text}”`}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-[transform,background-color] duration-150 ease-out hover:bg-amber-100/60 dark:hover:bg-amber-900/25 active:scale-[0.99]"
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${overdue ? 'bg-rose-500' : 'bg-amber-500'}`}
                />
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-zinc-200">
                  {item.text}
                </span>
                <span className="flex-shrink-0 text-[11px] text-zinc-400 dark:text-zinc-500">{item.where}</span>
                <span
                  className={`flex-shrink-0 tabular-nums text-xs font-medium ${
                    overdue ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
