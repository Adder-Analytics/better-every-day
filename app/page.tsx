import { currentDay } from '@/data/changelog'
import DayBanner from '@/components/DayBanner'
import Planner from '@/components/Planner'
import ThemeToggle from '@/components/ThemeToggle'

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">Better Every Day</h1>
            <p className="text-xs text-zinc-400">A quiet place to plan your day</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="px-2.5 py-1 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold tabular-nums">
              Day {currentDay()}
            </span>
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
