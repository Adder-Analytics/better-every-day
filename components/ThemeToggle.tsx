'use client'

import { useEffect, useSyncExternalStore } from 'react'

type Theme = 'light' | 'system' | 'dark'

const STORAGE_KEY = 'bed-theme'

// Resolve whether the dark class should be on given a preference.
function prefersDark(theme: Theme): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', prefersDark(theme))
}

// A tiny external store over the saved preference, so the component reads it
// via useSyncExternalStore — no setState-in-effect, and hydration-safe (the
// inline layout script already applies the class before first paint).
const listeners = new Set<() => void>()
const themeStore = {
  subscribe(cb: () => void) {
    listeners.add(cb)
    window.addEventListener('storage', cb)
    return () => {
      listeners.delete(cb)
      window.removeEventListener('storage', cb)
    }
  },
  get(): Theme {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
    } catch {
      return 'system'
    }
  },
  set(t: Theme) {
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {}
    applyTheme(t)
    listeners.forEach(l => l())
  },
}

const emptySubscribe = () => () => {}

const OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: 'light',
    label: 'Light',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
        <circle cx="12" cy="12" r="4" />
        <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
      </svg>
    ),
  },
  {
    value: 'system',
    label: 'System',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
        <rect x="3" y="4" width="18" height="12" rx="1.5" />
        <path strokeLinecap="round" d="M8 20h8m-4-4v4" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    ),
  },
]

export default function ThemeToggle() {
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.get, () => 'system' as Theme)
  // True only after hydration, so the active pill never flickers on load.
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  // Keep "System" live: react to OS changes while that mode is selected.
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={`inline-flex rounded-full bg-zinc-100 dark:bg-zinc-800/80 p-0.5 transition-opacity ${mounted ? 'opacity-100' : 'opacity-0'}`}
    >
      {OPTIONS.map(opt => {
        const active = theme === opt.value
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            aria-label={opt.label}
            title={opt.label}
            onClick={() => themeStore.set(opt.value)}
            className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
              active
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            {opt.icon}
          </button>
        )
      })}
    </div>
  )
}
