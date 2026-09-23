import type { Metadata } from 'next'
import Link from 'next/link'
import TagsView from '@/components/TagsView'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'Tags',
  description: 'Every #tag you use, gathered into a list — see all of a context across today, the days ahead, someday, and your routines.',
}

export default function TagsPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">Tags</h1>
            <p className="text-xs text-zinc-400">Each context, and what&rsquo;s on it</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              Back to today
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-4">
        <TagsView />
      </div>

      <footer className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-xs text-zinc-400">Tags live inline in your tasks. Nothing is sent anywhere.</p>
      </footer>
    </main>
  )
}
