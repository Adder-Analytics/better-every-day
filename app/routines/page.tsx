import type { Metadata } from 'next'
import Link from 'next/link'
import RoutinesView from '@/components/RoutinesView'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'Routines',
  description: 'Every routine you’re keeping, with its streak and recent rhythm — and today’s to check off.',
}

export default function RoutinesPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">Routines</h1>
            <p className="text-xs text-zinc-400">Your habits, streaks, and rhythm</p>
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
        <RoutinesView />
      </div>

      <footer className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-xs text-zinc-400">Routines live in your browser. Nothing is sent anywhere.</p>
      </footer>
    </main>
  )
}
