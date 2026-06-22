import Link from 'next/link'
import { currentDay, latestEntry } from '@/data/changelog'

export default function DayBanner() {
  const entry = latestEntry()

  return (
    <Link
      href="/changelog"
      className="block rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3.5 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <span className="flex-shrink-0 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold tabular-nums">
          Day {currentDay()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-zinc-400">What got better today</p>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{entry.title}</p>
        </div>
        <svg
          className="w-4 h-4 flex-shrink-0 text-zinc-300 dark:text-zinc-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
