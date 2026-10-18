import type { Metadata } from 'next'
import HistoryList from '@/components/HistoryList'
import AppHeader from '@/components/AppHeader'

export const metadata: Metadata = {
  title: 'History',
  description: 'What you got done, day by day, over the last year.',
}

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader title="History" subtitle="What you got done, day by day" />

      <div className="max-w-xl mx-auto px-4 py-2">
        <HistoryList />
      </div>

      <footer className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-xs text-zinc-400">Completed tasks are kept for a year, in your browser.</p>
      </footer>
    </main>
  )
}
