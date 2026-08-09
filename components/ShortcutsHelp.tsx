'use client'

import { useState, useEffect, useCallback } from 'react'

// The app is heavily keyboard-driven — add, navigate, complete, delete, undo,
// and the command menu all have keys — but nothing surfaced them. This is the
// reference: press ? to open it, Esc or a click outside to close. It's opened
// the same two ways everywhere, so touch users reach it from the command menu
// (which dispatches the event below) rather than a key they can't press.
export const OPEN_SHORTCUTS_HELP = 'bed:open-shortcuts'

export function openShortcutsHelp() {
  window.dispatchEvent(new Event(OPEN_SHORTCUTS_HELP))
}

// A single key, rendered as a keycap. Matches the small <kbd> used on the
// command-menu opener elsewhere so the whole app's key hints read alike.
function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-1 font-mono text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
      {children}
    </kbd>
  )
}

// One row: the keys on the left, what they do on the right. `keys` is a list so
// alternatives ("j / k") and combos ("Cmd K") render as separate caps with a
// quiet joiner between them.
function Row({ keys, joiner = '', children }: { keys: string[]; joiner?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-1 py-2">
      <span className="text-sm text-zinc-600 dark:text-zinc-300">{children}</span>
      <span className="flex flex-shrink-0 items-center gap-1">
        {keys.map((k, i) => (
          <span key={k + i} className="flex items-center gap-1">
            {i > 0 && <span className="text-[11px] text-zinc-400">{joiner}</span>}
            <Key>{k}</Key>
          </span>
        ))}
      </span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-1 pb-0.5 pt-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {title}
      </p>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">{children}</div>
    </div>
  )
}

export default function ShortcutsHelp() {
  const [open, setOpen] = useState(false)
  // Ctrl on Windows/Linux, the command symbol on Apple. The panel only ever
  // opens client-side (it starts closed and renders null on the server), so
  // reading navigator here can never mismatch server HTML.
  const [mod] = useState(() =>
    typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)
      ? '⌘'
      : 'Ctrl'
  )

  const hide = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const show = () => setOpen(true)
    const onKey = (e: KeyboardEvent) => {
      // "?" (Shift+/) opens the panel from anywhere it isn't a typed character —
      // so an input, a textarea, or an editable field keeps the literal "?".
      const el = e.target as HTMLElement
      const typing = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
      if (!typing && e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setOpen(o => !o)
      } else if (e.key === 'Escape' && open) {
        e.preventDefault()
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_SHORTCUTS_HELP, show)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_SHORTCUTS_HELP, show)
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[14vh] sm:pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <button
        aria-hidden="true"
        tabIndex={-1}
        onClick={hide}
        className="absolute inset-0 cursor-default bg-zinc-900/25 dark:bg-black/50 backdrop-blur-[2px]"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl shadow-zinc-900/20 dark:shadow-black/50 animate-[palette-in_120ms_ease-out]">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Keyboard shortcuts</h2>
          <button
            onClick={hide}
            aria-label="Close"
            className="flex items-center rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-3 pb-3">
          <Section title="Getting around">
            <Row keys={[mod, 'K']} joiner="+">Command menu</Row>
            <Row keys={['n']}>Add a task</Row>
            <Row keys={['?']}>This help</Row>
            <Row keys={['Esc']}>Close, exit focus, or clear a filter</Row>
          </Section>

          <Section title="Today’s list">
            <Row keys={['j', 'k']} joiner="/">Move the selection</Row>
            <Row keys={['⇧J', '⇧K']} joiner="/">Move the selected task</Row>
            <Row keys={['Space']}>Complete the selected task</Row>
            <Row keys={['Bksp']}>Delete the selected task</Row>
          </Section>

          <Section title="Editing">
            <Row keys={['Double-click']}>Edit a task in place</Row>
            <Row keys={[mod, 'Z']} joiner="+">Undo a delete</Row>
          </Section>
        </div>
      </div>
    </div>
  )
}
