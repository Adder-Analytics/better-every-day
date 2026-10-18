import type { Metadata } from 'next'
import ReviewView from '@/components/ReviewView'
import AppHeader from '@/components/AppHeader'

export const metadata: Metadata = {
  title: 'Weekly review',
  description: 'A look back at your week — what got done, how it compares to last week, how your routines held, and a place to reflect.',
}

export default function ReviewPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader title="Weekly review" subtitle="Look back, and set up the week ahead" />

      <div className="max-w-xl mx-auto px-4 py-4">
        <ReviewView />
      </div>

      <footer className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-xs text-zinc-400">Built from the history in your browser. Nothing is sent anywhere.</p>
      </footer>
    </main>
  )
}
