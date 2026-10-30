'use client'

import { useSyncExternalStore } from 'react'
import { type WeekStart, weekStartStore } from '@/lib/weekstart'

const emptySubscribe = () => () => {}

const OPTIONS: { value: WeekStart; label: string; title: string }[] = [
  { value: 0, label: 'Sun', title: 'Weeks start on Sunday' },
  { value: 1, label: 'Mon', title: 'Weeks start on Monday' },
]

// A small labeled segmented control for the week-start preference, styled
// after the clock toggle. Reads the shared store so every week layout follows
// it at once, and holds off its active pill until hydration so it never
// flickers on load.
export default function WeekStartToggle() {
  const start = useSyncExternalStore(weekStartStore.subscribe, weekStartStore.get, () => 0 as WeekStart)
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  return (
    <div className="inline-flex items-center gap-2 text-[11px] text-zinc-400">
      <span id="week-start-label">Week starts</span>
      <div
        role="radiogroup"
        aria-labelledby="week-start-label"
        className={`inline-flex rounded-full bg-zinc-100 dark:bg-zinc-800/80 p-0.5 transition-opacity ${mounted ? 'opacity-100' : 'opacity-0'}`}
      >
        {OPTIONS.map(opt => {
          const active = start === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={opt.title}
              onClick={() => weekStartStore.set(opt.value)}
              className={`flex h-7 items-center justify-center rounded-full px-2.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
