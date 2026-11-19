'use client'

import { useRef } from 'react'

function Icon({ d, className = 'h-5 w-5' }: { d: string; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

// Heroicons paths: check-circle, arrow-uturn-left, arrow-right-circle,
// calendar, archive-box, trash, x-mark.
const CHECK = 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
const UNCHECK = 'M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3'
const TOMORROW = 'M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
const CALENDAR = 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5'
const SOMEDAY = 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z'
const TRASH = 'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'
const CLOSE = 'M6 18L18 6M6 6l12 12'

function Action({ label, note, d, run, disabled, title, danger }: {
  label: string
  note?: string
  d: string
  run: () => void
  disabled: boolean
  title?: string
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={run}
      disabled={disabled}
      title={title ?? label}
      className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-35 sm:flex-row sm:justify-center sm:gap-1.5 sm:px-2.5 sm:text-xs ${
        danger
          ? 'text-red-300 hover:bg-white/10 dark:text-red-600 dark:hover:bg-zinc-900/10'
          : 'text-white hover:bg-white/10 dark:text-zinc-900 dark:hover:bg-zinc-900/10'
      }`}
    >
      <Icon d={d} className="h-5 w-5 flex-shrink-0 sm:h-4 sm:w-4" />
      <span className="max-w-full truncate">
        {label}
        {note && <span className="hidden opacity-60 sm:inline"> {note}</span>}
      </span>
    </button>
  )
}

// The action bar for selection mode: how many tasks are picked, a way to pick
// every visible one, and the actions that apply to all of them at once. Fixed
// to the bottom edge (safe-area aware) so it stays in reach on a long list.
// Moving a task to another day or to Someday applies to one-off tasks only —
// routines keep their own schedule — so those buttons say how many they'll
// move when the selection mixes both.
export default function SelectionBar({
  count,
  visible,
  movable,
  allDone,
  minDate,
  onSelectAll,
  onClearAll,
  onDone,
  onTomorrow,
  onPickDate,
  onSomeday,
  onDelete,
  onClose,
}: {
  count: number
  visible: number
  movable: number
  allDone: boolean
  minDate: string
  onSelectAll: () => void
  onClearAll: () => void
  onDone: () => void
  onTomorrow: () => void
  onPickDate: (date: string) => void
  onSomeday: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const dateRef = useRef<HTMLInputElement>(null)
  const none = count === 0
  const noMove = movable === 0
  const partial = !noMove && movable < count
  const moveNote = partial ? `(${movable})` : undefined
  const allPicked = visible > 0 && count === visible
  const routineNote = noMove && !none ? 'Routines keep their own schedule' : undefined
  const openPicker = () => {
    const el = dateRef.current
    if (!el) return
    try { el.showPicker() } catch { el.focus(); el.click() }
  }

  return (
    <div className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-4">
      <div
        role="toolbar"
        aria-label="Selected tasks"
        className="w-full max-w-2xl rounded-2xl bg-zinc-900 p-1.5 shadow-xl shadow-zinc-900/25 animate-[toast-in_150ms_ease-out] dark:bg-white dark:shadow-black/40"
      >
        <div className="flex items-center gap-2 px-2 pb-1 pt-0.5">
          <p role="status" className="min-w-0 flex-1 truncate text-xs text-zinc-400 dark:text-zinc-500">
            <span className="font-semibold tabular-nums text-white dark:text-zinc-900">{count}</span> selected
            {none && <span> · tap tasks to pick them</span>}
          </p>
          {visible > 0 && (
            <button
              type="button"
              onClick={allPicked ? onClearAll : onSelectAll}
              className="flex-shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white dark:text-zinc-600 dark:hover:bg-zinc-900/10 dark:hover:text-zinc-900"
            >
              {allPicked ? 'Clear' : `Select all ${visible}`}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Done selecting"
            title="Done selecting (Esc)"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/10 hover:text-white dark:text-zinc-500 dark:hover:bg-zinc-900/10 dark:hover:text-zinc-900"
          >
            <Icon d={CLOSE} className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-stretch gap-0.5 border-t border-white/10 pt-1 dark:border-zinc-900/10">
          {allDone && !none
            ? <Action label="Not done" d={UNCHECK} run={onDone} disabled={none} title="Mark the selected tasks not done" />
            : <Action label="Done" d={CHECK} run={onDone} disabled={none} title="Check off the selected tasks" />}
          <Action label="Tomorrow" note={moveNote} d={TOMORROW} run={onTomorrow} disabled={none || noMove} title={routineNote ?? 'Move to tomorrow'} />
          <div className="relative flex min-w-0 flex-1">
            <Action label="Pick day" note={moveNote} d={CALENDAR} run={openPicker} disabled={none || noMove} title={routineNote ?? 'Move to a day'} />
            <input
              ref={dateRef}
              type="date"
              tabIndex={-1}
              aria-hidden="true"
              min={minDate}
              value=""
              onChange={e => { if (e.target.value) onPickDate(e.target.value) }}
              className="pointer-events-none absolute inset-x-0 bottom-0 h-0 w-full opacity-0"
            />
          </div>
          <Action label="Someday" note={moveNote} d={SOMEDAY} run={onSomeday} disabled={none || noMove} title={routineNote ?? 'Move to Someday'} />
          <Action label="Delete" d={TRASH} run={onDelete} disabled={none} title="Delete the selected tasks" danger />
        </div>
      </div>
    </div>
  )
}
