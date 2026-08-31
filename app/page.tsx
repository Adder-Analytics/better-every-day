import Link from 'next/link'
import DayBanner from '@/components/DayBanner'
import Planner from '@/components/Planner'
import ThemeToggle from '@/components/ThemeToggle'

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-xl mx-auto px-4 py-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">Better Every Day</h1>
            <p className="text-xs text-zinc-400">A quiet place to plan your day</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/week"
              title="Plan the next seven days"
              className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span>Week</span>
            </Link>
            <Link
              href="/month"
              title="See the whole month ahead"
              className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 8.25h18M4.5 5.25h15a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5h-15a1.5 1.5 0 01-1.5-1.5v-12a1.5 1.5 0 011.5-1.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12h2.25v2.25H7.5z" />
              </svg>
              <span>Month</span>
            </Link>
            <Link
              href="/routines"
              title="Your routines, streaks, and rhythm"
              className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356M2.985 19.644v-4.992h4.992m-4.681-2.72a7.5 7.5 0 0112.548-3.364l3.18 3.182m0 0V9.349m0 2.401a7.5 7.5 0 01-12.548 3.364l-3.18-3.182" />
              </svg>
              <span>Routines</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-5 space-y-2.5">
        <DayBanner />
        <Planner />
      </div>

      <footer className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-xs text-zinc-400">
          Your tasks stay in your browser. Nothing is sent anywhere.
        </p>
      </footer>
    </main>
  )
}
