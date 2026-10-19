import Link from 'next/link'
import AppHeader from '@/components/AppHeader'
import DayBanner from '@/components/DayBanner'
import Planner from '@/components/Planner'
import { currentDay } from '@/data/changelog'

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader title="Better Every Day" subtitle="A quiet place to plan your day" current="/" />

      <div className="max-w-xl mx-auto px-4 py-5 space-y-2.5">
        <DayBanner />
        <Planner />
      </div>

      <footer className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-xs text-zinc-400">
          Your tasks stay in your browser. Nothing is sent anywhere.
        </p>
        <Link
          href="/changelog"
          className="mt-2 inline-block text-xs text-zinc-400 underline-offset-2 hover:text-zinc-600 hover:underline dark:hover:text-zinc-300"
        >
          Day {currentDay()} · What’s changed
        </Link>
      </footer>
    </main>
  )
}
