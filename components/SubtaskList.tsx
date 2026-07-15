'use client'

import { useEffect, useRef, useState } from 'react'
import type { Subtask } from '@/lib/planner'
import { newSubtask } from '@/lib/planner'

// The steps that make up a task, shown as a small checklist under its title.
// Each step checks off on its own and can be renamed (double-click) or removed;
// none of it drives the parent task's completion — it just tracks progress
// within the one thing. Read-only when `editable` is false (a finished task).
type Props = {
  subtasks: Subtask[]
  editable: boolean
  onChange: (next: Subtask[]) => void
  // Focus the "add a step" field as soon as the list appears — set when the
  // section was just opened from an empty task, so typing can start at once.
  autoFocusAdd?: boolean
  // Called when the add field is left empty on a task that still has no steps,
  // so the parent can quietly collapse the section it just opened.
  onDismissEmpty?: () => void
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function SubtaskList({ subtasks, editable, onChange, autoFocusAdd, onDismissEmpty }: Props) {
  const [addText, setAddText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const addRef = useRef<HTMLInputElement>(null)
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocusAdd) addRef.current?.focus()
  }, [autoFocusAdd])

  useEffect(() => {
    if (editingId) {
      const el = editRef.current
      el?.focus()
      el?.setSelectionRange(el.value.length, el.value.length)
    }
  }, [editingId])

  const toggle = (id: string) =>
    onChange(subtasks.map(s => (s.id === id ? { ...s, done: !s.done } : s)))

  const remove = (id: string) => onChange(subtasks.filter(s => s.id !== id))

  const add = () => {
    const text = addText.trim()
    if (!text) return
    onChange([...subtasks, newSubtask(text)])
    setAddText('')
    // Keep focus so several steps can be typed in a row.
    requestAnimationFrame(() => addRef.current?.focus())
  }

  const startEdit = (s: Subtask) => {
    if (!editable) return
    setEditText(s.text)
    setEditingId(s.id)
  }

  const saveEdit = () => {
    if (!editingId) return
    const text = editText.trim()
    onChange(
      text
        ? subtasks.map(s => (s.id === editingId ? { ...s, text } : s))
        : subtasks.filter(s => s.id !== editingId) // cleared text removes the step
    )
    setEditingId(null)
  }

  return (
    <div className="mt-2 ml-11 mr-1 space-y-0.5">
      {subtasks.map(s => (
        <div key={s.id} className="group/sub flex items-center gap-2">
          <button
            onClick={() => editable && toggle(s.id)}
            disabled={!editable}
            aria-label={s.done ? 'Mark step not done' : 'Mark step done'}
            className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
              s.done
                ? 'border-transparent bg-emerald-500 text-white'
                : 'border-zinc-300 dark:border-zinc-600 ' + (editable ? 'hover:border-zinc-400 dark:hover:border-zinc-500' : '')
            } ${editable ? '' : 'cursor-default'}`}
          >
            {s.done && <CheckIcon className="h-2.5 w-2.5" />}
          </button>

          {editingId === s.id ? (
            <input
              ref={editRef}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); saveEdit() }
                if (e.key === 'Escape') { e.preventDefault(); setEditingId(null) }
              }}
              className="min-w-0 flex-1 bg-transparent text-xs text-zinc-600 dark:text-zinc-300 focus:outline-none"
            />
          ) : (
            <span
              onDoubleClick={() => startEdit(s)}
              className={`min-w-0 flex-1 break-words text-xs ${
                s.done ? 'text-zinc-400 line-through dark:text-zinc-600' : 'text-zinc-600 dark:text-zinc-300'
              } ${editable ? 'cursor-text' : ''}`}
            >
              {s.text}
            </span>
          )}

          {editable && editingId !== s.id && (
            <button
              onClick={() => remove(s.id)}
              aria-label="Remove step"
              title="Remove step"
              className="flex-shrink-0 rounded p-0.5 text-zinc-300 transition-colors hover:text-rose-400 dark:text-zinc-600 dark:hover:text-rose-400"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}

      {editable && (
        <div className="flex items-center gap-2 pt-0.5">
          <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-zinc-300 dark:text-zinc-600">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <input
            ref={addRef}
            value={addText}
            onChange={e => setAddText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); add() }
              if (e.key === 'Escape') { e.preventDefault(); ;(e.target as HTMLInputElement).blur() }
            }}
            onBlur={() => { if (!addText.trim() && subtasks.length === 0) onDismissEmpty?.() }}
            placeholder="Add a step…"
            className="min-w-0 flex-1 bg-transparent text-xs text-zinc-600 placeholder-zinc-400 focus:outline-none dark:text-zinc-300"
          />
        </div>
      )}
    </div>
  )
}
