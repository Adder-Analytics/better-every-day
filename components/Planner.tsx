'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { type Task, type RepeatRule, loadPlanner, savePlanner, newTask, parseQuickAdd, todayStr, tomorrowStr, formatDate, formatDayLabel, formatDuration, greeting, isDueOn, isCompletedOn, mergeTasks, PLANNER_VERSION } from '@/lib/planner'
import TaskItem from '@/components/TaskItem'
import Confetti from '@/components/Confetti'
import WeekActivity from '@/components/WeekActivity'
import DataControls from '@/components/DataControls'
import NoteText from '@/components/NoteText'

const emptySubscribe = () => () => {}

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
    if (!newText.trim()) return
    // The text decides the schedule when it says so ("...tomorrow", "...every
    // day"); otherwise the Today/Tomorrow toggle is the default. A recognized
    // recurrence becomes a routine anchored to today.
    const { text, date, repeat, estimateMin } = parseQuickAdd(newText)
    if (repeat) {
      setTasks(prev => [...prev, { ...newTask(text, todayStr()), repeat, estimateMin }])
    } else {
      // The text's own day ("...friday") wins; otherwise the Today/Tomorrow
      // toggle decides.
      const day = date ?? (addFor === 'tomorrow' ? tomorrowStr() : todayStr())
      setTasks(prev => [...prev, { ...newTask(text, day), estimateMin }])
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
  // the task's createdDate (which drives the weekly weekday).
  const setRepeat = (id: string, repeat: RepeatRule | undefined) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, repeat, completions: repeat ? (t.completions ?? []) : undefined }
          : t
      )
    )
  }

  const setEstimate = (id: string, estimateMin: number | undefined) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, estimateMin } : t)))
  }

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  // Move a task to any day. The whole today / tomorrow / upcoming / carryover
  // split is driven by createdDate, so changing it is all rescheduling needs:
  // a task slides into the right section and resurfaces in Today on its day.
  const scheduleTask = (id: string, date: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, createdDate: date } : t)))
  }

  const doToday = (id: string) => scheduleTask(id, todayStr())

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
  // Today = one-off tasks created today, plus any routines due today. Filtering
  // the full array preserves order, so drag-reordering still works by id.
  const todayTasks = tasks
    .filter(t => (t.repeat ? isDueOn(t, today) : t.createdDate === today))
    .map(view)
  // Finished tasks sink below what's still left, so the work that remains
  // stays at the top where your attention is. Relative order is preserved
  // within each group, and reordering still works (drag keys off task ids).
  const todayActive = todayTasks.filter(t => !t.done)
  const todayDone = todayTasks.filter(t => t.done)
  // Routines never carry over or queue for tomorrow — they reappear on schedule.
  const carryovers = tasks.filter(t => !t.repeat && t.createdDate < today && !t.done)
  // Tasks scheduled past today — they wait in their own per-day sections and
  // slot into Today automatically when their day arrives. Grouped by date and
  // shown soonest-first; YYYY-MM-DD sorts chronologically as plain strings.
  const upcoming = tasks.filter(t => !t.repeat && t.createdDate > today)
  const upcomingDays = [...new Set(upcoming.map(t => t.createdDate))]
    .sort()
    .map(date => ({ date, items: upcoming.filter(t => t.createdDate === date) }))
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
              onSchedule={scheduleTask}
              onEdit={editTask}
              onEditNote={editNote}
              onSetEstimate={setEstimate}
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

      {/* Today's tasks — still-to-do first, finished ones sink below */}
      {todayActive.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={toggleTask}
          onDelete={deleteTask}
          onEdit={editTask}
          onEditNote={editNote}
          onSchedule={scheduleTask}
          onSetRepeat={setRepeat}
          onSetEstimate={setEstimate}
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

      {/* Quick-add preview: when the text names a schedule, show what will be
          created — the cleaned title and its day/recurrence — so the stripped
          phrase is never a surprise. */}
      {(parsed.schedule || parsed.estimateMin) && parsed.text && (
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
          {parsed.estimateMin && (
            <span className="flex-shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-medium text-zinc-500 dark:text-zinc-400">
              {formatDuration(parsed.estimateMin)}
            </span>
          )}
        </div>
      )}

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

      {/* Upcoming — what you've planned ahead, grouped by day and waiting
          quietly until each one turns into today. */}
      {upcomingDays.map(group => (
        <div key={group.date} className="space-y-2.5">
          <p className="text-xs font-medium text-zinc-400 px-1 pt-2">{formatDayLabel(group.date)}</p>
          {group.items.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onEdit={editTask}
              onEditNote={editNote}
              onSchedule={scheduleTask}
              onSetEstimate={setEstimate}
            />
          ))}
        </div>
      ))}

      <div className="pt-2 space-y-2.5">
        <WeekActivity tasks={tasks} />
        <DataControls tasks={tasks} onImport={importTasks} />
      </div>
      </>)}
    </div>
    </>
  )
}
