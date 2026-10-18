import type { Metadata } from 'next'
import TagsView from '@/components/TagsView'
import AppHeader from '@/components/AppHeader'

export const metadata: Metadata = {
  title: 'Tags',
  description: 'Every #tag you use, gathered into a list — see all of a context across today, the days ahead, someday, and your routines.',
}

export default function TagsPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader title="Tags" subtitle="Each context, and what’s on it" current="/tags" />

      <div className="max-w-xl mx-auto px-4 py-4">
        <TagsView />
      </div>

      <footer className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-xs text-zinc-400">Tags live inline in your tasks. Nothing is sent anywhere.</p>
      </footer>
    </main>
  )
}
