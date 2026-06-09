import type { Metadata } from 'next'
import Link from 'next/link'
import { changelog, currentDay, type ChangeType } from '@/data/changelog'

export const metadata: Metadata = {
  title: 'Changelog',
  description: `Every improvement this app has shipped, one per day. Currently on Day ${currentDay()}.`,
}

const TYPE_STYLES: Record<ChangeType, string> = {
  feature: 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400',
  design: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400',
  fix: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400',
  speed: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400',
  content: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400',
}

function formatEntryDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function ChangelogPage() {
  const entries = [...changelog].reverse()

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">Changelog</h1>
            <p className="text-xs text-zinc-400">One improvement, every day</p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            ← Back to today
          </Link>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-5 space-y-2.5">
        {entries.map(entry => (
          <article
            key={entry.day}
            className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-4"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold tabular-nums">
                Day {entry.day}
              </span>
              <span className="text-xs text-zinc-400">{formatEntryDate(entry.date)}</span>
              {entry.type && (
                <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_STYLES[entry.type]}`}>
                  {entry.type}
                </span>
              )}
            </div>
            <h2 className="font-medium text-zinc-800 dark:text-zinc-100">
              {entry.emoji && <span className="mr-1.5">{entry.emoji}</span>}
              {entry.title}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{entry.description}</p>
          </article>
        ))}
      </div>

      <footer className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-xs text-zinc-400">Every entry here was shipped by an AI session — one per day, no skips counted.</p>
      </footer>
    </main>
  )
}
