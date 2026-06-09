'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import { type Task, loadPlanner, savePlanner, newTask, todayStr, formatDate } from '@/lib/planner'
import TaskItem from '@/components/TaskItem'

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

  useEffect(() => {
    savePlanner({ version: 1, tasks })
  }, [tasks])

  const addTask = () => {
    const text = newText.trim()
    if (!text) return
    setTasks(prev => [...prev, newTask(text)])
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

  const today = todayStr()
  const todayTasks = tasks.filter(t => t.createdDate === today)
  const carryovers = tasks.filter(t => t.createdDate < today && !t.done)
  const doneCount = todayTasks.filter(t => t.done).length
  const allDone = todayTasks.length > 0 && doneCount === todayTasks.length && carryovers.length === 0

  if (!mounted) {
    return (
      <div className="py-14 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {/* Today header */}
      <div className="flex items-end justify-between px-1 pt-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Today</h2>
          <p className="text-xs text-zinc-400">{formatDate()}</p>
        </div>
        {todayTasks.length > 0 && (
          <p className="text-xs text-zinc-400 tabular-nums">
            <span className="text-base font-bold text-zinc-900 dark:text-white">{doneCount}</span>
            /{todayTasks.length} done
          </p>
        )}
      </div>

      {todayTasks.length > 0 && (
        <div className="h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${allDone ? 'bg-emerald-500' : 'bg-zinc-500 dark:bg-zinc-400'}`}
            style={{ width: `${(doneCount / todayTasks.length) * 100}%` }}
          />
        </div>
      )}

      {/* All done message */}
      {allDone && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-5 py-4 text-center">
          <p className="text-emerald-700 dark:text-emerald-400 font-medium text-sm">All done for today 🎉</p>
          <p className="text-emerald-600/70 dark:text-emerald-500/70 text-xs mt-0.5">Come back tomorrow — this app will be a little better too.</p>
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
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {todayTasks.length === 0 && carryovers.length === 0 && (
        <div className="text-center py-14">
          <div className="text-5xl mb-3">📝</div>
          <p className="text-zinc-600 dark:text-zinc-300 font-medium">What matters today?</p>
          <p className="text-zinc-400 text-sm mt-1">Add your first task below.</p>
        </div>
      )}

      {/* Today's tasks */}
      {todayTasks.map(task => (
        <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
      ))}

      {/* Add task */}
      <div className="flex gap-2 pt-1">
        <input
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') addTask()
            if (e.key === 'Escape') setNewText('')
          }}
          placeholder="Add a task for today..."
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
    </div>
  )
}
