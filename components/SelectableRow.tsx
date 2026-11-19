'use client'

import { stripTags } from '@/lib/tags'

// A task row that can be picked out for a bulk action. Outside selection mode
// it is a plain wrapper and the row works exactly as usual. In selection mode
// the row underneath goes inert — no check-off, swipe, drag, or menus — and a
// single full-row button on top toggles whether it's picked, so a tap
// anywhere on the row selects it, by mouse, touch, or keyboard alike.
export default function SelectableRow({
  active,
  selected,
  text,
  onToggle,
  children,
}: {
  active: boolean
  selected: boolean
  text: string
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <div inert={active}>{children}</div>
      {active && (
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          aria-label={`Select “${stripTags(text)}”`}
          onClick={onToggle}
          className={`absolute inset-0 z-10 rounded-2xl outline-none transition-[box-shadow,background-color] focus-visible:ring-2 focus-visible:ring-zinc-500 ${
            selected ? 'ring-2 ring-zinc-900 dark:ring-zinc-200' : ''
          }`}
        >
          {/* The pick box, sitting over the row's trailing controls (which are
              inert here anyway) on a fade to the card color so they don't show
              through. */}
          <span className="absolute inset-y-px right-px flex items-center rounded-r-2xl bg-gradient-to-l from-white from-55% to-transparent pl-12 pr-4 dark:from-zinc-900">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                selected
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                  : 'border-zinc-300 text-transparent dark:border-zinc-600'
              }`}
            >
              <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
