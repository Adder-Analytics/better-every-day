'use client'

import { useEffect, useRef, useState } from 'react'
import type { Task } from '@/lib/planner'
import { parseImportedTasks } from '@/lib/planner'
import { restoreExtras, joinList } from '@/lib/backup'
import { readTransferHash, clearTransferHash, readTransferLink } from '@/lib/transfer'

type State =
  | { kind: 'offer'; incoming: Task[]; extras: unknown }
  | { kind: 'ok' | 'info' | 'error'; msg: string }
  | null

// Heroicons "device-phone-mobile".
export function DeviceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
  )
}

type Props = {
  tasks: Task[]
  onImport: (incoming: Task[], extrasRestored: boolean) => number
}

// Shown when the page was opened from a "Send to a device" link: says what the
// link holds and asks before adding it. Adding merges the same way Import does,
// so tasks already here are never overwritten or duplicated.
export default function TransferPrompt({ tasks, onImport }: Props) {
  const [state, setState] = useState<State>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Read on load, and again if a link is opened in a tab already showing the
  // planner — that only changes the hash, so nothing remounts.
  useEffect(() => {
    const check = () => {
      const code = readTransferHash()
      if (!code) return
      clearTransferHash()
      readTransferLink(code)
        .then(json => {
          const { tasks: incoming, extras } = parseImportedTasks(json)
          setState({ kind: 'offer', incoming, extras })
        })
        .catch(err => setState({ kind: 'error', msg: err instanceof Error ? err.message : 'That link couldn’t be read.' }))
    }
    check()
    window.addEventListener('hashchange', check)
    return () => window.removeEventListener('hashchange', check)
  }, [])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  if (!state) return null

  const close = () => setState(null)

  if (state.kind !== 'offer') {
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white py-2.5 pl-4 pr-2 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <DeviceIcon className="h-4 w-4 flex-shrink-0 text-zinc-400" />
        <p
          className={`min-w-0 flex-1 text-sm ${
            state.kind === 'ok'
              ? 'text-emerald-700 dark:text-emerald-400'
              : state.kind === 'error'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-zinc-600 dark:text-zinc-300'
          }`}
        >
          {state.msg}
        </p>
        <button
          type="button"
          onClick={close}
          aria-label="Dismiss"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  const have = new Set(tasks.map(t => t.id))
  const total = state.incoming.length
  const fresh = state.incoming.filter(t => !have.has(t.id)).length
  const summary =
    total === 0
      ? 'This link holds notes and lists from another device, but no tasks.'
      : `This link holds ${total} task${total === 1 ? '' : 's'} from another device. ${
          fresh === total
            ? total === 1 ? 'It isn’t in this browser yet.' : 'None are in this browser yet.'
            : fresh === 0
              ? 'All of them are already here.'
              : `${fresh} ${fresh === 1 ? 'isn’t' : 'aren’t'} in this browser yet.`
        }`

  const add = () => {
    const restored = restoreExtras(state.extras)
    const added = onImport(state.incoming, restored.length > 0)
    const parts = [...(added > 0 ? [`${added} task${added === 1 ? '' : 's'}`] : []), ...restored]
    setState(
      parts.length > 0
        ? { kind: 'ok', msg: `Added ${joinList(parts)} from the link.` }
        : { kind: 'info', msg: 'Already up to date. Nothing new to add.' }
    )
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(close, 6000)
  }

  return (
    <div
      role="region"
      aria-label="Tasks from another device"
      className="rounded-2xl border border-emerald-200 bg-white px-4 py-3.5 dark:border-emerald-900/70 dark:bg-zinc-900"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <DeviceIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Add tasks from another device?</p>
          <p className="mt-0.5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {summary} Anything already here stays as it is.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={add}
              className="rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Add to this browser
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-xl px-3.5 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
