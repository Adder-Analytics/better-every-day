import type { Metadata } from 'next'
import MonthView from '@/components/MonthView'
import AppHeader from '@/components/AppHeader'

export const metadata: Metadata = {
  title: 'The month ahead',
  description: 'The whole month at a glance — scheduled tasks, routines, and deadlines, with a tap to plan any day.',
}

export default function MonthPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader title="The month ahead" subtitle="See what’s scheduled across the month" current="/month" />

      <div className="max-w-xl mx-auto px-4 py-4">
        <MonthView />
      </div>

      <footer className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-xs text-zinc-400">Plans live in your browser. Nothing is sent anywhere.</p>
      </footer>
    </main>
  )
}
