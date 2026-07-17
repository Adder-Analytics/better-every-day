'use client'

import { useEffect, useRef, useState } from 'react'
import { todayStr } from '@/lib/planner'
import { loadDayNotes, setDayNote } from '@/lib/daynotes'
import NoteText from '@/components/NoteText'

// Note-lines glyph, matching the task note icon.
function NoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7" />
    </svg>
  )
}

// A quiet card for the day's own note — separate from any task. Rendered only
// inside the planner's post-mount tree, so reading localStorage in the initial
// state is safe (there's no server render of this to mismatch). Editing mirrors
// the task-note editor: a textarea that saves on blur, with Cmd/Ctrl+Enter to
// save and Esc to cancel. The always-visible Edit button (and the empty-state
// button) keep it usable by touch, where hover and double-click don't exist.
export default function DayNote() {
  const today = todayStr()
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    typeof window === 'undefined' ? {} : loadDayNotes()
  )
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  const note = notes[today] ?? ''

  useEffect(() => {
    if (editing) {
      const el = ref.current
      el?.focus()
      el?.setSelectionRange(el.value.length, el.value.length)
    }
  }, [editing])

  const start = () => {
    setDraft(note)
    setEditing(true)
  }
  const save = () => {
    setNotes(prev => setDayNote(prev, today, draft))
    setEditing(false)
  }
  const cancel = () => {
    setDraft(note)
    setEditing(false)
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
          <NoteIcon className="w-3.5 h-3.5" />
          Today’s note
        </p>
        {!editing && note && (
          <button
            type="button"
            onClick={start}
            className="flex-shrink-0 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <textarea
          ref={ref}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={e => {
            if (e.key === 'Escape') { e.preventDefault(); cancel() }
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save() }
          }}
          rows={3}
          placeholder="Anything worth keeping about today…"
          className="mt-2 w-full resize-none rounded-lg bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600"
        />
      ) : note ? (
        <NoteText
          text={note}
          onDoubleClick={start}
          className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 cursor-text"
        />
      ) : (
        <button
          type="button"
          onClick={start}
          className="mt-1.5 w-full rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 px-3 py-2 text-left text-sm text-zinc-400 hover:border-zinc-300 hover:text-zinc-500 dark:hover:border-zinc-600 dark:hover:text-zinc-400 transition-colors"
        >
          Add a note for today…
        </button>
      )}
    </div>
  )
}
