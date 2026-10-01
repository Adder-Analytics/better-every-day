import Link from 'next/link'
import DayBanner from '@/components/DayBanner'
import Planner from '@/components/Planner'
import ThemeToggle from '@/components/ThemeToggle'
import TimeFormatToggle from '@/components/TimeFormatToggle'

// The app's views, in the order you'd move out from today. Each icon is the
// inner paths of a 24px Heroicons outline glyph.
const NAV: { href: string; label: string; title: string; icon: React.ReactNode }[] = [
  {
    href: '/',
    label: 'Today',
    title: 'Today’s plan',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    ),
  },
  {
    href: '/week',
    label: 'Week',
    title: 'Plan the next seven days',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    ),
  },
  {
    href: '/month',
    label: 'Month',
    title: 'See the whole month ahead',
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 8.25h18M4.5 5.25h15a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5h-15a1.5 1.5 0 01-1.5-1.5v-12a1.5 1.5 0 011.5-1.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12h2.25v2.25H7.5z" />
      </>
    ),
  },
  {
    href: '/routines',
    label: 'Routines',
    title: 'Your routines, streaks, and rhythm',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356M2.985 19.644v-4.992h4.992m-4.681-2.72a7.5 7.5 0 0112.548-3.364l3.18 3.182m0 0V9.349m0 2.401a7.5 7.5 0 01-12.548 3.364l-3.18-3.182" />
    ),
  },
  {
    href: '/tags',
    label: 'Tags',
    title: 'Your tasks, grouped by #tag',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />,
  },
]

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-xl mx-auto px-4 pt-4 pb-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="whitespace-nowrap text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">Better Every Day</h1>
              <p className="hidden truncate text-xs text-zinc-400 sm:block">A quiet place to plan your day</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <TimeFormatToggle />
              <ThemeToggle />
            </div>
          </div>
          <nav aria-label="Views" className="mt-3 flex gap-1 sm:-mx-1">
            {NAV.map(item => {
              const current = item.href === '/'
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.title}
                  aria-current={current ? 'page' : undefined}
                  className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-xs font-medium transition-colors sm:flex-none sm:flex-row sm:gap-1.5 sm:px-2.5 sm:text-sm ${
                    current
                      ? 'bg-zinc-200/70 text-zinc-900 dark:bg-zinc-800 dark:text-white'
                      : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    {item.icon}
                  </svg>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

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
