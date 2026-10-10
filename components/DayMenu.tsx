'use client'

import { useRef, useState } from 'react'

export type DayMenuItem = {
  id: string
  label: string
  icon: React.ReactNode
  run: () => void
  // Set on a toggle: the item reads as a checkbox and shows its On/Off state.
  checked?: boolean
}

// Heroicons "ellipsis-horizontal" — opens the menu.
function EllipsisIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
  )
}

// The day header's less frequent actions (copy, print, add to a calendar,
// reminders), gathered behind one button and named in full. One target that
// works the same by mouse, touch, or keyboard, in place of a row of small icons
// that only explained themselves on hover. Arrow keys move between items;
// Escape or Tab closes and hands focus back to the button.
export default function DayMenu({ items }: { items: DayMenuItem[] }) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const close = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(o => !o)}
        aria-label="More for today"
        aria-haspopup="menu"
        aria-expanded={open}
        title="More for today"
        className={`-mr-1.5 flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          open
            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
        }`}
      >
        <EllipsisIcon className="h-5 w-5" />
      </button>
      {open && (
        <>
          {/* Click-away backdrop, behind the menu but above the page. */}
          <button
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default"
          />
          <div
            role="menu"
            aria-label="More for today"
            ref={el => { el?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus() }}
            onKeyDown={e => {
              const els = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role^="menuitem"]'))
              const at = els.indexOf(document.activeElement as HTMLElement)
              if (e.key === 'Escape' || e.key === 'Tab') {
                e.preventDefault()
                e.stopPropagation()
                close()
              } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault()
                e.stopPropagation()
                const step = e.key === 'ArrowDown' ? 1 : -1
                els[(at + step + els.length) % els.length]?.focus()
              }
            }}
            className="absolute right-0 top-full z-30 mt-1 w-60 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 shadow-lg shadow-zinc-900/5 dark:shadow-black/30"
          >
            {items.map(item => (
              <button
                key={item.id}
                role={item.checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
                aria-checked={item.checked}
                onClick={() => {
                  close()
                  item.run()
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-zinc-700 dark:text-zinc-200 outline-none transition-colors hover:bg-zinc-100 focus-visible:bg-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800"
              >
                <span className={item.checked ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}>{item.icon}</span>
                <span className="min-w-0 flex-1">{item.label}</span>
                {item.checked !== undefined && (
                  <span className={`text-[11px] font-medium ${item.checked ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {item.checked ? 'On' : 'Off'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
