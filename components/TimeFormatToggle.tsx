'use client'

import { useSyncExternalStore } from 'react'
import { type TimeFormat, timeFormatStore } from '@/lib/timeformat'

const emptySubscribe = () => () => {}

const OPTIONS: { value: TimeFormat; label: string; title: string }[] = [
  { value: '12', label: '12h', title: '12-hour clock (2:30 PM)' },
  { value: '24', label: '24h', title: '24-hour clock (14:30)' },
]

// A small segmented control for the clock preference, a sibling of the theme
// switcher: both decide how the app looks, neither touches what's stored. Reads
// the shared store so it stays in sync with the command menu, and holds off its
// active pill until hydration so it never flickers on load — the same guard the
// theme toggle uses.
export default function TimeFormatToggle() {
  const format = useSyncExternalStore(timeFormatStore.subscribe, timeFormatStore.get, () => '12' as TimeFormat)
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  return (
    <div
      role="radiogroup"
      aria-label="Time format"
      className={`inline-flex rounded-full bg-zinc-100 dark:bg-zinc-800/80 p-0.5 transition-opacity ${mounted ? 'opacity-100' : 'opacity-0'}`}
    >
      {OPTIONS.map(opt => {
        const active = format === opt.value
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            title={opt.title}
            onClick={() => timeFormatStore.set(opt.value)}
            className={`flex h-7 items-center justify-center rounded-full px-2.5 text-xs font-medium tabular-nums transition-colors ${
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
  )
}
