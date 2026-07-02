import type { Metadata } from 'next'
import Link from 'next/link'
import { changelog, currentDay } from '@/data/changelog'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'Changelog',
  description: `What changed, day by day. Currently on Day ${currentDay()}.`,
}

function formatEntryDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ChangelogPage() {
  const entries = [...changelog].reverse()

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">Changelog</h1>
            <p className="text-xs text-zinc-400">What changed, day by day</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              Back to today
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-2">
        <ol className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
          {entries.map(entry => (
            <li key={entry.day} className="py-4">
              <div className="flex items-baseline gap-2 text-xs text-zinc-400">
                <span className="font-medium tabular-nums text-zinc-500 dark:text-zinc-400">Day {entry.day}</span>
                <time dateTime={entry.date}>{formatEntryDate(entry.date)}</time>
                {entry.type && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {entry.type}
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">{entry.title}</h2>
              <p className="mt-0.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{entry.description}</p>
            </li>
          ))}
        </ol>
      </div>

      <footer className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-xs text-zinc-400">A running log of what changed, for anyone curious.</p>
      </footer>
    </main>
  )
}
