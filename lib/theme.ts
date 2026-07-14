// The theme preference, shared by the header switcher and the command palette
// so both stay in sync. A tiny external store over the saved value lets
// components read it via useSyncExternalStore — no setState-in-effect, and
// hydration-safe (the inline layout script applies the class before first paint).

export type Theme = 'light' | 'system' | 'dark'

const STORAGE_KEY = 'bed-theme'

// Resolve whether the dark class should be on given a preference.
export function prefersDark(theme: Theme): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', prefersDark(theme))
}

const listeners = new Set<() => void>()

export const themeStore = {
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
