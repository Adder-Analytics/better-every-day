'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { formatFocus } from '@/lib/focuslog'

// A focus session timer for the one task in Focus mode — a quiet way to work in
// a block of time instead of an open-ended stretch. It counts down, shows the
// time left in a ring, and settles into "Time's up" when the block ends.
//
// The countdown itself lives only in memory (it resets when the focused task
// changes and starts fresh on reload), but the time actually spent running is
// reported to the caller via `onElapsed`, which persists it as the day's focus
// record — so the block you worked reads back against the task's estimate later.

// Common block lengths, in minutes. A task's own estimate joins these when it's
// set, so the timer defaults to how long you thought the task would take.
const PRESETS = [15, 25, 50]
const DEFAULT_MIN = 25

// mm:ss from a whole number of seconds. Minutes aren't capped at 60 — a 90-minute
// block reads "90:00" — since a focus block is a duration, not a clock time.
function mmss(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// A ring that empties as the block runs down. SVG so the arc animates smoothly
// and stays crisp at any size; the countdown sits in the middle.
function Ring({ fraction, children, done }: { fraction: number; children: React.ReactNode; done: boolean }) {
  const size = 176
  const stroke = 6
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-zinc-200 dark:stroke-zinc-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fraction)}
          className={`transition-[stroke-dashoffset] duration-500 ease-linear motion-reduce:transition-none ${
            done ? 'stroke-emerald-500' : 'stroke-zinc-900 dark:stroke-white'
          }`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

// The caller keys this by task id, so switching the focused task remounts it —
// a fresh session, seeded from the new task's estimate — with no reset effect.
// `focusedSec` seeds the running "focused today" total with what this task has
// already banked earlier in the day; `onElapsed` reports each span of time the
// timer spent running so the caller can persist it.
export default function FocusTimer({
  estimateMin,
  focusedSec = 0,
  onElapsed,
}: {
  estimateMin?: number
  focusedSec?: number
  onElapsed?: (deltaSec: number) => void
}) {
  // The block length in minutes, seeded from the task's estimate (clamped to a
  // sane range) or the default.
  const initialMin = estimateMin && estimateMin >= 1 && estimateMin <= 180 ? estimateMin : DEFAULT_MIN
  const [durationMin, setDurationMin] = useState(initialMin)
  const [remaining, setRemaining] = useState(initialMin * 60)
  const [running, setRunning] = useState(false)
  // The wall-clock moment the block should end, so a backgrounded tab catches up
  // on return instead of drifting by the missed ticks.
  const endRef = useRef<number | null>(null)

  // Time actually spent running this task, in seconds. `accumSec` banks the
  // finished spans (seeded from what the day already holds for this task);
  // `spanSec` is the live length of the span in progress, shown while running.
  const [accumSec, setAccumSec] = useState(focusedSec)
  const [spanSec, setSpanSec] = useState(0)
  // The moment the current running span began, so its length is wall-clock true
  // through a backgrounded tab, and can be flushed when the span ends.
  const runStartRef = useRef<number | null>(null)
  const onElapsedRef = useRef(onElapsed)
  useEffect(() => {
    onElapsedRef.current = onElapsed
  })

  useEffect(() => {
    if (!running) return
    runStartRef.current = Date.now()
    const tick = () => {
      if (runStartRef.current != null) setSpanSec(Math.round((Date.now() - runStartRef.current) / 1000))
      if (endRef.current == null) return
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) {
        setRunning(false)
        endRef.current = null
        // A best-effort nudge if the tab is in the background — only when the
        // browser has already granted permission, so this never prompts.
        try {
          if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Focus block done', { body: 'Time to take a break or start another.' })
          }
        } catch {}
      }
    }
    const id = setInterval(tick, 250)
    tick()
    // Ending the span — a pause, the block finishing, a switch of task, or
    // leaving focus — banks the time it ran and reports it once. Counting actual
    // running time means a reset mid-block still credits the work already done.
    return () => {
      clearInterval(id)
      if (runStartRef.current != null) {
        const delta = Math.round((Date.now() - runStartRef.current) / 1000)
        runStartRef.current = null
        setSpanSec(0)
        if (delta > 0) {
          setAccumSec(a => a + delta)
          onElapsedRef.current?.(delta)
        }
      }
    }
  }, [running])

  // What the "focused today" line reads: the banked spans plus the one in flight.
  const focusedTotal = accumSec + (running ? spanSec : 0)

  const total = durationMin * 60
  const done = remaining === 0
  const idle = !running && remaining === total
  const fraction = total > 0 ? remaining / total : 0

  const start = useCallback(() => {
    if (remaining <= 0) return
    endRef.current = Date.now() + remaining * 1000
    setRunning(true)
  }, [remaining])

  const pause = useCallback(() => {
    setRunning(false)
    endRef.current = null
  }, [])

  const reset = useCallback(() => {
    setRunning(false)
    endRef.current = null
    setRemaining(durationMin * 60)
  }, [durationMin])

  const pick = useCallback((min: number) => {
    setRunning(false)
    endRef.current = null
    setDurationMin(min)
    setRemaining(min * 60)
  }, [])

  // Presets plus the task's own estimate (when it's set and not already listed),
  // sorted so the row reads low-to-high.
  const options = [...new Set([...PRESETS, ...(estimateMin && estimateMin >= 1 && estimateMin <= 180 ? [estimateMin] : [])])].sort(
    (a, b) => a - b
  )

  return (
    <div className="mt-8 flex flex-col items-center gap-5 border-t border-zinc-100 dark:border-zinc-800 pt-8">
      <Ring fraction={done ? 1 : fraction} done={done}>
        <span className="text-3xl font-semibold tabular-nums text-zinc-900 dark:text-white">{mmss(remaining)}</span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
          {done ? 'Time’s up' : running ? 'Focusing' : idle ? 'Focus block' : 'Paused'}
        </span>
      </Ring>

      {/* Duration presets — only while idle, so changing the block never yanks a
          running or paused timer out from under you. */}
      {idle && (
        <div className="inline-flex rounded-full bg-zinc-100 dark:bg-zinc-800/80 p-0.5 text-xs font-medium">
          {options.map(min => (
            <button
              key={min}
              type="button"
              onClick={() => pick(min)}
              aria-pressed={min === durationMin}
              className={`rounded-full px-3 py-1 tabular-nums transition-colors ${
                min === durationMin
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              {min}m
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={done ? reset : running ? pause : start}
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 dark:bg-white px-5 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors"
        >
          {done ? (
            <>
              <ResetIcon className="h-4 w-4" />
              Start again
            </>
          ) : running ? (
            <>
              <PauseIcon className="h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <PlayIcon className="h-4 w-4" />
              {idle ? 'Start' : 'Resume'}
            </>
          )}
        </button>
        {!idle && !done && (
          <button
            type="button"
            onClick={reset}
            title="Reset the timer"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
          >
            <ResetIcon className="h-4 w-4" />
            Reset
          </button>
        )}
      </div>

      {/* A quiet running tally of the time actually spent on this task today —
          the counterpart to its estimate, and what the day's focus record keeps.
          Shown once at least a few seconds have been worked. */}
      {focusedTotal >= 5 && (
        <p className="flex items-center gap-1.5 text-xs text-zinc-400 tabular-nums">
          <ClockIcon className="h-3.5 w-3.5" />
          <span>
            <span className="font-medium text-zinc-500 dark:text-zinc-300">{formatFocus(focusedTotal)}</span> focused today
            {estimateMin ? <span className="text-zinc-400"> · {formatFocus(estimateMin * 60)} planned</span> : null}
          </span>
        </p>
      )}
    </div>
  )
}

// Heroicons "clock" — the focus tally, matching the estimate clock used elsewhere.
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// Heroicons (solid play/pause, outline arrow-path), sized for the control row.
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
    </svg>
  )
}
function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
    </svg>
  )
}
function ResetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356M2.985 19.644v-4.992h4.992m-4.681-2.72a7.5 7.5 0 0112.548-3.364l3.18 3.182m0 0V9.349m0 2.401a7.5 7.5 0 01-12.548 3.364l-3.18-3.182" />
    </svg>
  )
}
