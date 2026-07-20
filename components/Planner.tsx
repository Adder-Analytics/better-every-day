'use client'

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { type Task, type RepeatRule, type Subtask, loadPlanner, savePlanner, newTask, parseQuickAdd, todayStr, tomorrowStr, formatDate, formatDayLabel, formatPastDayLabel, formatRepeatDays, formatDuration, formatTime, formatStartsIn, formatOverdue, currentMin, greeting, isDueOn, isCompletedOn, mergeTasks, serializeExport, exportFilename, PLANNER_VERSION } from '@/lib/planner'
import { type Theme, themeStore } from '@/lib/theme'
import TaskItem from '@/components/TaskItem'
import Confetti from '@/components/Confetti'
import WeekActivity from '@/components/WeekActivity'
import DataControls from '@/components/DataControls'
import DayNote from '@/components/DayNote'
import NoteText from '@/components/NoteText'
import CommandPalette, { type Command, type TaskResult, openCommandPalette } from '@/components/CommandPalette'

const emptySubscribe = () => () => {}

// How long a deleted task can be taken back before the deletion is final.
const UNDO_WINDOW_MS = 8000

// A short label for a routine's cadence, used as its context in task search.
// Mirrors the wording the repeat menu and task row already use.
function repeatContext(task: Task): string {
  if (task.repeat === 'daily') return 'Every day'
  if (task.repeat === 'weekdays') return 'Weekdays'
  if (task.repeat === 'weekly') return 'Weekly'
  if (task.repeat === 'days') return formatRepeatDays(task.repeatDays ?? [])
  return 'Today'
}

// Heroicons calendar (a due day) and circular-arrows (a recurrence), sized for
// the quick-add preview line.
function ScheduleIcon({ kind, className }: { kind: 'date' | 'repeat'; className?: string }) {
  return kind === 'repeat' ? (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356M2.985 19.644v-4.992h4.992m-4.681-2.72a7.5 7.5 0 0112.548-3.364l3.18 3.182m0 0V9.349m0 2.401a7.5 7.5 0 01-12.548 3.364l-3.18-3.182" />
    </svg>
  ) : (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

// True only after hydration, so localStorage-backed UI never mismatches server HTML.
function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// The current minute of the day, kept live so the agenda's "now" line tracks the
// real clock. Ticks on each minute boundary (not a fixed interval, so it stays
// aligned) and refreshes whenever the tab is shown again after being hidden.
function useCurrentMin(): number {
  const [min, setMin] = useState(() => (typeof window === 'undefined' ? 0 : currentMin()))
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      setMin(currentMin())
      timer = setTimeout(tick, 60_000 - (Date.now() % 60_000))
    }
    timer = setTimeout(tick, 60_000 - (Date.now() % 60_000))
    const onVisible = () => { if (!document.hidden) setMin(currentMin()) }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [])
  return min
}

// Heroicons "bell" (reminders on) and "bell-slash" (reminders off), sized for
// the small header toggle.
function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}
function BellSlashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.143 17.082a24.248 24.248 0 003.844.148m-3.844-.148a23.856 23.856 0 01-5.455-1.31 8.964 8.964 0 002.3-5.542m3.155 6.852a3 3 0 005.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 003.536-1.003 8.967 8.967 0 01-2.312-6.022V9a6 6 0 00-9.75-4.685M4.5 4.5l3.75 3.75M8.25 9v.75" />
    </svg>
  )
}

// Small inline icons for the command palette entries and its opener. Heroicons
// (outline), sized to sit on a menu row.
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}
function TargetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
    </svg>
  )
}
function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path strokeLinecap="round" d="M8 20h8m-4-4v4" />
    </svg>
  )
}
function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  )
}
function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}
function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5M3.5 12a8.5 8.5 0 1 0 2.4-5.92M3.5 4.5V9H8" />
    </svg>
  )
}
function SparkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
  )
}
function DownToTodayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v11m0 0 4-4m-4 4-4-4M5 20h14" />
    </svg>
  )
}
// Heroicons "command-line" — the palette opener.
function CommandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

// Reminders turn today's agenda from something you read into something that
// nudges you: when a timed task's moment arrives, a browser notification fires
// so you don't have to keep an eye on the clock. It's opt-in (a bell in the
// header), remembered across visits, and honest about its one limit — the tab
// has to be open for a notification to fire, since everything here stays on your
// device with nothing sent anywhere.
const REMINDERS_KEY = 'bed-reminders'

type ReminderTask = { id: string; timeMin: number; text: string }
type Reminders = { supported: boolean; enabled: boolean; blocked: boolean; toggle: () => void }

function useReminders(timedTasks: ReminderTask[]): Reminders {
  // These read the browser directly at init. That's hydration-safe here because
  // the toggle only ever renders after mount (Planner shows a spinner until
  // then), so there's no server HTML for it to mismatch.
  const [supported] = useState(() => typeof window !== 'undefined' && 'Notification' in window)
  const [pref, setPref] = useState(() => {
    try { return typeof window !== 'undefined' && localStorage.getItem(REMINDERS_KEY) === 'on' } catch { return false }
  })
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  )
  // Which (day, task, time) reminders have already fired, so a re-schedule (the
  // list changed, the tab woke, a new day began) never double-notifies.
  const firedRef = useRef<Set<string>>(new Set())
  // Latest tasks read inside the timer effect without making it a dependency —
  // the signature below is what decides when to reschedule. Kept current in its
  // own effect (declared before the scheduler, so it runs first).
  const tasksRef = useRef(timedTasks)
  useEffect(() => { tasksRef.current = timedTasks })

  const enabled = supported && pref && permission === 'granted'
  const blocked = supported && pref && permission === 'denied'

  const toggle = useCallback(() => {
    if (!supported) return
    const next = !pref
    setPref(next)
    try { localStorage.setItem(REMINDERS_KEY, next ? 'on' : 'off') } catch {}
    // Turning on for the first time asks the browser; a later toggle just flips
    // the preference (permission, once decided, can't be re-requested here).
    if (next && Notification.permission === 'default') {
      Notification.requestPermission().then(setPermission)
    } else if (next) {
      setPermission(Notification.permission)
    }
  }, [supported, pref])

  // A signature of what to remind about — id, time, and text — plus the day, so
  // the timers reschedule exactly when the set of upcoming reminders changes
  // (a task edited, completed, or rescheduled; midnight turning routines over)
  // and not on every minute tick.
  const today = todayStr()
  const signature = today + '#' + timedTasks.map(t => `${t.id}:${t.timeMin}:${t.text}`).join('|')

  useEffect(() => {
    if (!enabled) return
    const now = Date.now()
    const d = new Date()
    const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const timers: ReturnType<typeof setTimeout>[] = []
    for (const t of tasksRef.current) {
      const key = `${today}:${t.id}:${t.timeMin}`
      if (firedRef.current.has(key)) continue
      const delay = midnight + t.timeMin * 60_000 - now
      if (delay <= 0) continue // its time already passed today — nothing to fire
      timers.push(
        setTimeout(() => {
          firedRef.current.add(key)
          try {
            new Notification(t.text, {
              body: `It’s ${formatTime(t.timeMin)} — time to start.`,
              tag: key, // collapse duplicates at the OS level too
              icon: '/favicon.ico',
            })
          } catch {}
        }, delay)
      )
    }
    return () => timers.forEach(clearTimeout)
  }, [enabled, signature, today])

  return { supported, enabled, blocked, toggle }
}

// The live "now" marker that sits in the agenda at the current time — a small
// pulsing dot, the clock, and a hairline. It quietly answers "where am I in my
// day?" by separating what's already passed from what's still ahead.
function NowLine({ min }: { min: number }) {
  return (
    <div className="flex items-center gap-2 py-0.5 pl-1.5 pr-1" aria-label={`Now, ${formatTime(min)}`}>
      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide tabular-nums text-emerald-600 dark:text-emerald-400">
        {formatTime(min)}
      </span>
      <span className="h-px flex-1 rounded-full bg-gradient-to-r from-emerald-500/30 to-transparent" />
    </div>
  )
}

export default function Planner() {
  const mounted = useHydrated()
  const nowMin = useCurrentMin()
  const [tasks, setTasks] = useState<Task[]>(() =>
    typeof window === 'undefined' ? [] : loadPlanner().tasks
  )
  const [newText, setNewText] = useState('')
  const [addFor, setAddFor] = useState<'today' | 'tomorrow' | 'someday'>('today')
  const [showConfetti, setShowConfetti] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  // The task the keyboard is pointing at in today's list, by id (null = none).
  // Tracked by id, not index, so it survives reordering when a task is checked
  // off or dragged. Cleared when the task leaves today's list (see below).
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  // The task most recently jumped to from search, flashed briefly then cleared.
  const [revealId, setRevealId] = useState<string | null>(null)
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Recently deleted tasks, each with the list position it came from, kept
  // just long enough to be taken back. Newest last; undo restores from the end.
  const [deleted, setDeleted] = useState<{ task: Task; index: number }[]>([])
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevAllDone = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  // Latest values read by the global key handler without re-binding it every
  // render: the navigable list (today's tasks, in order), the current
  // selection, and the toggle/delete actions. Assigned in the render body once
  // each is computed below.
  const navRef = useRef<Task[]>([])
  const selectedRef = useRef<string | null>(null)
  const actionsRef = useRef<{ toggle: (id: string) => void; del: (id: string) => void }>({
    toggle: () => {},
    del: () => {},
  })
  const router = useRouter()
  // The live theme preference, so the palette can flag the active one and set
  // the others. Shared with the header switcher via the same store.
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.get, () => 'system' as Theme)

  const armUndoTimer = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(() => setDeleted([]), UNDO_WINDOW_MS)
  }, [])

  // Put the most recently deleted task back exactly where it was — same list
  // position, notes, schedule, and completion history intact. Returns whether
  // there was anything to undo, so the key handler knows to swallow the press.
  const undoDelete = useCallback((): boolean => {
    const last = deleted[deleted.length - 1]
    if (!last) return false
    setTasks(prev => {
      if (prev.some(t => t.id === last.task.id)) return prev
      const next = [...prev]
      next.splice(Math.min(last.index, next.length), 0, last.task)
      return next
    })
    const rest = deleted.slice(0, -1)
    setDeleted(rest)
    // More to take back: give them a fresh window. Otherwise stop the clock.
    if (rest.length > 0) armUndoTimer()
    else if (undoTimer.current) clearTimeout(undoTimer.current)
    return true
  }, [deleted, armUndoTimer])

  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current) }, [])

  // Jump to a task found in search: leave focus mode (so the full list is on
  // screen), scroll the row into view, and flash it so the eye lands on it.
  // The flash lifts on its own after a moment. A short delay lets the list
  // paint before we scroll, in case focus mode was just dismissed.
  const revealTask = useCallback((id: string) => {
    setFocusMode(false)
    setSelectedId(null)
    setRevealId(id)
    setTimeout(() => {
      document.getElementById(`task-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 60)
    if (revealTimer.current) clearTimeout(revealTimer.current)
    revealTimer.current = setTimeout(() => setRevealId(null), 1800)
  }, [])

  useEffect(() => () => { if (revealTimer.current) clearTimeout(revealTimer.current) }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
      if (e.key === 'Escape' && focusMode) {
        e.preventDefault()
        setFocusMode(false)
        return
      }
      // Cmd/Ctrl+Z takes back the last delete while the undo window is open.
      // Inputs are already excluded above, so their native undo still works.
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (undoDelete()) e.preventDefault()
        return
      }

      // --- Keyboard list navigation over today's tasks ---------------------
      // Move a selection cursor with j/k, then check the selected task off with
      // Space/Enter or remove it with Backspace. j/k start navigating (letters
      // have no default action), and the arrow keys join in only once a task is
      // selected — so arrow-key page scrolling keeps working until you opt in.
      if (!focusMode && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const nav = navRef.current
        const selId = selectedRef.current
        const idx = nav.findIndex(t => t.id === selId)
        const hasSel = idx !== -1
        const move = (dir: 1 | -1) => {
          if (nav.length === 0) return
          const next = hasSel
            ? Math.min(nav.length - 1, Math.max(0, idx + dir))
            : dir === 1 ? 0 : nav.length - 1
          setSelectedId(nav[next].id)
        }
        if (e.key === 'j') { e.preventDefault(); move(1); return }
        if (e.key === 'k') { e.preventDefault(); move(-1); return }
        if (hasSel) {
          if (e.key === 'ArrowDown') { e.preventDefault(); move(1); return }
          if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); return }
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            const cur = nav[idx]
            // Checking one off sinks it below the still-to-do tasks; step the
            // selection to the next active task so a run of check-offs flows.
            // (Un-checking keeps the selection on the task as it rises back up.)
            if (!cur.done) {
              const activeCount = nav.filter(t => !t.done).length
              setSelectedId(idx + 1 < activeCount ? nav[idx + 1].id : cur.id)
            }
            actionsRef.current.toggle(cur.id)
            return
          }
          if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault()
            // Land the selection on a neighbor so a run of deletes flows.
            setSelectedId(nav[idx + 1]?.id ?? nav[idx - 1]?.id ?? null)
            actionsRef.current.del(selId!)
            return
          }
          if (e.key === 'Escape') { e.preventDefault(); setSelectedId(null); return }
        }
      }

      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [focusMode, undoDelete])

  useEffect(() => {
    savePlanner({ version: PLANNER_VERSION, tasks })
  }, [tasks])

  const addTask = () => {
    if (!newText.trim()) return
    // The text decides the schedule when it says so ("...tomorrow", "...every
    // day"); otherwise the Today/Tomorrow toggle is the default. A recognized
    // recurrence becomes a routine anchored to today.
    const { text, date, repeat, estimateMin, timeMin } = parseQuickAdd(newText)
    if (repeat) {
      setTasks(prev => [...prev, { ...newTask(text, todayStr()), repeat, estimateMin, timeMin }])
    } else if (!date && addFor === 'someday') {
      // No day named in the text and the toggle says Someday: park it in the
      // backlog, anchored to today's date but kept out of every dated section.
      setTasks(prev => [...prev, { ...newTask(text, todayStr()), someday: true, estimateMin, timeMin }])
    } else {
      // The text's own day ("...friday") wins; otherwise the Today/Tomorrow
      // toggle decides.
      const day = date ?? (addFor === 'tomorrow' ? tomorrowStr() : todayStr())
      setTasks(prev => [...prev, { ...newTask(text, day), estimateMin, timeMin }])
    }
    setNewText('')
  }

  const toggleTask = (id: string) => {
    const today = todayStr()
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t
        // A routine records completion per day, so it returns fresh tomorrow.
        if (t.repeat) {
          const done = (t.completions ?? []).includes(today)
          const completions = done
            ? (t.completions ?? []).filter(c => c !== today)
            : [...(t.completions ?? []), today]
          return { ...t, completions }
        }
        return { ...t, done: !t.done, completedDate: t.done ? undefined : today }
      })
    )
  }

  // Turn repeating on/off for a task. Switching off keeps the task as a normal
  // one-off and clears its completion log; switching on anchors the cadence to
  // the task's createdDate (which drives the weekly weekday). A 'days' routine
  // also carries its chosen weekday set; every other rule clears it, so the
  // stored shape stays clean.
  const setRepeat = (id: string, repeat: RepeatRule | undefined, repeatDays?: number[]) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              repeat,
              repeatDays: repeat === 'days' ? repeatDays : undefined,
              completions: repeat ? (t.completions ?? []) : undefined,
            }
          : t
      )
    )
  }

  const setEstimate = (id: string, estimateMin: number | undefined) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, estimateMin } : t)))
  }

  const setTime = (id: string, timeMin: number | undefined) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, timeMin } : t)))
  }

  // Star a task as important, or clear the star. Stored as undefined when off so
  // the saved shape stays clean (a plain task carries no priority field).
  const setPriority = (id: string, priority: boolean) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, priority: priority || undefined } : t)))
  }

  // Replace a task's checklist of steps. Stored as undefined when empty so a
  // task with no steps carries no subtasks field, keeping the saved shape clean.
  const setSubtasks = (id: string, subtasks: Subtask[]) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, subtasks: subtasks.length ? subtasks : undefined } : t)))
  }

  // Deleting keeps the task around briefly so it can be undone — the toast's
  // Undo button or Cmd/Ctrl+Z puts it back. The window resets with each
  // delete, so a run of deletes can be walked back in order.
  const deleteTask = (id: string) => {
    const index = tasks.findIndex(t => t.id === id)
    if (index === -1) return
    const task = tasks[index]
    setTasks(prev => prev.filter(t => t.id !== id))
    setDeleted(prev => [...prev, { task, index }])
    armUndoTimer()
  }

  // Move a task to any day. The whole today / tomorrow / upcoming / carryover
  // split is driven by createdDate, so changing it is all rescheduling needs:
  // a task slides into the right section and resurfaces in Today on its day.
  // Giving a task a day also lifts it out of the Someday list.
  const scheduleTask = (id: string, date: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, createdDate: date, someday: undefined } : t)))
  }

  const doToday = (id: string) => scheduleTask(id, todayStr())

  // Park a task in the Someday list, or take it back out onto today. Someday
  // tasks are anchored to today's date so they never linger in a past or future
  // section if the flag is ever cleared some other way. Stored as undefined when
  // off, so a dated task carries no someday field.
  const setSomeday = (id: string, someday: boolean) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, someday: someday || undefined, createdDate: someday ? todayStr() : t.createdDate }
          : t
      )
    )
  }

  const editTask = (id: string, text: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, text } : t)))
  }

  const editNote = (id: string, note: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, note: note || undefined } : t))
    )
  }

  // Merge a restored backup into the current tasks. Existing tasks always win
  // on an id collision, so importing only ever adds what's new — it can't
  // overwrite or duplicate what's already here. Returns the count added so the
  // data card can report exactly what happened.
  const importTasks = (incoming: Task[]): number => {
    const { tasks: merged, added } = mergeTasks(tasks, incoming)
    if (added > 0) setTasks(merged)
    return added
  }

  // Download a backup of the current tasks — the same export the "Your data"
  // card offers, reachable in one keystroke from the command palette.
  const exportBackup = () => {
    if (tasks.length === 0) return
    const blob = new Blob([serializeExport(tasks)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFilename()
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // Pull every unfinished task carried over from a past day into today at once —
  // the bulk form of each row's "Do today", for mornings with a full backlog.
  const bringCarryoversToToday = () => {
    const today = todayStr()
    setTasks(prev => prev.map(t => (!t.repeat && !t.done && t.createdDate < today ? { ...t, createdDate: today } : t)))
  }

  const handleDragStart = (id: string) => setDragId(id)
  const handleDragOver = (id: string) => { if (id !== dragId) setDragOverId(id) }
  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return
    setTasks(prev => {
      const from = prev.findIndex(t => t.id === dragId)
      const to = prev.findIndex(t => t.id === targetId)
      if (from === -1 || to === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setDragId(null)
    setDragOverId(null)
  }
  const handleDragEnd = () => { setDragId(null); setDragOverId(null) }

  const today = todayStr()
  // A routine renders as a fresh instance each day it's due, with its done-state
  // read from the per-day completion log. One-off tasks pass through unchanged,
  // so all the logic below treats both kinds the same via `t.done`.
  const view = (t: Task): Task =>
    t.repeat ? { ...t, done: isCompletedOn(t, today) } : t
  // Today = one-off tasks created today, plus any routines due today. Someday
  // tasks are held out — they wait in their own list until scheduled. Filtering
  // the full array preserves order, so drag-reordering still works by id.
  const todayTasks = tasks
    .filter(t => (t.repeat ? isDueOn(t, today) : t.createdDate === today && !t.someday))
    .map(view)
  // Tasks with a time of day lead the list in chronological order, turning the
  // day into a quiet agenda; untimed tasks keep their manual order below (sort
  // is stable, so dragging still works among them).
  const byTime = (a: Task, b: Task) => {
    if (a.timeMin == null && b.timeMin == null) return 0
    if (a.timeMin == null) return 1
    if (b.timeMin == null) return -1
    return a.timeMin - b.timeMin
  }
  // Starred tasks float to the top — but only among untimed tasks, so the
  // timed agenda (and the "now" line dropped into it) keeps its chronological
  // order. Sort is stable, so manual order holds within each priority group and
  // drag-to-reorder still works.
  const byPriorityTime = (a: Task, b: Task) => {
    const t = byTime(a, b)
    if (t !== 0) return t
    return (b.priority ? 1 : 0) - (a.priority ? 1 : 0)
  }
  // Finished tasks sink below what's still left, so the work that remains
  // stays at the top where your attention is. Relative order is preserved
  // within each group, and reordering still works (drag keys off task ids).
  const todayActive = todayTasks.filter(t => !t.done).sort(byPriorityTime)
  const todayDone = todayTasks.filter(t => t.done)
  // The keyboard-navigable list: today's tasks in the order they're rendered,
  // still-to-do first and finished below. Carryovers and upcoming days are left
  // out — their primary key action ("Do today") differs, so Space wouldn't have
  // one clear meaning there. Kept in a ref for the global key handler above.
  const navList = [...todayActive, ...todayDone]
  // Keep the global key handler's refs current after each commit (assigning
  // refs during render isn't allowed). A stale selection needs no cleanup — a
  // task that leaves the list simply matches no row (no ring), and the next
  // j/k reselects from the top.
  useEffect(() => {
    navRef.current = navList
    selectedRef.current = selectedId
    actionsRef.current = { toggle: toggleTask, del: deleteTask }
  })
  // The live agenda. Timed tasks lead the list in time order, so a single "now"
  // line dropped after the ones that have already started turns today into a
  // real timeline — everything above the line is behind you, everything below
  // is still ahead. The line only appears once there's a timed task to anchor it.
  const timedActive = todayActive.filter(t => t.timeMin != null)
  const showNowLine = mounted && timedActive.length > 0
  const startedCount = todayActive.filter(t => t.timeMin != null && t.timeMin <= nowMin).length
  // The next timed task still ahead gets a quiet "in 25m" hint, so what's coming
  // up — and how soon — reads at a glance without crowding the rest of the list.
  const nextUp = todayActive.find(t => t.timeMin != null && t.timeMin > nowMin)
  // Reminders watch today's still-to-do timed tasks: finishing, deleting, or
  // rescheduling one cancels its pending notification automatically.
  const reminders = useReminders(
    timedActive.map(t => ({ id: t.id, timeMin: t.timeMin!, text: t.text }))
  )
  // Routines never carry over or queue for tomorrow — they reappear on schedule.
  const carryovers = tasks.filter(t => !t.repeat && !t.someday && t.createdDate < today && !t.done).sort(byPriorityTime)
  // Tasks scheduled past today — they wait in their own per-day sections and
  // slot into Today automatically when their day arrives. Grouped by date and
  // shown soonest-first; YYYY-MM-DD sorts chronologically as plain strings.
  const upcoming = tasks.filter(t => !t.repeat && !t.someday && t.createdDate > today)
  const upcomingDays = [...new Set(upcoming.map(t => t.createdDate))]
    .sort()
    .map(date => ({ date, items: upcoming.filter(t => t.createdDate === date).sort(byPriorityTime) }))
  // The Someday list — captured tasks with no day yet, waiting until you're
  // ready to schedule one or bring it to today. Starred ones lead; the rest
  // keep the order they were added in. Routines are never someday tasks.
  const somedayTasks = tasks.filter(t => t.someday && !t.repeat).sort(byPriorityTime)
  // Everything currently on screen, flattened for search: today's tasks (with a
  // routine's cadence as its context), what's carried over from past days,
  // what's planned ahead, and the Someday backlog. Every entry maps to a
  // rendered row, so revealing one always finds its element.
  const searchTask = (t: Task, context: string): TaskResult => ({
    id: t.id,
    text: t.text,
    context,
    done: t.done,
    run: () => revealTask(t.id),
  })
  const taskResults: TaskResult[] = [
    ...todayActive.map(t => searchTask(t, t.repeat ? repeatContext(t) : 'Today')),
    ...todayDone.map(t => searchTask(t, t.repeat ? repeatContext(t) : 'Today')),
    ...carryovers.map(t => searchTask(t, formatPastDayLabel(t.createdDate))),
    ...upcoming.map(t => searchTask(t, formatDayLabel(t.createdDate))),
    ...somedayTasks.map(t => searchTask(t, 'Someday')),
  ]
  const doneCount = todayTasks.filter(t => t.done).length
  const allDone = todayTasks.length > 0 && doneCount === todayTasks.length && carryovers.length === 0
  // A gentle read on how full today is. Only today's estimated tasks count, so
  // the number stays honest and never nags when nothing's been estimated.
  const plannedMin = todayTasks.reduce((sum, t) => sum + (t.estimateMin ?? 0), 0)
  const doneMin = todayTasks.filter(t => t.done).reduce((sum, t) => sum + (t.estimateMin ?? 0), 0)
  // Focus mode shows only the single next thing to do — your active today
  // tasks come first, then anything carried over — so the rest can wait.
  const focusQueue = [...todayActive, ...carryovers]
  const focusTask = focusQueue[0]
  const focusRemaining = Math.max(0, focusQueue.length - 1)
  // Only truly "in focus" when there's something to focus on; this guarantees
  // exactly one of the two views below renders, with no auto-exit effect.
  const inFocus = focusMode && !!focusTask

  // Surface what's left in the browser tab, so a pinned or background tab
  // tells you how many tasks remain at a glance — no need to switch to it.
  // "Remaining" = today's unfinished tasks plus anything carried over.
  const remaining = todayActive.length + carryovers.length
  useEffect(() => {
    document.title = remaining > 0 ? `(${remaining}) Better Every Day` : 'Better Every Day'
    return () => {
      document.title = 'Better Every Day'
    }
  }, [remaining])

  useEffect(() => {
    if (allDone && !prevAllDone.current) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3500)
      prevAllDone.current = true
      return () => clearTimeout(timer)
    }
    if (!allDone) prevAllDone.current = false
  }, [allDone])

  // What the add box would create as you type — used to preview a recognized
  // schedule (and the title with its phrase removed) before you commit.
  const parsed = parseQuickAdd(newText)

  // Ctrl on Windows/Linux, ⌘ on Apple — shown on the palette opener. Read once
  // on the client; the opener only renders after mount, so it's never on the
  // server's HTML.
  const isMac = typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)
  const modLabel = isMac ? '⌘K' : 'Ctrl K'

  // The command palette's entries, rebuilt from the live view so each one is
  // only offered when it makes sense (focus only with a queue, reminders only
  // for timed tasks, export only with something to export). Every command here
  // has an equivalent in the normal UI — the palette is an accelerator.
  const commands: Command[] = [
    {
      id: 'add',
      label: 'Add a task',
      hint: 'n',
      keywords: 'new create',
      icon: <PlusIcon className="h-4 w-4" />,
      run: () => {
        setFocusMode(false)
        setTimeout(() => inputRef.current?.focus(), 60)
      },
    },
    ...(inFocus
      ? [{ id: 'focus-exit', label: 'Exit focus mode', keywords: 'focus', icon: <TargetIcon className="h-4 w-4" />, run: () => setFocusMode(false) }]
      : focusQueue.length > 0
        ? [{ id: 'focus-enter', label: 'Enter focus mode', hint: 'one at a time', keywords: 'focus concentrate single', icon: <TargetIcon className="h-4 w-4" />, run: () => { setSelectedId(null); setFocusMode(true) } }]
        : []),
    ...(carryovers.length > 0
      ? [{
          id: 'carryovers',
          label: `Bring ${carryovers.length} carried-over ${carryovers.length === 1 ? 'task' : 'tasks'} to today`,
          keywords: 'carryover yesterday move backlog do today',
          icon: <DownToTodayIcon className="h-4 w-4" />,
          run: bringCarryoversToToday,
        }]
      : []),
    ...(reminders.supported && timedActive.length > 0
      ? [{
          id: 'reminders',
          label: reminders.enabled ? 'Turn reminders off' : 'Turn reminders on',
          keywords: 'notify notification alert bell',
          icon: reminders.enabled ? <BellIcon className="h-4 w-4" /> : <BellSlashIcon className="h-4 w-4" />,
          run: reminders.toggle,
        }]
      : []),
    {
      id: 'theme-light',
      label: 'Use light theme',
      hint: theme === 'light' ? 'Active' : undefined,
      keywords: 'theme appearance color mode',
      icon: <SunIcon className="h-4 w-4" />,
      run: () => themeStore.set('light'),
    },
    {
      id: 'theme-system',
      label: 'Match system theme',
      hint: theme === 'system' ? 'Active' : undefined,
      keywords: 'theme appearance auto mode',
      icon: <MonitorIcon className="h-4 w-4" />,
      run: () => themeStore.set('system'),
    },
    {
      id: 'theme-dark',
      label: 'Use dark theme',
      hint: theme === 'dark' ? 'Active' : undefined,
      keywords: 'theme appearance night mode',
      icon: <MoonIcon className="h-4 w-4" />,
      run: () => themeStore.set('dark'),
    },
    ...(tasks.length > 0
      ? [{ id: 'export', label: 'Export a backup', keywords: 'download save data json', icon: <DownloadIcon className="h-4 w-4" />, run: exportBackup }]
      : []),
    { id: 'history', label: 'Open History', keywords: 'past done completed calendar activity', icon: <HistoryIcon className="h-4 w-4" />, run: () => router.push('/history') },
    { id: 'changelog', label: 'What’s new', keywords: 'changelog updates releases day', icon: <SparkIcon className="h-4 w-4" />, run: () => router.push('/changelog') },
  ]

  if (!mounted) {
    return (
      <div className="py-14 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
    <Confetti active={showConfetti} />
    <CommandPalette commands={commands} tasks={taskResults} />

    {/* Undo toast — a deleted task's way back, for the few seconds it exists.
        Fixed above the bottom edge (safe-area aware for the installed app) and
        announced politely to screen readers via role="status". */}
    {deleted.length > 0 && (
      <div className="pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-4">
        <div
          role="status"
          className="pointer-events-auto flex max-w-full items-center gap-2 rounded-full bg-zinc-900 dark:bg-white py-1.5 pl-4 pr-1.5 shadow-lg shadow-zinc-900/20 dark:shadow-black/40 animate-[toast-in_150ms_ease-out]"
        >
          <span className="min-w-0 truncate text-xs text-zinc-400 dark:text-zinc-500">
            Deleted{' '}
            <span className="font-medium text-white dark:text-zinc-900">
              “{deleted[deleted.length - 1].task.text}”
            </span>
          </span>
          <button
            onClick={undoDelete}
            title="Undo delete (Ctrl+Z)"
            className="flex-shrink-0 rounded-full bg-white/15 dark:bg-zinc-900/10 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-white/25 dark:hover:bg-zinc-900/20 transition-colors"
          >
            Undo
          </button>
        </div>
      </div>
    )}

    <div className="space-y-2.5">
      {/* Today header */}
      <div className="flex items-end justify-between px-1 pt-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{greeting()}</h2>
          <p className="text-xs text-zinc-400">{formatDate()}</p>
        </div>
        <div className="flex items-center gap-3">
          {!inFocus && reminders.supported && timedActive.length > 0 && (
            <button
              onClick={reminders.toggle}
              aria-pressed={reminders.enabled}
              title={
                reminders.enabled
                  ? 'Reminders on — you’ll be notified when a task’s time arrives, while this tab is open'
                  : 'Remind me when a timed task’s moment arrives'
              }
              className={`flex items-center transition-colors ${
                reminders.enabled
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {reminders.enabled ? <BellIcon className="w-4 h-4" /> : <BellSlashIcon className="w-4 h-4" />}
              <span className="sr-only">{reminders.enabled ? 'Turn reminders off' : 'Turn reminders on'}</span>
            </button>
          )}
          {!inFocus && focusQueue.length > 0 && (
            <button
              onClick={() => { setSelectedId(null); setFocusMode(true) }}
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              title="Focus on one task at a time"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Focus
            </button>
          )}
          {todayTasks.length > 0 && (
            <p className="text-xs text-zinc-400 tabular-nums">
              <span className="text-base font-bold text-zinc-900 dark:text-white">{doneCount}</span>
              /{todayTasks.length} done
            </p>
          )}
        </div>
      </div>

      {todayTasks.length > 0 && (
        <div className="h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${allDone ? 'bg-emerald-500' : 'bg-zinc-500 dark:bg-zinc-400'}`}
            style={{ width: `${(doneCount / todayTasks.length) * 100}%` }}
          />
        </div>
      )}

      {/* If the browser is blocking notifications, say so plainly instead of
          leaving the bell looking broken — the fix lives in site settings. */}
      {reminders.blocked && !inFocus && (
        <p className="px-1 text-xs text-amber-600 dark:text-amber-500">
          Notifications are blocked for this site. Allow them in your browser to get reminders.
        </p>
      )}

      {/* Time on your plate today — a quiet, honest read on how full the day is.
          Stays hidden until at least one task carries an estimate. */}
      {plannedMin > 0 && !inFocus && (
        <p className="flex items-center gap-1.5 px-1 text-xs text-zinc-400">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="tabular-nums">
            About <span className="font-medium text-zinc-500 dark:text-zinc-300">{formatDuration(plannedMin)}</span> planned today
            {doneMin > 0 && <> · {formatDuration(doneMin)} done</>}
          </span>
        </p>
      )}

      {/* Focus mode — one task, front and center, the rest tucked away */}
      {inFocus && (
        <div className="space-y-3 pt-1">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-12 text-center">
            <button
              onClick={() => {
                toggleTask(focusTask.id)
                // Finishing the last task drops you back to the normal view —
                // and its all-done celebration — instead of an empty panel.
                if (focusQueue.length === 1) setFocusMode(false)
              }}
              aria-label="Mark complete"
              className="group mx-auto mb-6 w-14 h-14 rounded-full border-2 border-zinc-300 dark:border-zinc-600 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            {focusTask.priority && (
              <p className="mb-1 flex items-center justify-center gap-1 text-xs font-semibold text-amber-500">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                Important
              </p>
            )}
            {focusTask.timeMin != null && (
              <p className="mb-1 text-xs font-semibold tabular-nums text-zinc-400">{formatTime(focusTask.timeMin)}</p>
            )}
            <p className="text-lg font-medium text-zinc-900 dark:text-white break-words">{focusTask.text}</p>
            {focusTask.note && (
              <NoteText text={focusTask.note} className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap break-words" />
            )}
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
            <span className="tabular-nums">
              {focusRemaining === 0 ? 'Last one' : `${focusRemaining} more after this`}
            </span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setFocusMode(false)}
              className="font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Exit focus
            </button>
            <kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono text-[10px] border border-zinc-200 dark:border-zinc-700">Esc</kbd>
          </div>
        </div>
      )}

      {!inFocus && (<>
      {/* All done message */}
      {allDone && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-5 py-4 text-center">
          <p className="text-emerald-700 dark:text-emerald-400 font-medium text-sm">All done for today</p>
          <p className="text-emerald-600/70 dark:text-emerald-500/70 text-xs mt-0.5">Everything’s checked off. Enjoy the rest of your day.</p>
        </div>
      )}

      {/* Carryovers from previous days */}
      {carryovers.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-zinc-400 px-1 pt-2">From yesterday</p>
          {carryovers.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              carryover
              highlight={task.id === revealId}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onDoToday={doToday}
              onSchedule={scheduleTask}
              onEdit={editTask}
              onEditNote={editNote}
              onSetEstimate={setEstimate}
              onSetTime={setTime}
              onSetPriority={setPriority}
              onSetSubtasks={setSubtasks}
              onSetSomeday={setSomeday}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {todayTasks.length === 0 && carryovers.length === 0 && (
        <div className="text-center py-14">
          <svg className="w-10 h-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-zinc-600 dark:text-zinc-300 font-medium">What matters today?</p>
          <p className="text-zinc-400 text-sm mt-1">
            Add your first task below — end with{' '}
            <span className="text-zinc-500 dark:text-zinc-300">“tomorrow”</span> or{' '}
            <span className="text-zinc-500 dark:text-zinc-300">“every day”</span> to schedule it.
          </p>
        </div>
      )}

      {/* Today's tasks — still-to-do first, finished ones sink below. The live
          "now" line is dropped in among the timed tasks at the current time. */}
      {(() => {
        const nodes = todayActive.map(task => {
          // Timed tasks are ordered by their time, so they aren't drag-reorderable;
          // untimed tasks keep the manual drag handle.
          const draggable = task.timeMin == null
          return (
            <TaskItem
              key={task.id}
              task={task}
              selected={task.id === selectedId}
              highlight={task.id === revealId}
              upNextLabel={task.id === nextUp?.id ? formatStartsIn(task.timeMin! - nowMin) : undefined}
              overdueLabel={task.timeMin != null && task.timeMin < nowMin ? formatOverdue(nowMin - task.timeMin) : undefined}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onEdit={editTask}
              onEditNote={editNote}
              onSchedule={scheduleTask}
              onSetRepeat={setRepeat}
              onSetEstimate={setEstimate}
              onSetTime={setTime}
              onSetPriority={setPriority}
              onSetSubtasks={setSubtasks}
              onSetSomeday={setSomeday}
              onDragStart={draggable ? handleDragStart : undefined}
              onDragOver={draggable ? handleDragOver : undefined}
              onDrop={draggable ? handleDrop : undefined}
              onDragEnd={draggable ? handleDragEnd : undefined}
              isDragging={dragId === task.id}
              isDragOver={dragOverId === task.id}
            />
          )
        })
        if (showNowLine) nodes.splice(startedCount, 0, <NowLine key="now-line" min={nowMin} />)
        return nodes
      })()}
      {todayDone.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          selected={task.id === selectedId}
          highlight={task.id === revealId}
          onToggle={toggleTask}
          onDelete={deleteTask}
          onEdit={editTask}
          onEditNote={editNote}
          onSetRepeat={setRepeat}
        />
      ))}

      {/* Add task */}
      <div className="flex gap-2 pt-1">
        <input
          ref={inputRef}
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') addTask()
            if (e.key === 'Escape') setNewText('')
          }}
          placeholder={
            addFor === 'tomorrow'
              ? 'Add a task for tomorrow...'
              : addFor === 'someday'
                ? 'Add something for someday...'
                : 'Add a task for today...'
          }
          className="flex-1 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
        />
        <button
          onClick={addTask}
          disabled={!newText.trim()}
          className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          Add
        </button>
      </div>

      {/* Quick-add preview: when the text names a schedule, show what will be
          created — the cleaned title and its day/recurrence — so the stripped
          phrase is never a surprise. */}
      {(parsed.schedule || parsed.estimateMin || parsed.timeMin != null) && parsed.text && (
        <div
          aria-live="polite"
          className="flex items-center gap-1.5 px-1 text-[11px] text-zinc-400"
        >
          {parsed.schedule ? (
            <ScheduleIcon kind={parsed.schedule.kind} className="w-3.5 h-3.5 flex-shrink-0" />
          ) : (
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="min-w-0 truncate text-zinc-500 dark:text-zinc-300">{parsed.text}</span>
          {parsed.schedule && (
            <span className="flex-shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-medium text-zinc-500 dark:text-zinc-400">
              {parsed.schedule.label}
            </span>
          )}
          {parsed.timeMin != null && (
            <span className="flex-shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
              {formatTime(parsed.timeMin)}
            </span>
          )}
          {parsed.estimateMin && (
            <span className="flex-shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-medium text-zinc-500 dark:text-zinc-400">
              {formatDuration(parsed.estimateMin)}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between px-1">
        <div className="inline-flex rounded-full bg-zinc-100 dark:bg-zinc-800/80 p-0.5 text-xs font-medium">
          {(['today', 'tomorrow', 'someday'] as const).map(when => (
            <button
              key={when}
              onClick={() => setAddFor(when)}
              aria-pressed={addFor === when}
              className={`px-2.5 py-1 rounded-full capitalize transition-colors ${
                addFor === when
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              {when}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={openCommandPalette}
          title="Open the command menu"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <CommandIcon className="h-3.5 w-3.5" />
          <span>Commands</span>
          <kbd className="pointer-coarse:hidden rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono text-[10px] px-1 py-0.5 border border-zinc-200 dark:border-zinc-700">
            {modLabel}
          </kbd>
        </button>
      </div>

      {/* Upcoming — what you've planned ahead, grouped by day and waiting
          quietly until each one turns into today. */}
      {upcomingDays.map(group => (
        <div key={group.date} className="space-y-2.5">
          <p className="text-xs font-medium text-zinc-400 px-1 pt-2">{formatDayLabel(group.date)}</p>
          {group.items.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              highlight={task.id === revealId}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onEdit={editTask}
              onEditNote={editNote}
              onSchedule={scheduleTask}
              onSetEstimate={setEstimate}
              onSetTime={setTime}
              onSetPriority={setPriority}
              onSetSubtasks={setSubtasks}
              onSetSomeday={setSomeday}
            />
          ))}
        </div>
      ))}

      {/* Someday — a home for tasks you want to keep but not commit to a day.
          They wait quietly here, out of today and the tab count, until "Do
          today" or a scheduled day lifts one back into the plan. */}
      {somedayTasks.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 px-1 pt-2">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5M12 12.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-xs font-medium text-zinc-400">Someday</p>
            <span className="text-xs tabular-nums text-zinc-300 dark:text-zinc-600">{somedayTasks.length}</span>
          </div>
          {somedayTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              carryover
              highlight={task.id === revealId}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onDoToday={doToday}
              onSchedule={scheduleTask}
              onEdit={editTask}
              onEditNote={editNote}
              onSetEstimate={setEstimate}
              onSetPriority={setPriority}
              onSetSubtasks={setSubtasks}
            />
          ))}
        </div>
      )}

      <div className="pt-2 space-y-2.5">
        <DayNote />
        <WeekActivity tasks={tasks} />
        <DataControls tasks={tasks} onImport={importTasks} />
      </div>
      </>)}
    </div>
    </>
  )
}
