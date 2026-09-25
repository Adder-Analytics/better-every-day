'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLists, listsStore, type QuickList } from '@/lib/lists'
import { stripTags } from '@/lib/tags'

// Quick lists — a saved set of task lines dropped into a day in one tap. Opened
// the same two ways everything else is: a button in the add area, or the command
// menu (so touch users reach it without a key). See lib/lists for the model.
export const OPEN_QUICK_LISTS = 'bed:open-lists'

export function openQuickLists() {
  window.dispatchEvent(new Event(OPEN_QUICK_LISTS))
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.008v.008H3.75V6.75Zm0 5.25h.008v.008H3.75V12Zm0 5.25h.008v.008H3.75v-.008Z" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

// A list line, previewed with any inline #tag dimmed to a plain word — the same
// read the task rows give, so the preview matches what actually gets added.
function itemPreview(line: string): string {
  return stripTags(line)
}

type FormState = { id: string | null; name: string; items: string }

export default function QuickLists({
  onApply,
  todayTexts,
}: {
  // Drop a list's lines into the day. Each line runs through the same quick-add
  // parsing the add box uses, so tags, times, and "!" are honored.
  onApply: (items: string[]) => void
  // Today's still-to-do task titles, for "Save today's list" — captured as-is so
  // a tag or time on a task carries into the saved line.
  todayTexts: string[]
}) {
  const lists = useLists()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setForm(null)
    setConfirmId(null)
    setJustAdded(null)
  }, [])

  useEffect(() => {
    const show = () => setOpen(true)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        e.preventDefault()
        // Escape steps back out of a form to the list first, then closes — so an
        // in-progress edit isn't thrown away by a stray press.
        setForm(f => {
          if (f) return null
          setOpen(false)
          return f
        })
      }
    }
    document.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_QUICK_LISTS, show)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_QUICK_LISTS, show)
    }
  }, [open])

  // When a form opens, put the cursor in the name field. When the browse view
  // opens with no form, move focus into the panel so the dialog owns the tab
  // order and Escape works without a prior click.
  useEffect(() => {
    if (!open) return
    if (form) nameRef.current?.focus()
    else panelRef.current?.focus()
  }, [open, form])

  if (!open) return null

  const startNew = () => setForm({ id: null, name: '', items: '' })
  const startFromToday = () => setForm({ id: null, name: 'Today’s list', items: todayTexts.join('\n') })
  const startEdit = (list: QuickList) => setForm({ id: list.id, name: list.name, items: list.items.join('\n') })

  const formItems = form ? form.items.split(/\r?\n/).map(l => l.trim()).filter(Boolean) : []
  const canSave = !!form && form.name.trim().length > 0 && formItems.length > 0

  const saveForm = () => {
    if (!form || !canSave) return
    if (form.id) listsStore.update(form.id, { name: form.name, items: formItems })
    else listsStore.add(form.name, formItems)
    setForm(null)
  }

  const applyList = (list: QuickList) => {
    onApply(list.items)
    setJustAdded(list.id)
    // A brief in-panel confirmation, then the modal steps aside so the freshly
    // added tasks are in view. Kept short — it's an acknowledgement, not a wait.
    window.setTimeout(close, 550)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh] sm:pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Quick lists"
    >
      <button
        aria-hidden="true"
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 cursor-default bg-zinc-900/25 dark:bg-black/50 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl shadow-zinc-900/20 dark:shadow-black/50 outline-none animate-[palette-in_120ms_ease-out]"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            {form && (
              <button
                onClick={() => setForm(null)}
                aria-label="Back to lists"
                className="-ml-1 flex items-center rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {form ? (form.id ? 'Edit list' : 'New list') : 'Quick lists'}
            </h2>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="flex items-center rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {form ? (
          /* Create or edit — a name and one task per line. The lines are added
             exactly as typed, so a "#tag", a time, or a trailing "!" works here
             just as it does in the add box. */
          <div className="px-4 py-4 space-y-3">
            <div>
              <label htmlFor="list-name" className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Name
              </label>
              <input
                id="list-name"
                ref={nameRef}
                value={form.name}
                onChange={e => setForm(f => (f ? { ...f, name: e.target.value } : f))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    // Enter from the name field jumps to the lines rather than
                    // saving, since a list without lines isn't worth keeping.
                    ;(e.currentTarget.form?.querySelector('#list-items') as HTMLTextAreaElement | null)?.focus()
                  }
                }}
                placeholder="Weekly review, Trip packing…"
                maxLength={80}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
              />
            </div>
            <div>
              <label htmlFor="list-items" className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Tasks <span className="font-normal text-zinc-400 dark:text-zinc-500">· one per line</span>
              </label>
              <textarea
                id="list-items"
                value={form.items}
                onChange={e => setForm(f => (f ? { ...f, items: e.target.value } : f))}
                rows={6}
                placeholder={'Clear the inbox\nPlan next week #work\nStretch 10m'}
                className="w-full resize-y rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm leading-6 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
              />
              <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                {formItems.length > 0
                  ? `${formItems.length} ${formItems.length === 1 ? 'task' : 'tasks'}`
                  : 'Add at least one task.'}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setForm(null)}
                className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={saveForm}
                disabled={!canSave}
                className="rounded-xl bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {form.id ? 'Save changes' : 'Save list'}
              </button>
            </div>
          </div>
        ) : (
          <div className="max-h-[64vh] overflow-y-auto">
            {lists.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <ListIcon className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">Save a list you add often</p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  A weekly-review checklist, a trip’s packing list, the tasks a new
                  project always needs — name it once, then drop the whole set into
                  any day in a tap.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {lists.map(list => {
                  const confirming = confirmId === list.id
                  const added = justAdded === list.id
                  return (
                    <li key={list.id} className="px-3 py-2.5">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{list.name}</span>
                            <span className="flex-shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
                              {list.items.length}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {list.items.map(itemPreview).join(' · ')}
                          </p>
                        </div>
                        <button
                          onClick={() => applyList(list)}
                          disabled={added}
                          title={`Add these ${list.items.length} tasks to today`}
                          className={`flex-shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                            added
                              ? 'bg-emerald-500 text-white'
                              : 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100'
                          }`}
                        >
                          {added ? (
                            <>
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              Added
                            </>
                          ) : (
                            <>
                              <PlusIcon className="h-3.5 w-3.5" />
                              Add
                            </>
                          )}
                        </button>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3">
                        <button
                          onClick={() => startEdit(list)}
                          className="text-[11px] font-medium text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                        >
                          Edit
                        </button>
                        {confirming ? (
                          <span className="flex items-center gap-2 text-[11px]">
                            <span className="text-zinc-400">Remove?</span>
                            <button
                              onClick={() => { listsStore.remove(list.id); setConfirmId(null) }}
                              className="font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmId(list.id)}
                            className="text-[11px] font-medium text-zinc-400 transition-colors hover:text-rose-600 dark:hover:text-rose-400"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            {/* Footer actions — always reachable, so a first list is one tap from
                the empty state and a new one is one tap from a full list. */}
            <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 dark:border-zinc-800 px-3 py-3">
              <button
                onClick={startNew}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <PlusIcon className="h-4 w-4" />
                New list
              </button>
              {todayTexts.length > 0 && (
                <button
                  onClick={startFromToday}
                  title="Save today’s remaining tasks as a reusable list"
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <ListIcon className="h-4 w-4" />
                  Save today’s list
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
