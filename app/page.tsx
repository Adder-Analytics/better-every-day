import AppHeader from '@/components/AppHeader'
import DayBanner from '@/components/DayBanner'
import Planner from '@/components/Planner'

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
      </footer>
    </main>
  )
}
