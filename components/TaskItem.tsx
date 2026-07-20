'use client'

import { useState, useRef, useEffect } from 'react'
import type { Task, RepeatRule, Subtask } from '@/lib/planner'
import { addDaysStr, formatDayLabel, formatDuration, formatRepeatDays, formatTime, routineStreak, subtaskProgress, todayStr, WEEKDAY_ABBR } from '@/lib/planner'
import NoteText from '@/components/NoteText'
import SubtaskList from '@/components/SubtaskList'

const REPEAT_OPTIONS: { value: RepeatRule; label: string }[] = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
]

// The one-tap estimates the menu offers, in minutes. Anything in between is
// quick-add territory ("Stand-up 20m").
const ESTIMATE_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240]

// minutes-since-midnight ↔ the "HH:MM" a native <input type="time"> uses.
const toTimeInput = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
const fromTimeInput = (value: string): number | null => {
  const [h, m] = value.split(':').map(Number)
  return Number.isInteger(h) && Number.isInteger(m) ? h * 60 + m : null
}

// The fixed cadences carry a static label; the 'days' rule is labelled from its
// weekday set (see formatRepeatDays), so it's kept out of this record.
const REPEAT_LABEL: Record<'daily' | 'weekdays' | 'weekly', string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  weekly: 'Weekly',
}

// Full weekday names for the day-picker's accessible labels.
const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Circular-arrows glyph shared by the repeat action and the recurs indicator.
function RepeatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356M2.985 19.644v-4.992h4.992m-4.681-2.72a7.5 7.5 0 0112.548-3.364l3.18 3.182m0 0V9.349m0 2.401a7.5 7.5 0 01-12.548 3.364l-3.18-3.182" />
    </svg>
  )
}

// Heroicons "fire" — a routine's streak.
function FlameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
    </svg>
  )
}

// Heroicons "calendar" — the schedule action.
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

// Heroicons "clock" — the estimate action and indicator.
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// A small checkmark, reused by the open menus to flag the active choice.
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

// Heroicons "star" — solid marks an important (starred) task, outline is the
// action to star one.
function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}
function StarOutlineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

// Heroicons "ellipsis-horizontal" — opens the task actions menu on touch
// screens, where the hover-revealed icons can't appear.
function EllipsisIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  )
}

// Heroicons "pencil" — the edit action, shared by the hover icon and the
// touch actions menu.
function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

// Note lines glyph — the note action, shared by the hover icon and the touch
// actions menu.
function NoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7" />
    </svg>
  )
}

// Heroicons "list-bullet" — the steps (subtask checklist) action and the
// progress pill.
function StepsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.008v.008H3.75V6.75zm0 5.25h.008v.008H3.75V12zm0 5.25h.008v.008H3.75v-.008z" />
    </svg>
  )
}

// Hover-revealed action icons: hidden until the row is hovered or focused
// with the keyboard. On touch screens (no hover) they're removed entirely —
// the ellipsis menu carries those actions instead.
const hoverAction =
  'flex-shrink-0 p-1 transition-all rounded pointer-coarse:hidden opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400'
const visibleAction =
  'flex-shrink-0 p-1 transition-all rounded pointer-coarse:hidden text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'

type Props = {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit?: (id: string, text: string) => void
  onEditNote?: (id: string, note: string) => void
  onSchedule?: (id: string, date: string) => void
  onSetRepeat?: (id: string, repeat: RepeatRule | undefined, repeatDays?: number[]) => void
  onSetEstimate?: (id: string, estimateMin: number | undefined) => void
  onSetTime?: (id: string, timeMin: number | undefined) => void
  onSetPriority?: (id: string, priority: boolean) => void
  onSetSubtasks?: (id: string, subtasks: Subtask[]) => void
  // Park this task in the Someday list (given, a dated task can be moved there
  // from its schedule menu). Someday tasks themselves don't receive this.
  onSetSomeday?: (id: string, someday: boolean) => void
  // A live "in 25m" hint shown on the next timed task that's still ahead today.
  upNextLabel?: string
  // A live "25m late" hint shown on a timed task whose moment has passed unfinished.
  overdueLabel?: string
  carryover?: boolean
  // Marks this row as the keyboard selection — draws a focus ring and scrolls
  // the row into view. Driven from the parent's list navigation.
  selected?: boolean
  // Briefly flashes the row after it's been jumped to from search, then lifts.
  // Independent of `selected` — it's a box-shadow pulse, not a ring.
  highlight?: boolean
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
  onSchedule,
  onSetRepeat,
  onSetEstimate,
  onSetTime,
  onSetPriority,
  onSetSubtasks,
  onSetSomeday,
  upNextLabel,
  overdueLabel,
  carryover = false,
  selected = false,
  highlight = false,
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
  // Reveals the steps checklist on a task that has none yet, so "Add step" opens
  // an empty list ready to type into; it collapses again if left empty.
  const [addingStep, setAddingStep] = useState(false)
  // Only one popover per task is open at a time, so a single value tracks them.
  const [menu, setMenu] = useState<null | 'repeat' | 'schedule' | 'estimate' | 'actions'>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const draggable = !!onDragStart
  const canNote = !!onEditNote
  const canRepeat = !!onSetRepeat
  const canSchedule = !!onSchedule
  const canEstimate = !!onSetEstimate
  const canSetTime = !!onSetTime
  const canPrioritize = !!onSetPriority
  const canSubtask = !!onSetSubtasks
  const canSomeday = !!onSetSomeday
  const { done: subDone, total: subTotal } = subtaskProgress(task)
  const hasSubtasks = subTotal > 0
  // The checklist shows whenever there are steps, or when one is being added.
  const showSubtasks = hasSubtasks || addingStep
  // Steps are editable in the same places a task is (not once it's finished).
  const subtasksEditable = canSubtask && !task.done

  const chooseRepeat = (repeat: RepeatRule | undefined) => {
    setDraftDays(null) // a preset (or "Don't repeat") supersedes any day draft
    onSetRepeat?.(task.id, repeat)
    setMenu(null)
  }

  // Editing a routine's weekday set is deferred until the repeat menu closes:
  // toggling a chip updates a local draft, and the whole set commits once, on
  // close. That keeps a task from leaving today's list mid-edit (a Mon/Wed/Fri
  // routine isn't due on a Thursday) and makes picking several days feel like
  // one deliberate choice. Null means no draft in progress.
  const [draftDays, setDraftDays] = useState<number[] | null>(null)
  const repeatDays = draftDays ?? (task.repeat === 'days' ? (task.repeatDays ?? []) : [])
  const toggleRepeatDay = (day: number) => {
    setDraftDays(
      repeatDays.includes(day)
        ? repeatDays.filter(d => d !== day)
        : [...repeatDays, day].sort((a, b) => a - b)
    )
  }
  // Commit a pending weekday draft when the repeat menu closes. An empty set
  // means "no days left" — that turns repeating off entirely.
  useEffect(() => {
    if (menu !== 'repeat' && draftDays !== null) {
      onSetRepeat?.(task.id, draftDays.length ? 'days' : undefined, draftDays)
      setDraftDays(null)
    }
  }, [menu, draftDays, onSetRepeat, task.id])

  const chooseDate = (date: string) => {
    onSchedule?.(task.id, date)
    setMenu(null)
  }

  const chooseEstimate = (estimateMin: number | undefined) => {
    onSetEstimate?.(task.id, estimateMin)
    setMenu(null)
  }

  const chooseTime = (timeMin: number | undefined) => {
    onSetTime?.(task.id, timeMin)
    setMenu(null)
  }

  // A routine's current streak. Only a real run (2+) earns the flame — a
  // single completion is just a task done, not yet a streak.
  const streak = task.repeat ? routineStreak(task) : 0
  const streakUnit = task.repeat === 'weekly' ? 'week' : 'day'

  // How this task's recurrence reads on its row and in tooltips: the fixed
  // cadences have a static word; a 'days' routine names its weekdays.
  const repeatLabel = task.repeat === 'days'
    ? formatRepeatDays(task.repeatDays ?? [])
    : task.repeat
      ? REPEAT_LABEL[task.repeat]
      : ''

  // The handful of days the schedule menu offers as one tap — today through a
  // week out — with the current day flagged. Anything further is the date field.
  const today = todayStr()
  const dayOptions = Array.from({ length: 7 }, (_, i) => addDaysStr(i))

  useEffect(() => {
    if (editing) editInputRef.current?.focus()
  }, [editing])

  // Keep the keyboard-selected row in view as the selection moves through the
  // list. `block: 'nearest'` scrolls the minimum needed, so it never jumps.
  useEffect(() => {
    if (selected) rowRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selected])

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
      ref={rowRef}
      id={`task-${task.id}`}
      draggable={draggable}
      onDragStart={draggable ? (e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart!(task.id) } : undefined}
      onDragOver={draggable ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver!(task.id) } : undefined}
      onDrop={draggable ? (e) => { e.preventDefault(); onDrop!(task.id) } : undefined}
      onDragEnd={draggable ? () => onDragEnd!() : undefined}
      className={`group relative rounded-2xl bg-white dark:bg-zinc-900 border px-4 py-3 transition-all duration-150 ${
        isDragging
          ? 'opacity-40 scale-[0.98] border-zinc-200 dark:border-zinc-800'
          : isDragOver
          ? 'border-zinc-400 dark:border-zinc-500 shadow-md'
          : 'border-zinc-200 dark:border-zinc-800'
      } ${
        selected
          ? 'ring-2 ring-zinc-400 dark:ring-zinc-500 ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-950'
          : ''
      } ${highlight ? 'reveal-flash' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {draggable && (
          <div
            aria-hidden="true"
            className="flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 pointer-coarse:hidden text-zinc-300 dark:text-zinc-600 transition-opacity"
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

        {/* Title and details are the readable heart of the row. The title
            always keeps the full width of this middle column; the quiet
            metadata pills (time excepted) drop to a second line beneath it
            rather than crowding the title off-screen on a narrow phone. */}
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2 min-w-0">
            {/* Time of day — a quiet agenda timestamp that leads the task.
                Opens the schedule menu (where the time lives) when editable. */}
            {task.timeMin != null && !editing && (
              canSetTime && !task.done ? (
                <button
                  onClick={() => setMenu(m => (m === 'schedule' ? null : 'schedule'))}
                  aria-haspopup="menu"
                  aria-expanded={menu === 'schedule'}
                  title="Change time"
                  className="flex-shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                >
                  {formatTime(task.timeMin)}
                </button>
              ) : (
                <span
                  title="Scheduled time"
                  className={`flex-shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-zinc-500 dark:text-zinc-400 ${task.done ? 'opacity-60' : ''}`}
                >
                  {formatTime(task.timeMin)}
                </span>
              )
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
                className="flex-1 min-w-0 bg-transparent text-zinc-800 dark:text-zinc-100 font-medium text-sm focus:outline-none"
              />
            ) : (
              <span
                onDoubleClick={startEdit}
                className={`flex-1 min-w-0 truncate text-sm ${
                  task.done ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-100'
                } ${carryover ? '' : 'font-medium'} ${!task.done ? 'cursor-text' : ''}`}
              >
                {task.text}
              </span>
            )}

            {/* The star — an important task, floated to the top of the day.
                Solid amber when set; clicking clears it when editable. */}
            {task.priority && !editing && (
              canPrioritize && !task.done ? (
                <button
                  onClick={() => onSetPriority!(task.id, false)}
                  aria-label="Remove star"
                  title="Starred as important — click to unstar"
                  className="flex-shrink-0 text-amber-400 hover:text-amber-500 transition-colors"
                >
                  <StarIcon className="w-4 h-4" />
                </button>
              ) : (
                <span title="Important" className={`flex-shrink-0 text-amber-400 ${task.done ? 'opacity-60' : ''}`}>
                  <StarIcon className="w-4 h-4" />
                </span>
              )
            )}
          </div>

          {/* The details line: what's coming, what's late, a streak, a repeat
              cadence, an estimate, step progress. Wraps instead of pushing on
              the title, and is absent when a task carries none of them. */}
          {!editing && (upNextLabel || overdueLabel || streak >= 2 || task.repeat || task.estimateMin || hasSubtasks) && (
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              {/* The live "starts in" hint on today's next timed task. */}
              {upNextLabel && (
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {upNextLabel}
                </span>
              )}

              {/* Its counterpart: a timed task whose moment has slipped by while
                  still unfinished — a quiet "25m late" in amber. */}
              {overdueLabel && (
                <span className="rounded-full bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                  {overdueLabel}
                </span>
              )}

              {/* The streak — consecutive due days a routine was completed. */}
              {streak >= 2 && (
                <span
                  title={`${streak}-${streakUnit} streak — completed ${streak} ${streakUnit}s in a row`}
                  className={`inline-flex items-center gap-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-amber-600 dark:text-amber-400 ${task.done ? 'opacity-60' : ''}`}
                >
                  <FlameIcon className="w-3 h-3" />
                  {streak}
                </span>
              )}

              {task.repeat && (
                <span
                  title={task.repeat === 'days' ? `Repeats ${repeatLabel}` : `Repeats ${repeatLabel.toLowerCase()}`}
                  className={`inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 ${task.done ? 'opacity-60' : ''}`}
                >
                  <RepeatIcon className="w-3 h-3" />
                  <span>{repeatLabel}</span>
                </span>
              )}

              {/* The estimate pill doubles as the opener for the estimate menu. */}
              {task.estimateMin && (
                canEstimate && !task.done ? (
                  <button
                    onClick={() => setMenu(m => (m === 'estimate' ? null : 'estimate'))}
                    aria-haspopup="menu"
                    aria-expanded={menu === 'estimate'}
                    title="Change estimate"
                    className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    <ClockIcon className="w-3 h-3" />
                    {formatDuration(task.estimateMin)}
                  </button>
                ) : (
                  <span
                    title="Estimated time"
                    className={`inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 ${task.done ? 'opacity-60' : ''}`}
                  >
                    <ClockIcon className="w-3 h-3" />
                    {formatDuration(task.estimateMin)}
                  </span>
                )
              )}

              {/* Steps progress — turns emerald once every step is checked. */}
              {hasSubtasks && (
                <span
                  title={`${subDone} of ${subTotal} steps done`}
                  className={`inline-flex items-center gap-1 text-[10px] font-medium tabular-nums ${
                    subDone === subTotal ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'
                  } ${task.done ? 'opacity-60' : ''}`}
                >
                  <StepsIcon className="w-3 h-3" />
                  {subDone}/{subTotal}
                </span>
              )}
            </div>
          )}
        </div>

        {!editing && (
          <>
            {canPrioritize && !task.priority && !task.done && !editingNote && (
              <button
                onClick={() => onSetPriority!(task.id, true)}
                aria-label="Star as important"
                title="Star as important"
                className={hoverAction}
              >
                <StarOutlineIcon className="w-3.5 h-3.5" />
              </button>
            )}

            {canRepeat && !task.done && !editingNote && (
              <button
                onClick={() => setMenu(m => (m === 'repeat' ? null : 'repeat'))}
                aria-label={task.repeat ? 'Change repeat' : 'Repeat task'}
                aria-haspopup="menu"
                aria-expanded={menu === 'repeat'}
                title={task.repeat ? 'Change repeat' : 'Repeat task'}
                className={task.repeat || menu === 'repeat' ? visibleAction : hoverAction}
              >
                <RepeatIcon className="w-3.5 h-3.5" />
              </button>
            )}

            {canSchedule && !task.done && !editingNote && (
              <button
                onClick={() => setMenu(m => (m === 'schedule' ? null : 'schedule'))}
                aria-label="Schedule for a day"
                aria-haspopup="menu"
                aria-expanded={menu === 'schedule'}
                title="Schedule for a day"
                className={menu === 'schedule' ? visibleAction : hoverAction}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
              </button>
            )}

            {canEstimate && !task.estimateMin && !task.done && !editingNote && (
              <button
                onClick={() => setMenu(m => (m === 'estimate' ? null : 'estimate'))}
                aria-label="Estimate time"
                aria-haspopup="menu"
                aria-expanded={menu === 'estimate'}
                title="Estimate time"
                className={menu === 'estimate' ? visibleAction : hoverAction}
              >
                <ClockIcon className="w-3.5 h-3.5" />
              </button>
            )}

            {canNote && !task.done && !editingNote && (
              <button
                onClick={startNote}
                aria-label={task.note ? 'Edit note' : 'Add note'}
                title={task.note ? 'Edit note' : 'Add note'}
                className={task.note ? visibleAction : hoverAction}
              >
                <NoteIcon className="w-3.5 h-3.5" />
              </button>
            )}

            {canSubtask && !task.done && !editingNote && !showSubtasks && (
              <button
                onClick={() => setAddingStep(true)}
                aria-label="Add a step"
                title="Break into steps"
                className={hoverAction}
              >
                <StepsIcon className="w-3.5 h-3.5" />
              </button>
            )}

            {!task.done && onEdit && (
              <button
                onClick={startEdit}
                aria-label="Edit task"
                className={hoverAction}
              >
                <PencilIcon className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Touch screens have no hover, so the actions above live behind
                one always-visible menu button there instead. */}
            {!task.done && !editingNote && (onEdit || canNote || canSchedule || canRepeat || canEstimate || canPrioritize || canSubtask) && (
              <button
                onClick={() => setMenu(m => (m === 'actions' ? null : 'actions'))}
                aria-label="Task actions"
                aria-haspopup="menu"
                aria-expanded={menu === 'actions'}
                className="hidden pointer-coarse:block flex-shrink-0 p-1 rounded text-zinc-400 dark:text-zinc-500"
              >
                <EllipsisIcon className="w-4 h-4" />
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

      {menu && (
        // Click-away backdrop shared by both popovers, behind the menu but
        // above the page.
        <button
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => setMenu(null)}
          className="fixed inset-0 z-20 cursor-default"
        />
      )}

      {menu === 'actions' && (
        <div
          role="menu"
          className="absolute right-3 top-12 z-30 w-44 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 shadow-lg shadow-zinc-900/5 dark:shadow-black/30"
        >
          {(
            [
              canPrioritize && {
                label: task.priority ? 'Remove star' : 'Star as important',
                icon: task.priority ? <StarIcon className="w-3.5 h-3.5" /> : <StarOutlineIcon className="w-3.5 h-3.5" />,
                run: () => onSetPriority!(task.id, !task.priority),
              },
              onEdit && { label: 'Edit', icon: <PencilIcon className="w-3.5 h-3.5" />, run: startEdit },
              canNote && { label: task.note ? 'Edit note' : 'Add note', icon: <NoteIcon className="w-3.5 h-3.5" />, run: startNote },
              canSubtask && { label: hasSubtasks ? 'Add step' : 'Break into steps', icon: <StepsIcon className="w-3.5 h-3.5" />, run: () => setAddingStep(true) },
              canSchedule && { label: 'Schedule', icon: <CalendarIcon className="w-3.5 h-3.5" />, run: () => setMenu('schedule') },
              canRepeat && { label: task.repeat ? 'Change repeat' : 'Repeat', icon: <RepeatIcon className="w-3.5 h-3.5" />, run: () => setMenu('repeat') },
              canEstimate && { label: task.estimateMin ? 'Change estimate' : 'Estimate time', icon: <ClockIcon className="w-3.5 h-3.5" />, run: () => setMenu('estimate') },
            ].filter(Boolean) as { label: string; icon: React.ReactNode; run: () => void }[]
          ).map(item => (
            <button
              key={item.label}
              role="menuitem"
              onClick={() => {
                setMenu(null)
                item.run()
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="text-zinc-400 dark:text-zinc-500">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {menu === 'repeat' && (
        <div
          role="menu"
          className="absolute right-3 top-12 z-30 w-48 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 shadow-lg shadow-zinc-900/5 dark:shadow-black/30"
        >
          {REPEAT_OPTIONS.map(opt => {
            const active = task.repeat === opt.value
            return (
              <button
                key={opt.value}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => chooseRepeat(opt.value)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                  active
                    ? 'font-medium text-zinc-900 dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {opt.label}
                {active && <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />}
              </button>
            )
          })}

          {/* Pick the exact weekdays a routine recurs on — for the habits that
              don't fit daily/weekdays/weekly, like a Mon-Wed-Fri workout. Any
              selection switches the task to a day-set routine; clearing it turns
              repeating off. The row stays open so a set can be built up. */}
          <div className="mt-1 border-t border-zinc-100 dark:border-zinc-800 px-1.5 pt-2 pb-1">
            <p className="mb-1.5 px-1 text-[11px] font-medium text-zinc-400">On specific days</p>
            <div className="flex justify-between gap-0.5">
              {WEEKDAY_ABBR.map((abbr, day) => {
                const on = repeatDays.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={on}
                    aria-label={WEEKDAY_FULL[day]}
                    title={WEEKDAY_FULL[day]}
                    onClick={() => toggleRepeatDay(day)}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                      on
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {abbr[0]}
                  </button>
                )
              })}
            </div>
          </div>

          {task.repeat && (
            <button
              role="menuitem"
              onClick={() => chooseRepeat(undefined)}
              className="mt-1 flex w-full items-center rounded-lg border-t border-zinc-100 dark:border-zinc-800 px-2.5 pt-2 pb-1.5 text-left text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              Don’t repeat
            </button>
          )}
        </div>
      )}

      {menu === 'schedule' && (
        <div
          role="menu"
          className="absolute right-3 top-12 z-30 w-44 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 shadow-lg shadow-zinc-900/5 dark:shadow-black/30"
        >
          {dayOptions.map(date => {
            const active = task.createdDate === date
            return (
              <button
                key={date}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => chooseDate(date)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                  active
                    ? 'font-medium text-zinc-900 dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {formatDayLabel(date)}
                {active && <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />}
              </button>
            )
          })}
          {/* Take the task off the calendar entirely and into the Someday list,
              to keep without committing it to a day. */}
          {canSomeday && (
            <button
              role="menuitem"
              onClick={() => { onSetSomeday!(task.id, true); setMenu(null) }}
              className="flex w-full items-center rounded-lg border-t border-zinc-100 dark:border-zinc-800 px-2.5 pt-2 pb-1.5 text-left text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              Someday
            </button>
          )}
          {/* Anything further out than a week: a native date field, floored at
              today so a task can't be scheduled into the past. */}
          <label className="mt-1 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border-t border-zinc-100 dark:border-zinc-800 px-2.5 pt-2 pb-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Pick a date
            <input
              type="date"
              min={today}
              defaultValue={task.createdDate > today ? task.createdDate : ''}
              onChange={e => { if (e.target.value) chooseDate(e.target.value) }}
              className="w-[6.5rem] rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-600 dark:text-zinc-300 focus:outline-none"
            />
          </label>
          {/* A time of day, so the task slots into the day's agenda. Tasks with a
              time sort ahead of untimed ones, earliest first. */}
          {canSetTime && (
            <label className="mt-1 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border-t border-zinc-100 dark:border-zinc-800 px-2.5 pt-2 pb-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              Time of day
              <input
                type="time"
                defaultValue={task.timeMin != null ? toTimeInput(task.timeMin) : ''}
                onChange={e => { const v = fromTimeInput(e.target.value); if (v != null) chooseTime(v) }}
                className="w-[6.5rem] rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-600 dark:text-zinc-300 focus:outline-none"
              />
            </label>
          )}
          {canSetTime && task.timeMin != null && (
            <button
              role="menuitem"
              onClick={() => chooseTime(undefined)}
              className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              Clear time
            </button>
          )}
        </div>
      )}

      {menu === 'estimate' && (
        <div
          role="menu"
          className="absolute right-3 top-12 z-30 w-44 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 shadow-lg shadow-zinc-900/5 dark:shadow-black/30"
        >
          <div className="grid grid-cols-3 gap-1">
            {ESTIMATE_OPTIONS.map(min => {
              const active = task.estimateMin === min
              return (
                <button
                  key={min}
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => chooseEstimate(min)}
                  className={`rounded-lg px-1 py-1.5 text-center text-xs tabular-nums transition-colors ${
                    active
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium'
                      : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {formatDuration(min)}
                </button>
              )
            })}
          </div>
          {task.estimateMin && (
            <button
              role="menuitem"
              onClick={() => chooseEstimate(undefined)}
              className="mt-1.5 flex w-full items-center rounded-lg border-t border-zinc-100 dark:border-zinc-800 px-2.5 pt-2 pb-1 text-left text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              Clear estimate
            </button>
          )}
        </div>
      )}

      {showSubtasks && (
        <SubtaskList
          subtasks={task.subtasks ?? []}
          editable={subtasksEditable}
          onChange={next => onSetSubtasks?.(task.id, next)}
          autoFocusAdd={addingStep}
          onDismissEmpty={() => setAddingStep(false)}
        />
      )}

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
          <NoteText
            text={task.note}
            onDoubleClick={() => { if (!task.done) startNote() }}
            className={`mt-1.5 ml-11 mr-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 ${task.done ? 'line-through opacity-60' : 'cursor-text'}`}
          />
        )
      )}
    </div>
  )
}
