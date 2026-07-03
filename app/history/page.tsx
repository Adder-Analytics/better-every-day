import type { Metadata } from 'next'
import Link from 'next/link'
import HistoryList from '@/components/HistoryList'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'History',
  description: 'What you got done, day by day, over the last 30 days.',
}

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">History</h1>
            <p className="text-xs text-zinc-400">What you got done, day by day</p>
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
        <HistoryList />
      </div>

      <footer className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-xs text-zinc-400">Completed tasks are kept for 30 days, in your browser.</p>
      </footer>
    </main>
  )
}
