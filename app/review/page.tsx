import type { Metadata } from 'next'
import Link from 'next/link'
import ReviewView from '@/components/ReviewView'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'Weekly review',
  description: 'A look back at your week — what got done, how it compares to last week, how your routines held, and a place to reflect.',
}

export default function ReviewPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">Weekly review</h1>
            <p className="text-xs text-zinc-400">Look back, and set up the week ahead</p>
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

      <div className="max-w-xl mx-auto px-4 py-4">
        <ReviewView />
      </div>

      <footer className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-xs text-zinc-400">Built from the history in your browser. Nothing is sent anywhere.</p>
      </footer>
    </main>
  )
}
