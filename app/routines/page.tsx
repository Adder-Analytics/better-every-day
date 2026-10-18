import type { Metadata } from 'next'
import RoutinesView from '@/components/RoutinesView'
import AppHeader from '@/components/AppHeader'

export const metadata: Metadata = {
  title: 'Routines',
  description: 'Every routine you’re keeping, with its streak and recent rhythm — and today’s to check off.',
}

export default function RoutinesPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader title="Routines" subtitle="Your habits, streaks, and rhythm" current="/routines" />

      <div className="max-w-xl mx-auto px-4 py-4">
        <RoutinesView />
      </div>

      <footer className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-xs text-zinc-400">Routines live in your browser. Nothing is sent anywhere.</p>
      </footer>
    </main>
  )
}
