'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { type Task, loadPlanner, todayStr, WEEKDAY_ABBR } from '@/lib/planner'
import {
  type WeekReview,
  weekStartOf,
  shiftDate,
  formatWeekRange,
  weekReview,
} from '@/lib/review'
import { loadWeekNotes, setWeekNote } from '@/lib/weeknotes'
import NoteText from '@/components/NoteText'

const emptySubscribe = () => () => {}

// True only after hydration, so this localStorage- and clock-backed view never
// mismatches the server HTML (the same guard the planner and routines view use).
function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

const WEEKDAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Chevrons for stepping between weeks.
function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}
// Up / down arrows for the week-over-week comparison.
function ArrowUp({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  )
}
function ArrowDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  )
}
function NoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7" />
    </svg>
  )
}

// One tile in the summary strip — a value over a quiet label, tabular so the row
// aligns, with a tooltip spelling the number out. Matches the History stats tile.
function Stat({ value, label, title }: { value: string; label: string; title: string }) {
  return (
    <div title={title} className="px-0.5 py-1">
      <p className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-white leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-zinc-400">{label}</p>
    </div>
  )
}

// A plain "up/down from last week" line. Compared through the same point in the
// week (see weekReview), so a week in progress reads against last week's same
// stretch rather than its full total.
function Comparison({ total, prevTotal }: { total: number; prevTotal: number }) {
  if (total === 0 && prevTotal === 0) return null
  const delta = total - prevTotal
  if (delta === 0) {
    return <span className="text-zinc-400">Same pace as last week</span>
  }
  const up = delta > 0
  const n = Math.abs(delta)
  return (
    <span className={`inline-flex items-center gap-1 ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
      {up ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
      <span className="tabular-nums">
        <span className="font-semibold">{n}</span> {up ? 'more' : 'fewer'} than last week
      </span>
    </span>
  )
}

// The seven-day bar strip for the selected week (Sun … Sat). Its own view of a
// single calendar week — the home page's strip is a rolling last-seven-days.
function WeekBars({ review, isCurrent, todayDate }: { review: WeekReview; isCurrent: boolean; todayDate: string }) {
  const max = Math.max(1, ...review.counts)
  return (
    <div className="flex justify-between gap-1.5 h-14">
      {review.dates.map((date, i) => {
        const count = review.counts[i]
        const future = date > todayDate
        const isToday = date === todayDate
        const heightPct = count === 0 ? 0 : Math.max((count / max) * 100, 14)
        return (
          <div key={date} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <div
              className="relative w-full flex-1"
              title={future ? `${WEEKDAY_FULL[i]} — still ahead` : `${count} task${count === 1 ? '' : 's'} on ${WEEKDAY_FULL[i]}`}
            >
              {count === 0 ? (
                <div className={`absolute bottom-0 w-full h-1 rounded-full ${future ? 'bg-zinc-100/70 dark:bg-zinc-800/60' : 'bg-zinc-100 dark:bg-zinc-800'}`} />
              ) : (
                <div
                  className={`absolute bottom-0 w-full rounded-md transition-all duration-500 ${
                    isCurrent && isToday ? 'bg-emerald-500' : 'bg-emerald-400/70 dark:bg-emerald-500/55'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              )}
            </div>
            <span className={`text-[10px] tabular-nums ${isCurrent && isToday ? 'text-zinc-600 dark:text-zinc-300 font-semibold' : 'text-zinc-400'}`}>
              {WEEKDAY_LETTER[i]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// A routine's adherence over the week: a small proportion bar and "5 of 7", with
// its current streak alongside for context on the week that's in progress.
function RoutineRow({ text, done, due, streak, showStreak }: { text: string; done: number; due: number; streak: number; showStreak: boolean }) {
  const pct = due === 0 ? 0 : Math.round((done / due) * 100)
  const full = done >= due
  return (
    <li className="flex items-center gap-3 py-1.5">
      <span className="min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-zinc-200">{text}</span>
      {showStreak && streak >= 2 && (
        <span title={`${streak} in a row`} className="hidden sm:inline-flex items-center gap-0.5 text-[11px] tabular-nums text-amber-600 dark:text-amber-500">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
          </svg>
          {streak}
        </span>
      )}
      <div className="h-1.5 w-16 flex-shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${full ? 'bg-emerald-500' : 'bg-emerald-400/70 dark:bg-emerald-500/60'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 flex-shrink-0 text-right text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
        {done} of {due}
      </span>
    </li>
  )
}

export default function ReviewView() {
  const hydrated = useHydrated()
  const today = todayStr()

  // Which week is shown, as an offset in weeks from the current one (0 = this
  // week, −1 = last week …). Stepping never goes past the current week.
  const [offset, setOffset] = useState(0)
  const weekStart = shiftDate(weekStartOf(today), offset * 7)
  const isCurrent = offset === 0

  // Loaded in the initializer (guarded for SSR), the way the planner and
  // routines views read localStorage — the render below is held behind
  // `hydrated`, so there's no server/client mismatch to worry about.
  const [tasks] = useState<Task[]>(() => (typeof window === 'undefined' ? [] : loadPlanner().tasks))
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    typeof window === 'undefined' ? {} : loadWeekNotes()
  )
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const noteRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (editing) {
      const el = noteRef.current
      el?.focus()
      el?.setSelectionRange(el.value.length, el.value.length)
    }
  }, [editing])

  // Step to another week, closing any open editor so it never strands on the
  // next week's note. `to` is clamped to the current week or earlier.
  const goToWeek = (next: number) => {
    setOffset(Math.min(0, next))
    setEditing(false)
  }

  if (!hydrated) {
    // A quiet placeholder that matches the loaded layout's rough height, so the
    // page doesn't jump when the client data arrives.
    return <div className="h-64 rounded-2xl border border-zinc-200 dark:border-zinc-800" aria-hidden="true" />
  }

  const review = weekReview(tasks, weekStart, today)
  const note = notes[weekStart] ?? ''

  const startEdit = () => { setDraft(note); setEditing(true) }
  const saveNote = () => { setNotes(prev => setWeekNote(prev, weekStart, draft)); setEditing(false) }
  const cancelNote = () => { setDraft(note); setEditing(false) }

  // Still-open one-off tasks that will carry into next week — the loose ends to
  // tie up. Only meaningful for the current week (a past week's "now" is gone).
  const openNow = isCurrent
    ? tasks.filter(t => !t.repeat && !t.someday && !t.done && t.createdDate <= today).length
    : 0

  const busy = review.busiestIndex != null ? WEEKDAY_ABBR[review.busiestIndex] : '—'
  const nothing = review.total === 0 && review.routines.length === 0

  return (
    <div className="space-y-3">
      {/* Week switcher */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => goToWeek(offset - 1)}
          aria-label="Previous week"
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums">
            {isCurrent ? 'This week' : offset === -1 ? 'Last week' : formatWeekRange(weekStart, today)}
          </p>
          {(isCurrent || offset === -1) && (
            <p className="text-[11px] text-zinc-400 tabular-nums">{formatWeekRange(weekStart, today)}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => goToWeek(offset + 1)}
          disabled={isCurrent}
          aria-label="Next week"
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {nothing ? (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-10 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Nothing recorded this week.</p>
          <p className="mt-1 text-xs text-zinc-400">
            {isCurrent ? 'Check a task off and it’ll show up here.' : 'No tasks were completed in this week.'}
          </p>
        </div>
      ) : (
        <>
          {/* Summary + week bars */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3">
            <div className="grid grid-cols-3 gap-x-2">
              <Stat
                value={String(review.total)}
                label={review.total === 1 ? 'task done' : 'tasks done'}
                title={`${review.total} task${review.total === 1 ? '' : 's'} completed this week`}
              />
              <Stat
                value={`${review.activeDays}/7`}
                label={review.activeDays === 1 ? 'active day' : 'active days'}
                title={`${review.activeDays} of the week's 7 days had at least one task completed`}
              />
              <Stat
                value={busy}
                label="busiest day"
                title={
                  review.busiestIndex != null
                    ? `${WEEKDAY_FULL[review.busiestIndex]} carried the most — ${review.busiestCount} task${review.busiestCount === 1 ? '' : 's'}`
                    : 'The day you completed the most tasks'
                }
              />
            </div>
            <div className="mt-2 border-t border-zinc-100 dark:border-zinc-800 pt-3 text-xs">
              <Comparison total={review.total} prevTotal={review.prevTotal} />
            </div>
            <div className="mt-3">
              <WeekBars review={review} isCurrent={isCurrent} todayDate={today} />
            </div>
          </div>

          {/* Routine adherence */}
          {review.routines.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3">
              <p className="mb-1 px-0.5 text-xs font-medium text-zinc-400">Routines this week</p>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {review.routines.map(r => (
                  <RoutineRow
                    key={r.id}
                    text={r.text}
                    done={r.doneCount}
                    due={r.dueCount}
                    streak={r.streak}
                    showStreak={isCurrent}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* Loose ends carrying forward — current week only */}
          {isCurrent && openNow > 0 && (
            <Link
              href="/"
              className="group flex items-center justify-between gap-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm text-zinc-700 dark:text-zinc-200">
                  <span className="font-semibold tabular-nums">{openNow}</span> still open
                </p>
                <p className="text-xs text-zinc-400">Loose ends that carry into next week</p>
              </div>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all" />
            </Link>
          )}
        </>
      )}

      {/* Reflection — the week's own note */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
            <NoteIcon className="w-3.5 h-3.5" />
            Reflection
          </p>
          {!editing && note && (
            <button
              type="button"
              onClick={startEdit}
              className="flex-shrink-0 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
        {editing ? (
          <textarea
            ref={noteRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={saveNote}
            onKeyDown={e => {
              if (e.key === 'Escape') { e.preventDefault(); cancelNote() }
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saveNote() }
            }}
            rows={3}
            placeholder="What went well, what to carry forward…"
            className="mt-2 w-full resize-none rounded-lg bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600"
          />
        ) : note ? (
          <NoteText
            text={note}
            onDoubleClick={startEdit}
            className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 cursor-text"
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="mt-1.5 w-full rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 px-3 py-2 text-left text-sm text-zinc-400 hover:border-zinc-300 hover:text-zinc-500 dark:hover:border-zinc-600 dark:hover:text-zinc-400 transition-colors"
          >
            {isCurrent ? 'Write a line about the week…' : 'Add a reflection for this week…'}
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 pt-1 text-xs">
        <Link href="/history" className="font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
          Day-by-day history
        </Link>
      </div>
    </div>
  )
}
