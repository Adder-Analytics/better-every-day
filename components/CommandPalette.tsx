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

// A quiet fast-access menu for the app's actions and pages. Opened with
// Cmd/Ctrl+K (or the "Commands" button), filtered as you type, driven entirely
// by the keyboard — arrows to move, Enter to run, Esc to close. Every command
// it offers is also reachable in the normal UI, so it's an accelerator, never
// the only way to do something.
export default function CommandPalette({ commands }: { commands: Command[] }) {
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
    openRef.current = true
    setOpen(true)
  }, [])

  const hide = useCallback(() => {
    openRef.current = false
    setOpen(false)
  }, [])

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter(c => `${c.label} ${c.keywords ?? ''}`.toLowerCase().includes(q))
  }, [commands, query])

  // The highlight, always kept within the current results without storing a
  // clamped copy (arrow keys wrap; typing resets to 0).
  const activeIndex = filtered.length ? Math.min(active, filtered.length - 1) : 0

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

  const run = (cmd: Command | undefined) => {
    if (!cmd) return
    hide()
    cmd.run()
  }

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
                setActive(a => (filtered.length ? (Math.min(a, filtered.length - 1) + 1) % filtered.length : 0))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive(a => (filtered.length ? (Math.min(a, filtered.length - 1) - 1 + filtered.length) % filtered.length : 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                run(filtered[activeIndex])
              } else if (e.key === 'Escape') {
                e.preventDefault()
                hide()
              }
            }}
            placeholder="Type a command…"
            aria-label="Search commands"
            className="flex-1 bg-transparent py-3.5 text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
          />
          <kbd className="flex-shrink-0 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-72 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-zinc-400">No commands found</p>
          ) : (
            filtered.map((cmd, i) => {
              const isActive = i === activeIndex
              return (
                <button
                  key={cmd.id}
                  role="option"
                  aria-selected={isActive}
                  data-active={isActive}
                  onMouseMove={() => setActive(i)}
                  onClick={() => run(cmd)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                      : 'text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-zinc-500 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {cmd.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{cmd.label}</span>
                  {cmd.hint && (
                    <span className="flex-shrink-0 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">{cmd.hint}</span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
