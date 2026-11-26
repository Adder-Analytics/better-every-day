'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Task } from '@/lib/planner'
import { formatPastDayLabel, todayStr } from '@/lib/planner'
import { extractTags, stripTags } from '@/lib/tags'
import TagChip from '@/components/TagChip'

// A one-at-a-time pass over the tasks carried over from past days. The list of
// leftovers can grow quietly — a few from yesterday, one from last week — and
// each one needs a decision more than it needs another day on the list. This
// shows them one by one with the five answers that cover nearly every case:
// do it today, push it to tomorrow, park it in Someday, it's already done, or
// let it go. Every decision applies right away (the planner saves as usual),
// and Back walks the last one back, so nothing here is final until it closes.

export type SortAction = 'today' | 'tomorrow' | 'someday' | 'done' | 'delete'

type Decision = { id: string; action: SortAction | 'skip'; before: Task; index: number }

const ACTIONS: { action: SortAction; label: string; key: string; hint: string }[] = [
  { action: 'today', label: 'Today', key: 't', hint: 'T' },
  { action: 'tomorrow', label: 'Tomorrow', key: 'm', hint: 'M' },
  { action: 'someday', label: 'Someday', key: 's', hint: 'S' },
  { action: 'done', label: 'Already done', key: 'd', hint: 'D' },
  { action: 'delete', label: 'Delete', key: 'x', hint: 'X' },
]

function Icon({ action, className }: { action: SortAction; className?: string }) {
  const paths: Record<SortAction, string> = {
    // Heroicons: sun, arrow-uturn-right, archive-box, check, trash.
    today:
      'M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z',
    tomorrow: 'm15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3',
    someday:
      'm20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z',
    done: 'm4.5 12.75 6 6 9-13.5',
    delete:
      'm14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0',
  }
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[action]} />
    </svg>
  )
}

// Which day a task was planned for and how long ago that was, in words:
// "Planned for yesterday", "Planned for Monday · 3 days ago".
function plannedLabel(createdDate: string): string {
  const [y, m, d] = createdDate.split('-').map(Number)
  const [ty, tm, td] = todayStr().split('-').map(Number)
  const days = Math.round((new Date(ty, tm - 1, td).getTime() - new Date(y, m - 1, d).getTime()) / 86_400_000)
  if (days <= 1) return 'Planned for yesterday'
  const ago = days < 14 ? `${days} days ago` : days < 60 ? `${Math.floor(days / 7)} weeks ago` : `${Math.floor(days / 30)} months ago`
  return `Planned for ${formatPastDayLabel(createdDate)} · ${ago}`
}

const SUMMARY: { action: SortAction | 'skip'; one: string; many: string }[] = [
  { action: 'today', one: 'to today', many: 'to today' },
  { action: 'tomorrow', one: 'to tomorrow', many: 'to tomorrow' },
  { action: 'someday', one: 'to Someday', many: 'to Someday' },
  { action: 'done', one: 'marked done', many: 'marked done' },
  { action: 'delete', one: 'deleted', many: 'deleted' },
  { action: 'skip', one: 'left as is', many: 'left as is' },
]

export default function CarryoverSort({
  ids,
  tasks,
  onApply,
  onRestore,
  onClose,
}: {
  ids: string[] // the carried-over tasks, in order, as they stood when the pass opened
  tasks: Task[] // every task, live
  onApply: (id: string, action: SortAction) => void
  onRestore: (before: Task, index: number) => void
  onClose: () => void
}) {
  const [history, setHistory] = useState<Decision[]>([])
  const decided = new Set(history.map(h => h.id))
  // The next task still waiting on a decision. One that left the carryover
  // list some other way meanwhile (it's gone, done, or moved) is passed over.
  const current = ids
    .filter(id => !decided.has(id))
    .map(id => tasks.find(t => t.id === id))
    .find((t): t is Task => !!t && !t.done && !t.repeat && !t.someday && t.createdDate < todayStr())
  const finished = !current
  const position = history.length + 1
  const total = Math.max(ids.length, finished ? history.length : position)
  const panelRef = useRef<HTMLDivElement>(null)

  const decide = useCallback(
    (action: SortAction | 'skip') => {
      if (!current) return
      const index = tasks.findIndex(t => t.id === current.id)
      setHistory(h => [...h, { id: current.id, action, before: current, index }])
      if (action !== 'skip') onApply(current.id, action)
    },
    [current, tasks, onApply]
  )

  const back = useCallback(() => {
    const last = history[history.length - 1]
    if (!last) return
    if (last.action !== 'skip') onRestore(last.before, last.index)
    setHistory(h => h.slice(0, -1))
  }, [history, onRestore])

  // Keys while open: T/M/S/D/X decide, Right or N skips, Left or Ctrl/Cmd+Z goes
  // back, Esc closes. Caught on window in the capture phase so the planner's own
  // list shortcuts (and "?" help) don't also fire underneath the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); back(); return }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); back(); return }
      if (finished) {
        if (e.key === 'Enter') { e.preventDefault(); onClose() }
        return
      }
      if (e.key === 'ArrowRight' || e.key === 'n') { e.preventDefault(); decide('skip'); return }
      if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); decide('delete'); return }
      const hit = ACTIONS.find(a => a.key === e.key.toLowerCase())
      if (hit) { e.preventDefault(); decide(hit.action) }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [decide, back, finished, onClose])

  // Hold focus inside the dialog so Tab doesn't wander into the page behind.
  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  const tags = current ? extractTags(current.text) : []
  const counts = new Map<string, number>()
  for (const h of history) counts.set(h.action, (counts.get(h.action) ?? 0) + 1)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-start sm:px-4 sm:pt-[12vh]" role="dialog" aria-modal="true" aria-label="Sort out carried-over tasks">
      <button
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-zinc-900/25 dark:bg-black/50 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-md overflow-hidden rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl shadow-zinc-900/20 dark:shadow-black/50 outline-none animate-[palette-in_120ms_ease-out] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-3.5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {finished ? 'All sorted' : 'Sort out carried-over tasks'}
          </h2>
          <div className="flex items-center gap-2">
            {!finished && (
              <span className="text-xs tabular-nums text-zinc-400" aria-live="polite">
                {position} of {total}
              </span>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex items-center rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress: one segment per task, filled as each is decided. */}
        <div className="flex gap-1 px-4 pt-2.5" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                i < history.length ? 'bg-emerald-500' : i === history.length && !finished ? 'bg-zinc-400 dark:bg-zinc-500' : 'bg-zinc-200 dark:bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {current ? (
          <div key={current.id} className="animate-[palette-in_140ms_ease-out]">
            <div className="px-4 pb-4 pt-5">
              <p className="text-xs text-zinc-400">
                {plannedLabel(current.createdDate)}
              </p>
              <p className="mt-1.5 text-lg font-medium leading-snug text-zinc-900 dark:text-white break-words">
                {stripTags(current.text) || current.text}
              </p>
              {(tags.length > 0 || current.subtasks?.length || current.note) && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
                  {tags.map(tag => <TagChip key={tag} tag={tag} />)}
                  {current.subtasks?.length ? (
                    <span>{current.subtasks.filter(s => s.done).length}/{current.subtasks.length} steps</span>
                  ) : null}
                  {current.note && <span className="line-clamp-1 max-w-full">{current.note}</span>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 px-4">
              {ACTIONS.slice(0, 3).map(a => (
                <button
                  key={a.action}
                  type="button"
                  onClick={() => decide(a.action)}
                  className="group flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/60 px-2 py-3 text-sm font-medium text-zinc-800 dark:text-zinc-100 transition-[background-color,transform] duration-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.97]"
                >
                  <Icon action={a.action} className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                  <span className="flex items-center gap-1.5">
                    {a.label}
                    <kbd className="hidden sm:inline rounded border border-zinc-200 dark:border-zinc-700 px-1 font-mono text-[10px] text-zinc-400">{a.hint}</kbd>
                  </span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 px-4 pt-2">
              {ACTIONS.slice(3).map(a => (
                <button
                  key={a.action}
                  type="button"
                  onClick={() => decide(a.action)}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-[background-color,transform] duration-100 active:scale-[0.97] ${
                    a.action === 'done'
                      ? 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                      : 'text-zinc-500 dark:text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400'
                  }`}
                >
                  <Icon action={a.action} className="h-4 w-4" />
                  {a.label}
                  <kbd className="hidden sm:inline rounded border border-zinc-200 dark:border-zinc-700 px-1 font-mono text-[10px] text-zinc-400">{a.hint}</kbd>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 pb-2 pt-6 text-center animate-[palette-in_140ms_ease-out]">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Icon action="done" className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
              {history.length === 0
                ? 'Nothing left from past days.'
                : SUMMARY.filter(s => counts.get(s.action))
                    .map(s => `${counts.get(s.action)} ${counts.get(s.action) === 1 ? s.one : s.many}`)
                    .join(' · ')}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-[background-color,transform] duration-100 hover:bg-zinc-700 active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Done
            </button>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 px-2 py-1.5">
          <button
            type="button"
            onClick={back}
            disabled={history.length === 0}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-400 dark:hover:text-white"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>
          {!finished && (
            <button
              type="button"
              onClick={() => decide('skip')}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Leave for now
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
