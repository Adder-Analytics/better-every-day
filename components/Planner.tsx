'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { type Task, loadPlanner, savePlanner, newTask, todayStr, tomorrowStr, formatDate, greeting, PLANNER_VERSION } from '@/lib/planner'
import TaskItem from '@/components/TaskItem'
import Confetti from '@/components/Confetti'
import WeekActivity from '@/components/WeekActivity'
import NoteText from '@/components/NoteText'

const emptySubscribe = () => () => {}

// True only after hydration, so localStorage-backed UI never mismatches server HTML.
function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

export default function Planner() {
  const mounted = useHydrated()
  const [tasks, setTasks] = useState<Task[]>(() =>
    typeof window === 'undefined' ? [] : loadPlanner().tasks
  )
  const [newText, setNewText] = useState('')
  const [addFor, setAddFor] = useState<'today' | 'tomorrow'>('today')
  const [showConfetti, setShowConfetti] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const prevAllDone = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
      if (e.key === 'Escape' && focusMode) {
        e.preventDefault()
        setFocusMode(false)
        return
      }
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [focusMode])

  useEffect(() => {
    savePlanner({ version: PLANNER_VERSION, tasks })
  }, [tasks])

  const addTask = () => {
    const text = newText.trim()
    if (!text) return
    const date = addFor === 'tomorrow' ? tomorrowStr() : todayStr()
    setTasks(prev => [...prev, newTask(text, date)])
    setNewText('')
  }

  const toggleTask = (id: string) => {
    const today = todayStr()
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, done: !t.done, completedDate: t.done ? undefined : today }
          : t
      )
    )
  }

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const doToday = (id: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, createdDate: todayStr() } : t)))
  }

  // Decided it can wait? Push a task to tomorrow — it leaves today's list and
  // drops into the Tomorrow section, then returns automatically when the day
  // turns. The inverse of "Do today," so triage works in both directions.
  const moveToTomorrow = (id: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, createdDate: tomorrowStr() } : t)))
  }

  const editTask = (id: string, text: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, text } : t)))
  }

  const editNote = (id: string, note: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, note: note || undefined } : t))
    )
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
  const todayTasks = tasks.filter(t => t.createdDate === today)
  // Finished tasks sink below what's still left, so the work that remains
  // stays at the top where your attention is. Relative order is preserved
  // within each group, and reordering still works (drag keys off task ids).
  const todayActive = todayTasks.filter(t => !t.done)
  const todayDone = todayTasks.filter(t => t.done)
  const carryovers = tasks.filter(t => t.createdDate < today && !t.done)
  // Tasks you've queued for tomorrow — they sit quietly in their own section
  // today and slot into your list automatically when tomorrow arrives.
  const tomorrowTasks = tasks.filter(t => t.createdDate > today)
  const doneCount = todayTasks.filter(t => t.done).length
  const allDone = todayTasks.length > 0 && doneCount === todayTasks.length && carryovers.length === 0
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
    <div className="space-y-2.5">
      {/* Today header */}
      <div className="flex items-end justify-between px-1 pt-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{greeting()}</h2>
          <p className="text-xs text-zinc-400">{formatDate()}</p>
        </div>
        <div className="flex items-center gap-3">
          {!inFocus && focusQueue.length > 0 && (
            <button
              onClick={() => setFocusMode(true)}
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
              onToggle={toggleTask}
              onDelete={deleteTask}
              onDoToday={doToday}
              onMoveToTomorrow={moveToTomorrow}
              onEdit={editTask}
              onEditNote={editNote}
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
          <p className="text-zinc-400 text-sm mt-1">Add your first task below.</p>
        </div>
      )}

      {/* Today's tasks — still-to-do first, finished ones sink below */}
      {todayActive.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={toggleTask}
          onDelete={deleteTask}
          onEdit={editTask}
          onEditNote={editNote}
          onMoveToTomorrow={moveToTomorrow}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          isDragging={dragId === task.id}
          isDragOver={dragOverId === task.id}
        />
      ))}
      {todayDone.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={toggleTask}
          onDelete={deleteTask}
          onEdit={editTask}
          onEditNote={editNote}
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
          placeholder={addFor === 'tomorrow' ? 'Add a task for tomorrow...' : 'Add a task for today...'}
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
      <div className="flex items-center justify-between px-1">
        <div className="inline-flex rounded-full bg-zinc-100 dark:bg-zinc-800/80 p-0.5 text-xs font-medium">
          {(['today', 'tomorrow'] as const).map(when => (
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
        <p className="text-xs text-zinc-400">
          Press <kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono text-[10px] border border-zinc-200 dark:border-zinc-700">n</kbd> to add
        </p>
      </div>

      {/* Tomorrow — what you've planned ahead, waiting quietly until the day turns */}
      {tomorrowTasks.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-zinc-400 px-1 pt-2">Tomorrow</p>
          {tomorrowTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onEdit={editTask}
              onEditNote={editNote}
            />
          ))}
        </div>
      )}

      <div className="pt-2">
        <WeekActivity tasks={tasks} />
      </div>
      </>)}
    </div>
    </>
  )
}
