'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { type Task, isWaiting, restoreTasks, todayStr, formatDayLabel, formatPastDayLabel } from '@/lib/planner'
import { type TrashItem, loadTrash, saveTrash, TRASH_DAYS } from '@/lib/trash'
import { stripTags } from '@/lib/tags'

// Heroicons outline paths.
const RESTORE = 'M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3'
const TRASH = 'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

// Where the task sat before it was deleted, so a restore holds no surprises.
function whereItWas(t: Task, today: string): string {
  if (t.repeat) return 'Routine'
  if (isWaiting(t)) return 'Waiting'
  if (t.someday) return 'Someday'
  if (t.done) return t.completedDate ? `Finished ${formatPastDayLabel(t.completedDate).replace(/^(Today|Yesterday)$/, s => s.toLowerCase())}` : 'Finished'
  if (t.createdDate === today) return 'Today'
  if (t.createdDate > today) return formatDayLabel(t.createdDate)
  return 'Carried over'
}

function deletedAgo(ms: number, now: number): string {
  const min = Math.floor((now - ms) / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? 'yesterday' : `${d} days ago`
}

export default function DeletedList() {
  const [items, setItems] = useState<TrashItem[] | null>(null)
  const [now, setNow] = useState(0)
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    // Storage only exists in the browser, so the list is read after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(loadTrash())
    setNow(Date.now())
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'bed-trash') setItems(loadTrash())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const flash = (msg: string) => {
    setStatus(msg)
    window.setTimeout(() => setStatus(s => (s === msg ? null : s)), 4000)
  }

  const restore = (picked: TrashItem[]) => {
    const n = restoreTasks(picked.map(i => i.task))
    // savePlanner takes restored tasks out of the trash; re-read it.
    setItems(loadTrash())
    setConfirmEmpty(false)
    flash(n === 1 ? `Restored “${stripTags(picked[0].task.text)}”` : `Restored ${n} tasks`)
  }

  const forget = (id: string) => {
    const next = (items ?? []).filter(i => i.task.id !== id)
    saveTrash(next)
    setItems(next)
  }

  const empty = () => {
    saveTrash([])
    setItems([])
    setConfirmEmpty(false)
  }

  if (items === null) return <div className="h-40" aria-hidden="true" />

  const today = todayStr()

  return (
    <div className="space-y-3">
      <div className="flex min-h-8 items-center justify-between gap-3 px-1">
        <p className="text-xs text-zinc-500 dark:text-zinc-400" role="status" aria-live="polite">
          {status ?? (items.length === 0 ? '' : `${items.length} deleted in the last ${TRASH_DAYS} days`)}
        </p>
        {items.length > 1 && (
          <div className="flex shrink-0 items-center gap-1">
            {confirmEmpty ? (
              <>
                <button
                  onClick={empty}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  Delete all forever
                </button>
                <button
                  onClick={() => setConfirmEmpty(false)}
                  className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => restore(items)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Restore all
                </button>
                <button
                  onClick={() => setConfirmEmpty(true)}
                  className="rounded-lg px-2 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Empty
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 px-6 py-12 text-center">
          <Icon d={TRASH} className="mx-auto h-6 w-6 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">Nothing deleted recently</p>
          <p className="mt-1 text-xs text-zinc-400">
            Tasks you delete stay here for {TRASH_DAYS} days, so one deleted by mistake can be put back.{' '}
            <Link href="/" className="underline decoration-zinc-300 dark:decoration-zinc-600 underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-300">
              Back to today
            </Link>
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          {items.map(item => {
            const t = item.task
            const steps = t.subtasks?.length ?? 0
            return (
              <li key={t.id} className="flex items-center gap-3 py-2.5 pl-4 pr-2">
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm ${t.done && !t.repeat ? 'text-zinc-400 line-through decoration-zinc-300 dark:decoration-zinc-600' : 'text-zinc-800 dark:text-zinc-100'}`}>
                    {stripTags(t.text) || t.text}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                    {whereItWas(t, today)}
                    {steps > 0 && ` · ${steps} step${steps === 1 ? '' : 's'}`}
                    {t.note && ' · note'}
                    {' · deleted '}
                    {deletedAgo(item.deletedAt, now)}
                  </p>
                </div>
                <button
                  onClick={() => restore([item])}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                >
                  <Icon d={RESTORE} className="h-3.5 w-3.5" />
                  Restore
                </button>
                <button
                  onClick={() => forget(t.id)}
                  aria-label={`Delete “${stripTags(t.text)}” forever`}
                  title="Delete forever"
                  className="shrink-0 rounded-lg p-2 text-zinc-300 dark:text-zinc-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Icon d={TRASH} className="h-4 w-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
