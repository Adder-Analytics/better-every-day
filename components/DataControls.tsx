'use client'

import { useRef, useState } from 'react'
import type { Task } from '@/lib/planner'
import { serializeExport, exportFilename, parseImportedTasks } from '@/lib/planner'

type Status = { kind: 'ok' | 'info' | 'error'; msg: string }

// Down-into-tray / up-from-tray glyphs (Heroicons "arrow-down/up-tray").
function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}
function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  )
}

const STATUS_COLOR: Record<Status['kind'], string> = {
  ok: 'text-emerald-600 dark:text-emerald-400',
  info: 'text-zinc-500 dark:text-zinc-400',
  error: 'text-rose-500 dark:text-rose-400',
}

type Props = {
  tasks: Task[]
  // Merge imported tasks into the planner; returns how many were newly added.
  onImport: (incoming: Task[]) => number
}

// A quiet "Your data" card: take your tasks with you, or bring them back.
// It's the counterpart to the privacy promise in the footer — your tasks stay
// in your browser, and now you can carry them out of it whenever you like.
export default function DataControls({ tasks, onImport }: Props) {
  const [status, setStatus] = useState<Status | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Show a message, then fade back to the default hint after a few seconds.
  const flash = (kind: Status['kind'], msg: string) => {
    setStatus({ kind, msg })
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setStatus(null), 5000)
  }

  const handleExport = () => {
    if (tasks.length === 0) return
    const blob = new Blob([serializeExport(tasks)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFilename()
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    flash('ok', `Saved a backup of ${tasks.length} task${tasks.length === 1 ? '' : 's'}.`)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // let the same file be picked again later
    if (!file) return
    try {
      const incoming = parseImportedTasks(await file.text())
      const added = onImport(incoming)
      if (added > 0) {
        flash('ok', `Added ${added} task${added === 1 ? '' : 's'} from your backup.`)
      } else if (incoming.length > 0) {
        flash('info', 'Already up to date — nothing new to add.')
      } else {
        flash('info', 'That backup was empty.')
      }
    } catch (err) {
      flash('error', err instanceof Error ? err.message : 'Could not read that file.')
    }
  }

  const btn =
    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed'

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-300">Your data</p>
          <p
            aria-live="polite"
            className={`text-[11px] mt-0.5 truncate ${status ? STATUS_COLOR[status.kind] : 'text-zinc-400'}`}
          >
            {status ? status.msg : 'Back it up, or move it to another browser.'}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={handleExport}
            disabled={tasks.length === 0}
            title={tasks.length === 0 ? 'Nothing to export yet' : 'Download a backup of your tasks'}
            className={btn}
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            title="Import tasks from a backup file"
            className={btn}
          >
            <UploadIcon className="w-3.5 h-3.5" />
            Import
          </button>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFile}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  )
}
