'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

// One entry in the command palette. `run` is invoked after the palette closes.
// `keywords` add extra searchable terms; `hint` shows a quiet label on the
// right (a shortcut, or "Active" for the current choice).
export type Command = {
  id: string
  label: string
  icon: React.ReactNode
  run: () => void
  hint?: string
  keywords?: string
}

// A task the palette can surface as a search result. `context` is a quiet
// label for where the task lives (a day, "Someday", a routine cadence); `done`
// styles finished tasks; `run` reveals the task (invoked after the palette
// closes). Only shown once there's a query — an empty palette lists commands.
export type TaskResult = {
  id: string
  text: string
  context: string
  done: boolean
  run: () => void
}

// How many task matches the palette shows at once, so a broad query can't bury
// the commands. Any overflow is noted in the group header rather than hidden.
const TASK_LIMIT = 8

// Any element can open the palette without a prop path by dispatching this on
// the window. The add-box opener uses it.
export const OPEN_COMMAND_PALETTE = 'bed:open-command-palette'

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE))
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.35-5.4a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z" />
    </svg>
  )
}

// The status glyph on a task result: a filled emerald check when done, an empty
// circle when still to do — the same read as a task row's own checkbox.
function TaskStatusIcon({ done, className }: { done: boolean; className?: string }) {
  return done ? (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12.5l2.5 2.5 4.5-5" stroke="white" />
    </svg>
  ) : (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="8.5" />
    </svg>
  )
}

// A quiet, non-interactive group label between the Commands and Tasks sections.
function GroupHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
      {children}
    </p>
  )
}

// A quiet fast-access menu for the app's actions and pages. Opened with
// Cmd/Ctrl+K (or the "Commands" button), filtered as you type, driven entirely
// by the keyboard — arrows to move, Enter to run, Esc to close. Every command
// it offers is also reachable in the normal UI, so it's an accelerator, never
// the only way to do something.
export default function CommandPalette({ commands, tasks = [] }: { commands: Command[]; tasks?: TaskResult[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  // Mirrors `open` synchronously so the global key handler can toggle without a
  // stale closure and without depending on `open` (which would re-bind it).
  const openRef = useRef(open)

  const show = useCallback(() => {
    setQuery('')
    setActive(0)
    setOpen(true)
  }, [])

  const hide = useCallback(() => setOpen(false), [])

  // Mirror `open` into the ref after each commit, so the global Cmd/Ctrl+K
  // handler can read the latest value synchronously while `show`/`hide` stay
  // free of ref writes (and safe to call from click handlers).
  useEffect(() => {
    openRef.current = open
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K toggles the palette from anywhere, including inside inputs.
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (openRef.current) hide()
        else show()
      }
    }
    document.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_COMMAND_PALETTE, show)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_COMMAND_PALETTE, show)
    }
  }, [show, hide])

  const q = query.trim().toLowerCase()
  const matchedCommands = useMemo(() => {
    if (!q) return commands
    return commands.filter(c => `${c.label} ${c.keywords ?? ''}`.toLowerCase().includes(q))
  }, [commands, q])
  // Tasks only join in once there's a query, so an empty palette stays a clean
  // list of actions. Text and context are both searchable ("laundry", "someday").
  const matchedTasks = useMemo(() => {
    if (!q) return []
    return tasks.filter(t => `${t.text} ${t.context}`.toLowerCase().includes(q))
  }, [tasks, q])
  const shownTasks = matchedTasks.slice(0, TASK_LIMIT)

  // One flat, ordered list the keyboard moves through — commands first, then
  // task results — with headers rendered between the two groups only when both
  // are present. Cheap to rebuild each render (both lists are short).
  const rows: ({ kind: 'command'; cmd: Command } | { kind: 'task'; task: TaskResult })[] = [
    ...matchedCommands.map(cmd => ({ kind: 'command' as const, cmd })),
    ...shownTasks.map(task => ({ kind: 'task' as const, task })),
  ]

  // The highlight, always kept within the current results without storing a
  // clamped copy (arrow keys wrap; typing resets to 0).
  const activeIndex = rows.length ? Math.min(active, rows.length - 1) : 0

  // Focus the field when it opens — a DOM effect, no state changes here.
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  // Keep the highlighted row scrolled into view as the selection moves.
  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[18vh] sm:pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command menu"
    >
      <button
        aria-hidden="true"
        tabIndex={-1}
        onClick={hide}
        className="absolute inset-0 cursor-default bg-zinc-900/25 dark:bg-black/50 backdrop-blur-[2px]"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl shadow-zinc-900/20 dark:shadow-black/50 animate-[palette-in_120ms_ease-out]">
        <div className="flex items-center gap-2.5 border-b border-zinc-100 dark:border-zinc-800 px-4">
          <SearchIcon className="h-4 w-4 flex-shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive(a => (rows.length ? (Math.min(a, rows.length - 1) + 1) % rows.length : 0))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive(a => (rows.length ? (Math.min(a, rows.length - 1) - 1 + rows.length) % rows.length : 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                const row = rows[activeIndex]
                if (row) {
                  hide()
                  if (row.kind === 'command') row.cmd.run()
                  else row.task.run()
                }
              } else if (e.key === 'Escape') {
                e.preventDefault()
                hide()
              }
            }}
            placeholder="Search tasks or run a command…"
            aria-label="Search tasks and commands"
            className="flex-1 bg-transparent py-3.5 text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
          />
          <kbd className="flex-shrink-0 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-72 overflow-y-auto p-1.5">
          {rows.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-zinc-400">
              {q ? 'No matches' : 'No commands'}
            </p>
          ) : (
            rows.map((row, i) => {
              const isActive = i === activeIndex
              const rowClass = `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                isActive ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-300'
              }`
              return (
                <div key={row.kind === 'command' ? row.cmd.id : `task-${row.task.id}`}>
                  {/* Headers sit between the two groups, and only when both show. */}
                  {i === 0 && matchedCommands.length > 0 && shownTasks.length > 0 && (
                    <GroupHeader>Commands</GroupHeader>
                  )}
                  {i === matchedCommands.length && shownTasks.length > 0 && (
                    <GroupHeader>
                      Tasks
                      {matchedTasks.length > shownTasks.length && (
                        <span className="ml-1 font-normal normal-case tracking-normal text-zinc-300 dark:text-zinc-600">
                          · showing {shownTasks.length} of {matchedTasks.length}
                        </span>
                      )}
                    </GroupHeader>
                  )}
                  {row.kind === 'command' ? (
                    <button
                      role="option"
                      aria-selected={isActive}
                      data-active={isActive}
                      onMouseMove={() => setActive(i)}
                      onClick={() => { hide(); row.cmd.run() }}
                      className={rowClass}
                    >
                      <span className={`flex-shrink-0 ${isActive ? 'text-zinc-500 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-500'}`}>
                        {row.cmd.icon}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{row.cmd.label}</span>
                      {row.cmd.hint && (
                        <span className="flex-shrink-0 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">{row.cmd.hint}</span>
                      )}
                    </button>
                  ) : (
                    <button
                      role="option"
                      aria-selected={isActive}
                      data-active={isActive}
                      onMouseMove={() => setActive(i)}
                      onClick={() => { hide(); row.task.run() }}
                      className={rowClass}
                    >
                      <TaskStatusIcon
                        done={row.task.done}
                        className={`h-4 w-4 flex-shrink-0 ${
                          row.task.done ? 'text-emerald-500' : isActive ? 'text-zinc-400 dark:text-zinc-400' : 'text-zinc-300 dark:text-zinc-600'
                        }`}
                      />
                      <span className={`min-w-0 flex-1 truncate ${row.task.done ? 'text-zinc-400 line-through dark:text-zinc-500' : ''}`}>
                        {row.task.text}
                      </span>
                      <span className="flex-shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {row.task.context}
                      </span>
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
