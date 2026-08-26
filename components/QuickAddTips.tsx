'use client'

import { useEffect, useId, useRef, useState } from 'react'

// The add box quietly understands a lot — a trailing "tomorrow" or "Friday"
// schedules the task, "9am" or "noon" gives it a time, "9–11am" a whole block,
// "30m" an estimate, "due Friday" a deadline, "every day" a routine, "#work" a
// tag, and a trailing "!" marks it important. All of it stacks. But none of it
// was ever written down where you type, so the app's fastest path stayed hidden
// unless you already knew the words. This is that reference, right under the box:
// a calm, tappable disclosure — no hover, no modal — grouped by what each phrase
// sets, with a live example you could type verbatim.

type Tip = { example: string; does: string }
type Group = { title: string; tips: Tip[] }

const GROUPS: Group[] = [
  {
    title: 'Pick a day',
    tips: [
      { example: 'tomorrow', does: 'schedules it for tomorrow' },
      { example: 'Friday', does: 'the next Friday' },
      { example: 'Aug 20', does: 'a calendar date' },
      { example: 'in 3 days', does: 'a few days out' },
    ],
  },
  {
    title: 'Set a time',
    tips: [
      { example: '9am', does: 'a time of day' },
      { example: 'noon', does: 'or say it in words' },
      { example: '9–11am', does: 'a time block' },
      { example: '30m', does: 'how long it takes' },
    ],
  },
  {
    title: 'Add a deadline or repeat',
    tips: [
      { example: 'due Friday', does: 'a deadline to hit' },
      { example: 'every day', does: 'a daily routine' },
      { example: 'weekdays', does: 'Monday to Friday' },
      { example: 'every 3 days', does: 'a set cadence' },
    ],
  },
  {
    title: 'Group and flag',
    tips: [
      { example: '#work', does: 'a tag to group by' },
      { example: 'end with !', does: 'marks it important' },
    ],
  },
]

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  )
}

// A phrase you could type, styled to read as an example rather than prose. The
// en dash in a range renders cleanly in the mono face.
function Example({ children }: { children: React.ReactNode }) {
  return (
    <code className="flex-shrink-0 rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
      {children}
    </code>
  )
}

export default function QuickAddTips() {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  // Esc closes the tips while they're open and the focus is within them — so it
  // never steals the key from an unrelated Esc (a filter, focus mode) elsewhere.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && panelRef.current?.contains(document.activeElement)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div ref={panelRef} className="px-1">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        <LightbulbIcon className="h-3.5 w-3.5 flex-shrink-0" />
        <span>What you can type</span>
        <svg
          aria-hidden="true"
          className={`h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          className="mt-2 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-[tips-in_140ms_ease-out]"
        >
          <div className="grid gap-x-6 gap-y-3 p-3.5 sm:grid-cols-2">
            {GROUPS.map(group => (
              <div key={group.title}>
                <p className="pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  {group.title}
                </p>
                <ul className="space-y-1.5">
                  {group.tips.map(tip => (
                    <li key={tip.example} className="flex items-center gap-2">
                      <Example>{tip.example}</Example>
                      <span className="min-w-0 text-xs text-zinc-500 dark:text-zinc-400">{tip.does}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="border-t border-zinc-100 dark:border-zinc-800 px-3.5 py-2.5 text-[11px] text-zinc-400 dark:text-zinc-500">
            These stack, in any order —{' '}
            <code className="font-mono text-zinc-500 dark:text-zinc-300">Report tomorrow 2pm 30m #work !</code>{' '}
            reads all of it at once.
          </p>
        </div>
      )}
    </div>
  )
}
