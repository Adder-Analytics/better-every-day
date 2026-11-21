import type { Metadata } from 'next'
import DeletedList from '@/components/DeletedList'
import AppHeader from '@/components/AppHeader'

export const metadata: Metadata = {
  title: 'Recently deleted',
  description: 'Tasks deleted in the last 30 days, ready to restore.',
}

export default function DeletedPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader title="Recently deleted" subtitle="Deleted tasks, kept for 30 days" />

      <div className="max-w-xl mx-auto px-4 py-4">
        <DeletedList />
      </div>

      <footer className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-xs text-zinc-400">Deleted tasks are kept in your browser for 30 days, then removed.</p>
      </footer>
    </main>
  )
}
