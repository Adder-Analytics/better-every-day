'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { type Task, formatDate, formatTime, formatTimeRange, formatDuration, formatPastDayLabel } from '@/lib/planner'
import { stripTags, extractTags } from '@/lib/tags'
import { loadDayFocus } from '@/lib/dayfocus'
import { loadDayNotes } from '@/lib/daynotes'

// A clean, paper-friendly rendering of today's plan, printed with the browser's
// own print (window.print()). It completes the "take your day elsewhere" set
// alongside Copy plan and the calendar export: a printed sheet to pin to a
// wall, slip in a notebook, or cross off by hand.
//
// The sheet is portalled to <body> so it's a sibling of the app rather than
// nested inside it. On screen it's display:none; the print stylesheet in
// globals.css hides every other body child and reveals only this one, so what
// prints is just the sheet — no app chrome, no dark background, no blank pages
// from the (hidden) app laid out behind it.

// True only after hydration, so this localStorage-backed sheet never renders
// (and never reads storage) during SSR or the first client render.
const emptySubscribe = () => () => {}
function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

type Props = {
  today: string // YYYY-MM-DD, to read the day's focus and note
  active: Task[] // today's still-to-do tasks, in display order
  done: Task[] // today's finished tasks
  carryovers: Task[] // unfinished one-offs from earlier days
}

// One printed task line: a checkbox that survives black-and-white printing (a
// drawn box, a drawn check for done — no background fills, which browsers omit
// by default), the time or block leading, then the title with its tags and
// estimate. A note and any steps sit quietly beneath.
function PrintRow({ task }: { task: Task }) {
  const title = stripTags(task.text)
  const tags = extractTags(task.text)
  const timeLabel =
    task.timeMin != null
      ? task.estimateMin
        ? formatTimeRange(task.timeMin, task.estimateMin)
        : formatTime(task.timeMin)
      : null
  const steps = task.subtasks ?? []
  return (
    <li className="flex gap-2.5 break-inside-avoid py-[3px]">
      <span className="mt-[3px] flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-[3px] border border-neutral-500" aria-hidden="true">
        {task.done && (
          <svg className="h-3 w-3 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <div className="min-w-0">
        <p className={`text-[13px] leading-snug ${task.done ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>
          {timeLabel && <span className="font-medium tabular-nums">{timeLabel} · </span>}
          {task.priority && <span className="tabular-nums" aria-hidden="true">★ </span>}
          {title}
          {task.timeMin == null && task.estimateMin ? (
            <span className="text-neutral-500"> ({formatDuration(task.estimateMin)})</span>
          ) : null}
          {tags.map(t => (
            <span key={t} className="text-neutral-500"> #{t}</span>
          ))}
        </p>
        {task.note && (
          <p className="mt-0.5 whitespace-pre-wrap break-words text-[11px] leading-snug text-neutral-500">{task.note}</p>
        )}
        {steps.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {steps.map(s => (
              <li key={s.id} className="flex items-center gap-1.5 text-[11px] leading-snug text-neutral-500">
                <span className="flex h-2.5 w-2.5 flex-shrink-0 items-center justify-center rounded-[2px] border border-neutral-400" aria-hidden="true">
                  {s.done && (
                    <svg className="h-2 w-2 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className={s.done ? 'line-through' : ''}>{s.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}

function Section({ heading, tasks }: { heading: string; tasks: Task[] }) {
  if (tasks.length === 0) return null
  return (
    <section className="mt-5 break-inside-avoid">
      <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{heading}</h2>
      <ul>
        {tasks.map(t => (
          <PrintRow key={t.id} task={t} />
        ))}
      </ul>
    </section>
  )
}

export default function DayPrintSheet({ today, active, done, carryovers }: Props) {
  const hydrated = useHydrated()
  // The day's focus and note live under their own localStorage keys, edited
  // elsewhere on the page. Read them once (client-only, via the lazy
  // initializer) and refresh right before a print, so the sheet is never stale
  // against a focus set moments earlier.
  const [focus, setFocus] = useState(() =>
    typeof window === 'undefined' ? '' : loadDayFocus()[today] ?? ''
  )
  const [note, setNote] = useState(() =>
    typeof window === 'undefined' ? '' : loadDayNotes()[today] ?? ''
  )

  useEffect(() => {
    const refresh = () => {
      setFocus(loadDayFocus()[today] ?? '')
      setNote(loadDayNotes()[today] ?? '')
    }
    window.addEventListener('beforeprint', refresh)
    return () => window.removeEventListener('beforeprint', refresh)
  }, [today])

  if (!hydrated) return null

  const todayTasks = [...active, ...done]
  const carryoverLabel =
    carryovers.length > 0
      ? [...new Set(carryovers.map(t => formatPastDayLabel(t.createdDate)))].length === 1
        ? `Unfinished from ${formatPastDayLabel(carryovers[0].createdDate).toLowerCase()}`
        : 'Unfinished from earlier'
      : ''

  return createPortal(
    <div className="day-print-root hidden bg-white px-10 py-8 text-neutral-900">
      <header className="border-b border-neutral-200 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">Better Every Day</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">{formatDate()}</h1>
        {focus && (
          <p className="mt-2 text-[13px] text-neutral-600">
            <span className="font-semibold uppercase tracking-wider text-neutral-400">Focus </span>
            {focus}
          </p>
        )}
      </header>

      {todayTasks.length === 0 && carryovers.length === 0 && (
        <p className="mt-6 text-[13px] text-neutral-400">No tasks planned for today.</p>
      )}

      <Section heading="Today" tasks={todayTasks} />
      <Section heading={carryoverLabel} tasks={carryovers} />

      {/* Room to write — a printed plan is also a place to jot as the day runs. */}
      <section className="mt-6 break-inside-avoid">
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Notes</h2>
        {note && <p className="mb-2 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-neutral-700">{note}</p>}
        <div className="space-y-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="border-b border-neutral-200" />
          ))}
        </div>
      </section>

      <footer className="mt-8 border-t border-neutral-200 pt-2 text-[10px] text-neutral-400">
        Printed from Better Every Day · {today}
      </footer>
    </div>,
    document.body
  )
}
