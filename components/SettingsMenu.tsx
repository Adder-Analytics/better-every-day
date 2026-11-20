'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { type Theme, applyTheme, themeStore } from '@/lib/theme'
import { type TimeFormat, timeFormatStore } from '@/lib/timeformat'
import { type WeekStart, weekStartStore } from '@/lib/weekstart'

const emptySubscribe = () => () => {}

type Option<T> = { value: T; label: string; title: string; icon?: React.ReactNode }

const iconClass = 'h-3.5 w-3.5'

const THEMES: Option<Theme>[] = [
  {
    value: 'light',
    label: 'Light',
    title: 'Always light',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={iconClass} aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
      </svg>
    ),
  },
  {
    value: 'system',
    label: 'Auto',
    title: 'Match this device',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={iconClass} aria-hidden="true">
        <rect x="3" y="4" width="18" height="12" rx="1.5" />
        <path strokeLinecap="round" d="M8 20h8m-4-4v4" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    title: 'Always dark',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={iconClass} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    ),
  },
]

const CLOCKS: Option<TimeFormat>[] = [
  { value: '12', label: '2:30 PM', title: '12-hour clock' },
  { value: '24', label: '14:30', title: '24-hour clock' },
]

const WEEK_STARTS: Option<WeekStart>[] = [
  { value: 0, label: 'Sunday', title: 'Weeks start on Sunday' },
  { value: 1, label: 'Monday', title: 'Weeks start on Monday' },
]

// Heroicons "cog-6-tooth" (outline).
function CogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

// One labeled row of the settings panel: a name on the left, a segmented
// control on the right. Every option is a real button with its word showing,
// so nothing depends on hover to explain itself.
function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[13px] text-zinc-600 dark:text-zinc-300">{label}</span>
      <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
        {options.map(opt => {
          const active = opt.value === value
          return (
            <button
              key={String(opt.value)}
              type="button"
              role="radio"
              aria-checked={active}
              title={opt.title}
              onClick={() => onChange(opt.value)}
              className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium tabular-nums transition-colors ${
                active
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// The header's settings: how the app looks and reads (theme, clock, first day
// of the week), behind one button instead of two always-visible toggles on
// every page. Display preferences only — none of them touch stored tasks.
export default function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.get, () => 'system' as Theme)
  const clock = useSyncExternalStore(timeFormatStore.subscribe, timeFormatStore.get, () => '12' as TimeFormat)
  const weekStart = useSyncExternalStore(weekStartStore.subscribe, weekStartStore.get, () => 0 as WeekStart)
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  // Keep "Auto" live: follow the device's light/dark switch while it's chosen.
  // This lives here because the header (and so this menu) is on every page.
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  useEffect(() => {
    if (!open) return
    // Start keyboard users on the current theme choice.
    panelRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
      buttonRef.current?.focus()
    }
    // Close on a tap or click anywhere outside the panel and its button. A
    // full-screen backdrop can't do this here: the header's backdrop blur makes
    // it the containing block for fixed children, so one would only cover it.
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || buttonRef.current?.contains(t)) return
      setOpen(false)
    }
    // Capture, so Escape closes this panel before any page-level handler sees it.
    window.addEventListener('keydown', onKey, true)
    document.addEventListener('pointerdown', onPointer, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.removeEventListener('pointerdown', onPointer, true)
    }
  }, [open])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Settings"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Settings"
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
          open
            ? 'bg-zinc-200/70 text-zinc-900 dark:bg-zinc-800 dark:text-white'
            : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'
        }`}
      >
        <CogIcon className="h-5 w-5" />
      </button>
      {open && mounted && (
        <div
          role="dialog"
          aria-label="Settings"
          ref={panelRef}
          className="animate-[palette-in_120ms_ease-out] absolute right-0 top-full z-30 mt-1.5 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-zinc-200 bg-white p-3 shadow-lg shadow-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/30"
        >
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">Display</p>
          <Segmented label="Theme" options={THEMES} value={theme} onChange={themeStore.set} />
          <Segmented label="Clock" options={CLOCKS} value={clock} onChange={timeFormatStore.set} />
          <Segmented label="Week starts" options={WEEK_STARTS} value={weekStart} onChange={weekStartStore.set} />
          <p className="mt-2 border-t border-zinc-100 pt-2 text-[11px] leading-relaxed text-zinc-400 dark:border-zinc-800">
            Saved in this browser. Your tasks are not changed.
          </p>
        </div>
      )}
    </div>
  )
}
