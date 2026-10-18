import type { Metadata } from 'next'
import WeekView from '@/components/WeekView'
import AppHeader from '@/components/AppHeader'

export const metadata: Metadata = {
  title: 'The week ahead',
  description: 'Your next seven days at a glance — see what’s planned and drop tasks onto any day.',
}

export default function WeekPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader title="The week ahead" subtitle="Plan the next seven days" current="/week" />

      <div className="max-w-xl mx-auto px-4 py-4">
        <WeekView />
      </div>

      <footer className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-xs text-zinc-400">Plans live in your browser. Nothing is sent anywhere.</p>
      </footer>
    </main>
  )
}
