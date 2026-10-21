'use client'

import { useRef, useState } from 'react'
import type { Task } from '@/lib/planner'
import { serializeExport, exportFilename, parseImportedTasks } from '@/lib/planner'
import { collectExtras, countExtras, restoreExtras, joinList } from '@/lib/backup'
import { makeTransferLink } from '@/lib/transfer'
import { DeviceIcon } from '@/components/TransferPrompt'
import {
  useLastBackup,
  lastBackupStore,
  formatLastBackup,
  isBackupStale,
  requestPersistentStorage,
} from '@/lib/lastbackup'

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
  // `extrasRestored` says notes or other non-task data were written, so the
  // planner can re-read them.
  onImport: (incoming: Task[], extrasRestored: boolean) => number
}

// A quiet "Your data" card: take your tasks with you, or bring them back.
// It's the counterpart to the privacy promise in the footer — your tasks stay
// in your browser, and now you can carry them out of it whenever you like.
export default function DataControls({ tasks, onImport }: Props) {
  const [status, setStatus] = useState<Status | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastBackup = useLastBackup()

  // Show a message, then fade back to the default hint after a few seconds.
  const flash = (kind: Status['kind'], msg: string) => {
    setStatus({ kind, msg })
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setStatus(null), 5000)
  }

  const handleExport = () => {
    if (tasks.length === 0) return
    const extras = collectExtras()
    const blob = new Blob([serializeExport(tasks, extras)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFilename()
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    lastBackupStore.markToday()
    void requestPersistentStorage()
    const more = countExtras(extras) > 0 ? ', with your notes and lists' : ''
    flash('ok', `Saved a backup of ${tasks.length} task${tasks.length === 1 ? '' : 's'}${more}.`)
  }

  // Hand the backup over as a link: the share sheet on a touch device (AirDrop,
  // Messages, mail), the clipboard elsewhere. The link is built after the tap,
  // so the clipboard gets a pending item — Safari only allows a write that
  // starts inside the tap itself.
  const handleSend = async () => {
    if (tasks.length === 0) return
    const n = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`
    const link = makeTransferLink(JSON.stringify(JSON.parse(serializeExport(tasks, collectExtras()))))
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        try {
          await navigator.share({ title: 'Better Every Day', url: await link })
          flash('ok', `Shared a link with your ${n}. Open it on the other device to add them there.`)
          return
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return
          // No share target; fall back to copying.
        }
      }
      if (typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'text/plain': link.then(url => new Blob([url], { type: 'text/plain' })) }),
        ])
      } else {
        await navigator.clipboard.writeText(await link)
      }
      flash('ok', `Copied a link with your ${n}. Open it on the other device to add them there.`)
    } catch {
      flash('error', 'Couldn’t make a link in this browser. Use Export instead.')
    }
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // let the same file be picked again later
    if (!file) return
    try {
      const { tasks: incoming, extras } = parseImportedTasks(await file.text())
      const restored = restoreExtras(extras)
      const added = onImport(incoming, restored.length > 0)
      const parts = [...(added > 0 ? [`${added} task${added === 1 ? '' : 's'}`] : []), ...restored]
      if (parts.length > 0) {
        flash('ok', `Added ${joinList(parts)} from your backup.`)
      } else if (incoming.length > 0 || extras !== undefined) {
        flash('info', 'Already up to date — nothing new to add.')
      } else {
        flash('info', 'That backup was empty.')
      }
    } catch (err) {
      flash('error', err instanceof Error ? err.message : 'Could not read that file.')
    }
  }

  // With nothing saved yet the card just says what it's for; once there are
  // tasks, it says how long it's been since a copy left this browser.
  const hint =
    tasks.length === 0 && lastBackup === null
      ? { text: 'Back it up, or move it to another browser.', stale: false }
      : lastBackup === null
        ? { text: 'Not backed up yet. Your tasks are only in this browser.', stale: false }
        : { text: formatLastBackup(lastBackup), stale: isBackupStale(lastBackup) }

  const btn =
    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed'

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3">
      <div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-300">Your data</p>
          <p
            aria-live="polite"
            className={`text-[11px] mt-0.5 ${
              status
                ? STATUS_COLOR[status.kind]
                : hint.stale
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {status ? status.msg : hint.text}
          </p>
        </div>
        <div className="mt-2 -ml-2.5 flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={handleSend}
            disabled={tasks.length === 0}
            title={tasks.length === 0 ? 'Nothing to send yet' : 'Copy a link that adds your tasks, notes, and lists on another device'}
            className={btn}
          >
            <DeviceIcon className="w-3.5 h-3.5" />
            Send to a device
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={tasks.length === 0}
            title={tasks.length === 0 ? 'Nothing to export yet' : 'Download a backup of your tasks, notes, and lists'}
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
