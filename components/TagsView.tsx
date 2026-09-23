'use client'

import { useState, useEffect, useRef, useMemo, useSyncExternalStore } from 'react'
import Link from 'next/link'
import {
  type Task,
  loadPlanner,
  savePlanner,
  todayStr,
  isDueOn,
  isCompletedOn,
  formatDayLabel,
  formatDue,
  formatTime,
  formatInterval,
  formatRepeatDays,
  PLANNER_VERSION,
} from '@/lib/planner'
import { useHour12 } from '@/lib/timeformat'
import { extractTags, stripTags, tagColor } from '@/lib/tags'

const emptySubscribe = () => () => {}

// True only after hydration, so this localStorage- and clock-backed view never
// mismatches the server HTML (the same guard the planner and routines view use).
function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// The set of tasks a tag list gathers: everything still open and worth seeing
// under a context. Finished one-offs are history, so they drop out; routines
// stay (they're ongoing), and every un-finished one-off is kept wherever it sits
// — today, a day ahead, or the Someday shelf.
function isOpen(task: Task): boolean {
  if (task.repeat) return true
  return !task.done
}

// A short cadence label for a routine, mirroring the wording the task row, the
// repeat menu, and the routines page already use, so a routine reads the same
// everywhere it appears.
function cadenceLabel(task: Task): string {
  switch (task.repeat) {
    case 'daily':
      return 'Every day'
    case 'weekdays':
      return 'Weekdays'
    case 'weekly':
      return 'Weekly'
    case 'monthly':
      return 'Monthly'
    case 'yearly':
      return 'Yearly'
    case 'interval':
      return formatInterval(task.repeatEvery ?? 2)
    case 'days':
      return formatRepeatDays(task.repeatDays ?? [])
    default:
      return ''
  }
}

// How a task's timing reads on a tag row — the same day vocabulary the rest of
// the app uses. A routine names its cadence; a Someday task says so; an
// unfinished one-off dated today or earlier is on today's plate ("Today"); one
// dated ahead names its day ("Tomorrow", "Friday", "Sep 30").
function whenLabel(task: Task, today: string): string {
  if (task.repeat) return cadenceLabel(task)
  if (task.someday) return 'Someday'
  if (task.createdDate <= today) return 'Today'
  return formatDayLabel(task.createdDate)
}

// Where a task sorts within its tag: what's on the plate now leads, then the
// days ahead, then the standing routines, then the someday shelf. Keeps the most
// actionable work at the top of every list.
function rankOf(task: Task, today: string): number {
  if (task.repeat) return 2
  if (task.someday) return 3
  return task.createdDate <= today ? 0 : 1
}

// A routine can be kept off today when it's due; an open one-off can be finished
// once it's reached today's plate. A day-ahead or Someday task is shown for
// planning but isn't checked off here — it's completed on the day it's for.
function isCheckable(task: Task, today: string): boolean {
  if (task.repeat) return isDueOn(task, today)
  if (task.someday) return false
  return task.createdDate <= today
}

function isChecked(task: Task, today: string): boolean {
  if (task.repeat) return isCompletedOn(task, today)
  return task.done
}

// One tag and the open tasks filed under it, plus a couple of counts the header
// reads. Untagged tasks collect under an empty-string key, rendered last.
type TagGroup = { tag: string; tasks: Task[]; open: number }

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  )
}

function RepeatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356M2.985 19.644v-4.992h4.992m-4.681-2.72a7.5 7.5 0 0112.548-3.364l3.18 3.182m0 0V9.349m0 2.401a7.5 7.5 0 01-12.548 3.364l-3.18-3.182" />
    </svg>
  )
}

export default function TagsView() {
  const mounted = useHydrated()
  const hour12 = useHour12()
  const [tasks, setTasks] = useState<Task[]>(() =>
    typeof window === 'undefined' ? [] : loadPlanner().tasks
  )
  const persist = useRef(false)

  // Save on change — but never on the first render, so simply visiting the page
  // doesn't rewrite storage (or trim a long-finished one-off a moment early).
  useEffect(() => {
    if (!persist.current) {
      persist.current = true
      return
    }
    savePlanner({ version: PLANNER_VERSION, tasks })
  }, [tasks])

  const today = todayStr()

  // Group every open task under each tag it carries; anything untagged collects
  // under '' so it can be shown, quietly, at the end. A multi-tag task appears in
  // each of its lists — the same task, seen from every context it belongs to.
  const { groups, untagged, totalOpen, tagCount } = useMemo(() => {
    const open = tasks.filter(isOpen)
    const byTag = new Map<string, Task[]>()
    const add = (key: string, t: Task) => {
      const list = byTag.get(key)
      if (list) list.push(t)
      else byTag.set(key, [t])
    }
    for (const t of open) {
      const tags = extractTags(t.text)
      if (tags.length === 0) add('', t)
      else for (const tag of tags) add(tag, t)
    }
    const byRank = (a: Task, b: Task) => {
      const ra = rankOf(a, today)
      const rb = rankOf(b, today)
      if (ra !== rb) return ra - rb
      // Within the "days ahead" band, the nearer day leads.
      if (ra === 1 && a.createdDate !== b.createdDate) return a.createdDate < b.createdDate ? -1 : 1
      if (!!a.priority !== !!b.priority) return a.priority ? -1 : 1
      const at = a.timeMin ?? 1e9
      const bt = b.timeMin ?? 1e9
      if (at !== bt) return at - bt
      return stripTags(a.text).localeCompare(stripTags(b.text))
    }
    const groups: TagGroup[] = []
    let untagged: Task[] = []
    for (const [key, list] of byTag) {
      list.sort(byRank)
      if (key === '') untagged = list
      else groups.push({ tag: key, tasks: list, open: list.length })
    }
    // Busiest lists first, ties broken alphabetically so the order never jitters.
    groups.sort((a, b) => b.open - a.open || a.tag.localeCompare(b.tag))
    const totalOpen = open.length
    return { groups, untagged, totalOpen, tagCount: groups.length }
  }, [tasks, today])

  const toggle = (id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t
        if (t.repeat) {
          // A routine: keep it off today, or clear that — the same per-day mark
          // the home page records, so it returns fresh tomorrow either way.
          if (!isDueOn(t, today)) return t
          const done = (t.completions ?? []).includes(today)
          const completions = done
            ? (t.completions ?? []).filter(c => c !== today)
            : [...(t.completions ?? []), today]
          return { ...t, completions }
        }
        // A one-off: finish it (it drops out of the open lists), recording today
        // as its completed date exactly as the planner does.
        return { ...t, done: true, completedDate: today }
      })
    )
  }

  // Match the planner's first-paint contract: render nothing data-shaped until
  // hydration, so the server HTML and the first client render agree.
  if (!mounted) {
    return <div className="min-h-[40vh]" aria-hidden />
  }

  if (tagCount === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 px-6 py-14 text-center">
        <svg className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
        </svg>
        <p className="mt-4 text-sm font-medium text-zinc-700 dark:text-zinc-200">No tags yet</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
          Add a <span className="font-medium text-zinc-600 dark:text-zinc-300">#tag</span> to any task — like
          {' '}<span className="font-medium text-zinc-600 dark:text-zinc-300">#work</span> or
          {' '}<span className="font-medium text-zinc-600 dark:text-zinc-300">#errands</span> — and it gathers into a list here.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          Back to today
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <span className="font-medium text-zinc-700 dark:text-zinc-200">{totalOpen}</span>{' '}
        {totalOpen === 1 ? 'task' : 'tasks'} open across{' '}
        <span className="font-medium text-zinc-700 dark:text-zinc-200">{tagCount}</span>{' '}
        {tagCount === 1 ? 'tag' : 'tags'}.
      </p>

      {groups.map(group => (
        <TagSection
          key={group.tag}
          tag={group.tag}
          tasks={group.tasks}
          today={today}
          hour12={hour12}
          onToggle={toggle}
        />
      ))}

      {untagged.length > 0 && (
        <TagSection
          tasks={untagged}
          today={today}
          hour12={hour12}
          onToggle={toggle}
        />
      )}
    </div>
  )
}

// One tag's card: its chip and count, then its tasks. With no `tag` it renders
// the quiet "No tag" catch-all for open tasks that carry no context at all.
function TagSection({
  tag,
  tasks,
  today,
  hour12,
  onToggle,
}: {
  tag?: string
  tasks: Task[]
  today: string
  hour12: boolean
  onToggle: (id: string) => void
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        {tag ? (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-sm font-medium ${tagColor(tag)}`}>
            #{tag}
          </span>
        ) : (
          <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">No tag</span>
        )}
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {tasks.map(task => (
          <TagRow key={task.id} task={task} today={today} hour12={hour12} onToggle={onToggle} />
        ))}
      </ul>
    </section>
  )
}

function TagRow({
  task,
  today,
  hour12,
  onToggle,
}: {
  task: Task
  today: string
  hour12: boolean
  onToggle: (id: string) => void
}) {
  const checkable = isCheckable(task, today)
  const checked = isChecked(task, today)
  const when = whenLabel(task, today)
  const due = task.dueDate ? formatDue(task.dueDate, today) : null
  const dueClass =
    due?.tone === 'overdue'
      ? 'text-rose-600 dark:text-rose-400'
      : due?.tone === 'soon'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-zinc-400 dark:text-zinc-500'

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      {checkable ? (
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          aria-pressed={checked}
          title={checked ? 'Mark not done' : 'Mark done'}
          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
            checked
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-zinc-300 dark:border-zinc-600 text-transparent hover:border-emerald-500'
          }`}
        >
          <CheckIcon className="h-3 w-3" />
          <span className="sr-only">{checked ? 'Mark not done' : 'Mark done'}</span>
        </button>
      ) : (
        // A day-ahead or Someday task isn't checked off here — a small static mark
        // holds the row's alignment and hints at why (a bookmark for Someday, a
        // recurrence loop for a routine off today, a dot for a day still to come).
        <span
          className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center text-zinc-300 dark:text-zinc-600"
          aria-hidden
        >
          {task.someday ? (
            <BookmarkIcon className="h-3.5 w-3.5" />
          ) : task.repeat ? (
            <RepeatIcon className="h-3.5 w-3.5" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
          )}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1.5">
          <span
            className={`text-sm leading-snug ${
              checked ? 'text-zinc-400 line-through dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-100'
            }`}
          >
            {stripTags(task.text)}
          </span>
          {task.priority && !checked && (
            <StarIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-400 dark:text-zinc-500">
          <span>{when}</span>
          {task.timeMin != null && (
            <>
              <span aria-hidden>·</span>
              <span>{formatTime(task.timeMin, hour12)}</span>
            </>
          )}
          {due && (
            <>
              <span aria-hidden>·</span>
              <span className={dueClass}>{due.label}</span>
            </>
          )}
        </div>
      </div>
    </li>
  )
}
