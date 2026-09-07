'use client'

import { useEffect, useRef, useState } from 'react'
import { todayStr, formatDuration, formatTime } from '@/lib/planner'
import { useHour12 } from '@/lib/timeformat'
import { loadDayTarget, setDayTarget } from '@/lib/daytarget'

// minutes-since-midnight ↔ the "HH:MM" a native <input type="time"> uses, the
// same conversion a task's time-of-day picker uses.
const toTimeInput = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
const fromTimeInput = (value: string): number | null => {
  const [h, m] = value.split(':').map(Number)
  return Number.isInteger(h) && Number.isInteger(m) ? h * 60 + m : null
}

// A sun setting behind the horizon — the day winding down. Distinct from the
// day-focus pennant and the estimate clock, so the three don't read alike.
function SunsetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 18a5 5 0 0 0-10 0M12 3v3M4.2 10.2l1.4 1.4M19.8 10.2l-1.4 1.4M2 18h2M20 18h2M3 22h18"
      />
    </svg>
  )
}

// A sensible default for the picker before the user has chosen anything — the
// end of a common workday. Only seeds the input; nothing is stored until a pick.
const DEFAULT_TARGET = 17 * 60 // 5:00 PM
// One-tap wrap-up times for the quick row, so a common choice skips the spinner.
const PRESETS = [17 * 60, 18 * 60, 21 * 60, 22 * 60]

// The day's wrap-up time — the hour you want today to wind down — read live
// against the plan. Set it and a quiet line shows how long is left until then,
// and, once tasks carry estimates, whether the still-to-do work fits with time
// to spare or runs over. Forward-looking like the day focus, and stored the same
// way (apart from tasks, keyed by date). Held out of focus mode by the caller,
// and once the day's fully done — the recap takes over then.
export default function DayTarget({
  nowMin,
  remainingMin,
  hasWork,
}: {
  nowMin: number
  remainingMin: number // estimated work still to do today, in minutes (0 if none)
  hasWork: boolean // whether there's still-to-do work to pace against
}) {
  const today = todayStr()
  const hour12 = useHour12()
  const [map, setMap] = useState<Record<string, number>>(() =>
    typeof window === 'undefined' ? {} : loadDayTarget()
  )
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const target = map[today] // minutes since midnight, or undefined

  // Close the picker on an outside click or Escape, the way the app's other
  // menus behave.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const set = (min: number | null) => setMap(prev => setDayTarget(prev, today, min))

  // Nothing to offer: no wrap-up time set and no work to pace against. Stay out
  // of the way entirely rather than nag on an empty day.
  if (target === undefined && !hasWork) return null

  // The pacing read, once a time is set: how the still-to-do plan sits against
  // the wrap-up hour. Slack (time left minus estimated work) is the useful
  // number when there are estimates; otherwise just the time left is shown.
  let clause: { text: string; tone: string } | null = null
  if (target !== undefined) {
    const left = target - nowMin
    if (left <= 0) {
      clause = { text: 'time’s up', tone: 'text-rose-600 dark:text-rose-400' }
    } else if (remainingMin > 0) {
      const slack = left - remainingMin
      if (slack > 0) clause = { text: `${formatDuration(slack)} to spare`, tone: 'text-emerald-600 dark:text-emerald-400' }
      else if (slack === 0) clause = { text: 'just fits', tone: 'text-emerald-600 dark:text-emerald-400' }
      else clause = { text: `${formatDuration(-slack)} over`, tone: 'text-amber-600 dark:text-amber-500' }
    } else {
      clause = { text: `${formatDuration(left)} left`, tone: 'text-zinc-500 dark:text-zinc-300' }
    }
  }

  const picker = open && (
    <div className="absolute left-0 top-full z-20 mt-1.5 w-56 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 shadow-lg shadow-zinc-900/10 dark:shadow-black/40">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Wrap up by
      </p>
      <input
        type="time"
        value={toTimeInput(target ?? DEFAULT_TARGET)}
        onChange={e => {
          const v = fromTimeInput(e.target.value)
          if (v != null) set(v)
        }}
        aria-label="Wrap-up time"
        className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-1.5 text-sm tabular-nums text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600 dark:[color-scheme:dark]"
      />
      <div className="mt-2 flex flex-wrap gap-1">
        {PRESETS.map(min => (
          <button
            key={min}
            type="button"
            onClick={() => set(min)}
            aria-pressed={target === min}
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums transition-colors ${
              target === min
                ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-500 hover:text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            {formatTime(min, hour12)}
          </button>
        ))}
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2">
        {target !== undefined ? (
          <button
            type="button"
            onClick={() => { set(null); setOpen(false) }}
            className="text-xs text-zinc-400 transition-colors hover:text-rose-500 dark:hover:text-rose-400"
          >
            Clear
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          Done
        </button>
      </div>
    </div>
  )

  // No time set yet — a quiet prompt, shown only when there's work to pace.
  if (target === undefined) {
    return (
      <div ref={wrapRef} className="relative px-1">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <SunsetIcon className="h-3.5 w-3.5 flex-shrink-0" />
          Set a wrap-up time
        </button>
        {picker}
      </div>
    )
  }

  // A time is set — show it with the live pacing read.
  return (
    <div ref={wrapRef} className="relative px-1">
      <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-zinc-400">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          title="Change your wrap-up time"
          className="inline-flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-300 dark:hover:text-white"
        >
          <SunsetIcon className="h-3.5 w-3.5 flex-shrink-0 text-zinc-400" />
          <span className="tabular-nums">
            Wrap up by <span className="font-medium">{formatTime(target, hour12)}</span>
          </span>
        </button>
        {clause && (
          <span className={`tabular-nums ${clause.tone}`}>· {clause.text}</span>
        )}
      </p>
      {picker}
    </div>
  )
}
