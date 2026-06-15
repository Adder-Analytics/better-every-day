'use client'

import { useState, useRef, useEffect } from 'react'
import type { Task } from '@/lib/planner'

type Props = {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit?: (id: string, text: string) => void
  onEditNote?: (id: string, note: string) => void
  carryover?: boolean
  onDoToday?: (id: string) => void
  onDragStart?: (id: string) => void
  onDragOver?: (id: string) => void
  onDrop?: (id: string) => void
  onDragEnd?: () => void
  isDragOver?: boolean
  isDragging?: boolean
}

export default function TaskItem({
  task,
  onToggle,
  onDelete,
  onEdit,
  onEditNote,
  carryover = false,
  onDoToday,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragOver = false,
  isDragging = false,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(task.text)
  const [editingNote, setEditingNote] = useState(false)
  const [noteText, setNoteText] = useState(task.note ?? '')
  const editInputRef = useRef<HTMLInputElement>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const draggable = !!onDragStart
  const canNote = !!onEditNote

  useEffect(() => {
    if (editing) editInputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (editingNote) {
      const el = noteRef.current
      el?.focus()
      el?.setSelectionRange(el.value.length, el.value.length)
    }
  }, [editingNote])

  const startEdit = () => {
    if (task.done) return
    setEditText(task.text)
    setEditing(true)
  }

  const saveEdit = () => {
    const trimmed = editText.trim()
    if (trimmed) onEdit?.(task.id, trimmed)
    setEditing(false)
  }

  const cancelEdit = () => {
    setEditText(task.text)
    setEditing(false)
  }

  const startNote = () => {
    setNoteText(task.note ?? '')
    setEditingNote(true)
  }

  const saveNote = () => {
    onEditNote?.(task.id, noteText.trim())
    setEditingNote(false)
  }

  const cancelNote = () => {
    setNoteText(task.note ?? '')
    setEditingNote(false)
  }

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? (e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart!(task.id) } : undefined}
      onDragOver={draggable ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver!(task.id) } : undefined}
      onDrop={draggable ? (e) => { e.preventDefault(); onDrop!(task.id) } : undefined}
      onDragEnd={draggable ? () => onDragEnd!() : undefined}
      className={`group rounded-2xl bg-white dark:bg-zinc-900 border px-4 py-3 transition-all duration-150 ${
        isDragging
          ? 'opacity-40 scale-[0.98] border-zinc-200 dark:border-zinc-800'
          : isDragOver
          ? 'border-zinc-400 dark:border-zinc-500 shadow-md'
          : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {draggable && (
          <div
            aria-hidden="true"
            className="flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 text-zinc-300 dark:text-zinc-600 transition-opacity"
          >
            <svg className="w-3 h-4" fill="currentColor" viewBox="0 0 8 14">
              <circle cx="2" cy="2" r="1.2"/>
              <circle cx="6" cy="2" r="1.2"/>
              <circle cx="2" cy="7" r="1.2"/>
              <circle cx="6" cy="7" r="1.2"/>
              <circle cx="2" cy="12" r="1.2"/>
              <circle cx="6" cy="12" r="1.2"/>
            </svg>
          </div>
        )}

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

        {editing ? (
          <input
            ref={editInputRef}
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); saveEdit() }
              if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
            }}
            className="flex-1 bg-transparent text-zinc-800 dark:text-zinc-100 font-medium text-sm focus:outline-none"
          />
        ) : (
          <span
            onDoubleClick={startEdit}
            className={`flex-1 truncate text-sm ${
              task.done ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-100'
            } ${carryover ? '' : 'font-medium'} ${!task.done ? 'cursor-text' : ''}`}
          >
            {task.text}
          </span>
        )}

        {!editing && (
          <>
            {canNote && !task.done && !editingNote && (
              <button
                onClick={startNote}
                aria-label={task.note ? 'Edit note' : 'Add note'}
                title={task.note ? 'Edit note' : 'Add note'}
                className={`flex-shrink-0 p-1 transition-all rounded ${
                  task.note
                    ? 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                    : 'opacity-0 group-hover:opacity-100 text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7" />
                </svg>
              </button>
            )}

            {!task.done && (
              <button
                onClick={startEdit}
                aria-label="Edit task"
                className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 transition-all rounded"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}

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
          </>
        )}
      </div>

      {editingNote ? (
        <textarea
          ref={noteRef}
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          onBlur={saveNote}
          onKeyDown={e => {
            if (e.key === 'Escape') { e.preventDefault(); cancelNote() }
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saveNote() }
          }}
          rows={2}
          placeholder="Add a note…"
          className="mt-2 ml-11 w-[calc(100%-2.75rem)] resize-none rounded-lg bg-zinc-50 dark:bg-zinc-800/60 px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600"
        />
      ) : (
        task.note && (
          <p
            onDoubleClick={() => { if (!task.done) startNote() }}
            className={`mt-1.5 ml-11 mr-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 ${task.done ? 'line-through opacity-60' : 'cursor-text'}`}
          >
            {task.note}
          </p>
        )
      )}
    </div>
  )
}
