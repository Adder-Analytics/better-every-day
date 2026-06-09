'use client'

import { useState } from 'react'
import type { Task } from '@/lib/planner'

type Props = {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  carryover?: boolean
  onDoToday?: (id: string) => void
}

export default function TaskItem({ task, onToggle, onDelete, carryover = false, onDoToday }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        {carryover ? (
          <button
            onClick={() => onDoToday?.(task.id)}
            className="flex-shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
          >
            Do today
          </button>
        ) : (
          <button
            onClick={() => onToggle(task.id)}
            aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
            className={`w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
              task.done
                ? 'bg-emerald-500 hover:bg-emerald-600 border-transparent text-white'
                : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 bg-transparent'
            }`}
          >
            {task.done && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        )}

        <span
          className={`flex-1 truncate ${
            task.done ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-100'
          } ${carryover ? 'text-sm' : 'font-medium'}`}
        >
          {task.text}
        </span>

        {confirmDelete ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onDelete(task.id)}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              {carryover ? 'Let go' : 'Delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-zinc-400 hover:text-zinc-500 px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            aria-label={carryover ? 'Let go of task' : 'Delete task'}
            className="flex-shrink-0 p-1 text-zinc-200 dark:text-zinc-700 hover:text-zinc-400 dark:hover:text-zinc-500 transition-colors rounded"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
