'use client'

import { useEffect, useRef, useState } from 'react'
import { todayStr } from '@/lib/planner'
import { loadDayFocus, setDayFocus } from '@/lib/dayfocus'

// A small pennant — plant the one thing you're aiming at today.
function FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21V4m0 0h11l-1.75 3.5L15 11H4" />
    </svg>
  )
}

const MAX_LEN = 120

// The day's focus — one line, pinned at the top, set in the morning and glanced
// at all day. The forward-looking counterpart to the day note (which catches
// what a day leaves behind once it's over). Rendered only inside the planner's
// post-mount tree, so reading localStorage in the initial state is safe. Editing
// mirrors the task and day-note editors: saves on blur, Enter saves, Esc
// cancels. The always-visible buttons keep it usable by touch, where hover and
// double-click don't exist.
export default function DayFocus() {
  const today = todayStr()
  const [map, setMap] = useState<Record<string, string>>(() =>
    typeof window === 'undefined' ? {} : loadDayFocus()
  )
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  const focus = map[today] ?? ''

  useEffect(() => {
    if (editing) {
      const el = ref.current
      el?.focus()
      el?.setSelectionRange(el.value.length, el.value.length)
    }
  }, [editing])

  const start = () => {
    setDraft(focus)
    setEditing(true)
  }
  const save = () => {
    setMap(prev => setDayFocus(prev, today, draft))
    setEditing(false)
  }
  const cancel = () => {
    setDraft(focus)
    setEditing(false)
  }
  const clear = () => {
    setMap(prev => setDayFocus(prev, today, ''))
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2">
        <FlagIcon className="h-4 w-4 flex-shrink-0 text-zinc-400" />
        <input
          ref={ref}
          value={draft}
          onChange={e => setDraft(e.target.value.slice(0, MAX_LEN))}
          onBlur={save}
          onKeyDown={e => {
            if (e.key === 'Escape') { e.preventDefault(); cancel() }
            if (e.key === 'Enter') { e.preventDefault(); save() }
          }}
          maxLength={MAX_LEN}
          placeholder="The one thing to get done today…"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
        />
      </div>
    )
  }

  if (focus) {
    return (
      <div className="group flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2">
        <FlagIcon className="h-4 w-4 flex-shrink-0 text-zinc-400 dark:text-zinc-500" />
        <button
          type="button"
          onClick={start}
          title="Edit today’s focus"
          className="min-w-0 flex-1 truncate text-left text-sm font-medium text-zinc-800 dark:text-zinc-100"
        >
          {focus}
        </button>
        <button
          type="button"
          onClick={start}
          className="flex-shrink-0 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={clear}
          title="Clear today’s focus"
          className="flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="sr-only">Clear focus</span>
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={start}
      className="flex w-full items-center gap-2 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 px-3 py-2 text-left text-sm text-zinc-400 hover:border-zinc-300 hover:text-zinc-500 dark:hover:border-zinc-700 dark:hover:text-zinc-400 transition-colors"
    >
      <FlagIcon className="h-4 w-4 flex-shrink-0" />
      Set today’s focus
    </button>
  )
}
