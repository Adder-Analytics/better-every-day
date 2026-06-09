'use client'

import { useState, useEffect } from 'react'

type Habit = {
  id: string
  name: string
  emoji: string
  colorIndex: number
  createdAt: string
}

type HabitLogs = Record<string, string[]>

const COLORS = [
  { dot: 'bg-violet-500', button: 'bg-violet-500 hover:bg-violet-600', text: 'text-violet-600 dark:text-violet-400' },
  { dot: 'bg-sky-500', button: 'bg-sky-500 hover:bg-sky-600', text: 'text-sky-600 dark:text-sky-400' },
  { dot: 'bg-emerald-500', button: 'bg-emerald-500 hover:bg-emerald-600', text: 'text-emerald-600 dark:text-emerald-400' },
  { dot: 'bg-amber-500', button: 'bg-amber-500 hover:bg-amber-600', text: 'text-amber-600 dark:text-amber-400' },
  { dot: 'bg-rose-500', button: 'bg-rose-500 hover:bg-rose-600', text: 'text-rose-600 dark:text-rose-400' },
  { dot: 'bg-orange-500', button: 'bg-orange-500 hover:bg-orange-600', text: 'text-orange-600 dark:text-orange-400' },
  { dot: 'bg-pink-500', button: 'bg-pink-500 hover:bg-pink-600', text: 'text-pink-600 dark:text-pink-400' },
  { dot: 'bg-cyan-500', button: 'bg-cyan-500 hover:bg-cyan-600', text: 'text-cyan-600 dark:text-cyan-400' },
]

const EMOJIS = ['🏃', '📚', '🧘', '💧', '✍️', '💪', '🎸', '🌱', '🎨', '😴', '🍎', '🚶', '🎯', '🌅', '🧹', '🎵', '🌿', '🔬', '🍳', '🛁']

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getLast28Days(): string[] {
  const days: string[] = []
  for (let i = 27; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  return days
}

function getStreak(logs: string[]): number {
  if (!logs.length) return 0
  const today = todayStr()
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  if (!logs.includes(today) && !logs.includes(yesterday)) return 0

  let streak = 0
  const cur = new Date(logs.includes(today) ? today : yesterday)
  for (let i = 0; i < 365; i++) {
    const ds = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
    if (logs.includes(ds)) {
      streak++
      cur.setDate(cur.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const DEFAULT_HABITS: Habit[] = [
  { id: 'default-1', name: 'Exercise', emoji: '🏃', colorIndex: 0, createdAt: '2024-01-01' },
  { id: 'default-2', name: 'Read', emoji: '📚', colorIndex: 1, createdAt: '2024-01-01' },
  { id: 'default-3', name: 'Meditate', emoji: '🧘', colorIndex: 2, createdAt: '2024-01-01' },
]

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS)
  const [logs, setLogs] = useState<HabitLogs>({})
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('🎯')
  const [newColor, setNewColor] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    const savedHabits = localStorage.getItem('bed-habits')
    const savedLogs = localStorage.getItem('bed-logs')
    if (savedHabits) {
      try { setHabits(JSON.parse(savedHabits)) } catch { /* ignore */ }
    }
    if (savedLogs) {
      try { setLogs(JSON.parse(savedLogs)) } catch { /* ignore */ }
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('bed-habits', JSON.stringify(habits))
  }, [habits, mounted])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('bed-logs', JSON.stringify(logs))
  }, [logs, mounted])

  const toggle = (habitId: string) => {
    const today = todayStr()
    setLogs(prev => {
      const existing = prev[habitId] || []
      return {
        ...prev,
        [habitId]: existing.includes(today)
          ? existing.filter(d => d !== today)
          : [...existing, today],
      }
    })
  }

  const addHabit = () => {
    if (!newName.trim()) return
    const habit: Habit = {
      id: `h${Date.now()}`,
      name: newName.trim(),
      emoji: newEmoji,
      colorIndex: newColor,
      createdAt: todayStr(),
    }
    setHabits(prev => [...prev, habit])
    setNewName('')
    setNewEmoji('🎯')
    setNewColor((newColor + 1) % COLORS.length)
    setShowAdd(false)
  }

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id))
    setLogs(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setConfirmDelete(null)
  }

  const today = todayStr()
  const days28 = getLast28Days()
  const doneToday = habits.filter(h => (logs[h.id] || []).includes(today)).length
  const allDone = habits.length > 0 && doneToday === habits.length

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">Better Every Day</h1>
              <p className="text-xs text-zinc-400">{formatDate()}</p>
            </div>
            {habits.length > 0 && (
              <div className="text-right tabular-nums">
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">{doneToday}</span>
                <span className="text-lg text-zinc-400 font-normal">/{habits.length}</span>
                <p className="text-xs text-zinc-400">today</p>
              </div>
            )}
          </div>
          {habits.length > 0 && (
            <div className="h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${allDone ? 'bg-emerald-500' : 'bg-zinc-500 dark:bg-zinc-400'}`}
                style={{ width: `${(doneToday / habits.length) * 100}%` }}
              />
            </div>
          )}
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-5 space-y-2.5">
        {/* All done message */}
        {allDone && (
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-5 py-4 text-center">
            <p className="text-emerald-700 dark:text-emerald-400 font-medium text-sm">All done for today 🎉</p>
            <p className="text-emerald-600/70 dark:text-emerald-500/70 text-xs mt-0.5">Come back tomorrow to keep your streaks alive.</p>
          </div>
        )}

        {/* Empty state */}
        {habits.length === 0 && (
          <div className="text-center py-14">
            <div className="text-5xl mb-3">🌱</div>
            <p className="text-zinc-600 dark:text-zinc-300 font-medium">Add your first habit below</p>
            <p className="text-zinc-400 text-sm mt-1">Small steps, consistent results.</p>
          </div>
        )}

        {/* Habit cards */}
        {habits.map(habit => {
          const habitLogs = logs[habit.id] || []
          const isDone = habitLogs.includes(today)
          const streak = getStreak(habitLogs)
          const color = COLORS[habit.colorIndex % COLORS.length]
          const isDeleting = confirmDelete === habit.id

          return (
            <div
              key={habit.id}
              className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Toggle button */}
                  <button
                    onClick={() => toggle(habit.id)}
                    aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
                    className={`w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                      isDone
                        ? `${color.button} border-transparent text-white`
                        : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 bg-transparent'
                    }`}
                  >
                    {isDone && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <span className="text-xl leading-none">{habit.emoji}</span>

                  <span className={`font-medium flex-1 truncate ${isDone ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-100'}`}>
                    {habit.name}
                  </span>

                  {streak > 0 && !isDeleting && (
                    <span className={`text-sm font-semibold ${color.text} flex items-center gap-0.5 flex-shrink-0`}>
                      {streak >= 7 ? '🔥' : '⚡'}&thinsp;{streak}
                    </span>
                  )}

                  {isDeleting ? (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="text-xs text-rose-500 hover:text-rose-600 font-medium px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs text-zinc-400 hover:text-zinc-500 px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(habit.id)}
                      aria-label="Delete habit"
                      className="flex-shrink-0 p-1 text-zinc-200 dark:text-zinc-700 hover:text-zinc-400 dark:hover:text-zinc-500 transition-colors rounded"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* 28-day history dots */}
                <div className="mt-3 flex gap-0.5 pl-11">
                  {days28.map((day, i) => {
                    const done = habitLogs.includes(day)
                    const isToday = day === today
                    const isFirstOfWeek = i % 7 === 0 && i > 0
                    return (
                      <div
                        key={day}
                        className={`flex-1 h-2 rounded-sm transition-colors ${isFirstOfWeek ? 'ml-1' : ''} ${
                          done ? color.dot : 'bg-zinc-100 dark:bg-zinc-800'
                        } ${isToday ? 'ring-1 ring-offset-1 ring-zinc-400 dark:ring-zinc-500 dark:ring-offset-zinc-900' : ''}`}
                        title={day}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}

        {/* Add habit panel */}
        {showAdd ? (
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
            {/* Emoji picker */}
            <div className="flex flex-wrap gap-1">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setNewEmoji(e)}
                  className={`text-lg w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    newEmoji === e
                      ? 'bg-zinc-100 dark:bg-zinc-700 scale-110'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>

            {/* Color picker */}
            <div className="flex gap-2">
              {COLORS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setNewColor(i)}
                  className={`w-6 h-6 rounded-full ${c.dot} transition-all ${
                    newColor === i ? 'ring-2 ring-offset-2 ring-zinc-500 dark:ring-zinc-400 dark:ring-offset-zinc-900 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>

            {/* Name input + buttons */}
            <div className="flex gap-2">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') addHabit()
                  if (e.key === 'Escape') { setShowAdd(false); setNewName('') }
                }}
                placeholder="e.g. Drink water, Write, Sleep by 10pm..."
                className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
              />
              <button
                onClick={addHabit}
                disabled={!newName.trim()}
                className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                Add
              </button>
            </div>

            <button
              onClick={() => { setShowAdd(false); setNewName('') }}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setShowAdd(true); setNewColor(habits.length % COLORS.length) }}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add habit
          </button>
        )}
      </div>

      <footer className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-xs text-zinc-400">Your data stays in your browser. Nothing is sent anywhere.</p>
      </footer>
    </main>
  )
}
