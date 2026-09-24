// A chosen color for a #tag. Tags carry a task's context — #work, #home,
// #errands — and until now each was tinted by a fixed hash of its name, so the
// hue was consistent but never yours: #work might land on violet whether or not
// that meant anything. This lets you assign a color a tag actually reads as —
// #health green, #urgent rose — while any tag you leave alone keeps its hashed
// default, so nothing changes until you choose.
//
// The choice is a display layer, exactly like the theme and the clock format: it
// changes how a tag is tinted, never the task text a tag lives in. It's kept in
// its own `bed-tagcolors` key (a map of tag → color), separate from your tasks,
// so a task export/import doesn't carry it and the stored task shape is
// untouched. A tiny external store (mirroring lib/theme and lib/timeformat) lets
// every chip on screen re-tint at once via useSyncExternalStore, and syncs the
// choice across tabs.

import { useSyncExternalStore } from 'react'
import { tagColor } from '@/lib/tags'

export type TagColorKey =
  | 'rose'
  | 'orange'
  | 'amber'
  | 'emerald'
  | 'teal'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'fuchsia'
  | 'slate'

// The pickable colors, in the order the picker shows them. `chip` is the
// text+background tint a tag pill wears (the same shape as the hashed defaults in
// lib/tags, so a recolored tag reads identically to an auto one); `dot` is the
// solid swatch the picker draws. Full class strings, literal, so Tailwind's
// scanner keeps every one.
export const TAG_COLOR_OPTIONS: { key: TagColorKey; label: string; chip: string; dot: string }[] = [
  { key: 'rose', label: 'Rose', chip: 'text-rose-600 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/50', dot: 'bg-rose-500' },
  { key: 'orange', label: 'Orange', chip: 'text-orange-600 bg-orange-50 dark:text-orange-300 dark:bg-orange-950/50', dot: 'bg-orange-500' },
  { key: 'amber', label: 'Amber', chip: 'text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/50', dot: 'bg-amber-500' },
  { key: 'emerald', label: 'Emerald', chip: 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/50', dot: 'bg-emerald-500' },
  { key: 'teal', label: 'Teal', chip: 'text-teal-600 bg-teal-50 dark:text-teal-300 dark:bg-teal-950/50', dot: 'bg-teal-500' },
  { key: 'sky', label: 'Sky', chip: 'text-sky-600 bg-sky-50 dark:text-sky-300 dark:bg-sky-950/50', dot: 'bg-sky-500' },
  { key: 'blue', label: 'Blue', chip: 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/50', dot: 'bg-blue-500' },
  { key: 'indigo', label: 'Indigo', chip: 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/50', dot: 'bg-indigo-500' },
  { key: 'violet', label: 'Violet', chip: 'text-violet-600 bg-violet-50 dark:text-violet-300 dark:bg-violet-950/50', dot: 'bg-violet-500' },
  { key: 'fuchsia', label: 'Fuchsia', chip: 'text-fuchsia-600 bg-fuchsia-50 dark:text-fuchsia-300 dark:bg-fuchsia-950/50', dot: 'bg-fuchsia-500' },
  { key: 'slate', label: 'Slate', chip: 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800/60', dot: 'bg-slate-500' },
]

const CHIP_BY_KEY = new Map(TAG_COLOR_OPTIONS.map(o => [o.key, o.chip]))

export function isTagColorKey(v: unknown): v is TagColorKey {
  return typeof v === 'string' && CHIP_BY_KEY.has(v as TagColorKey)
}

const STORAGE_KEY = 'bed-tagcolors'

// A stable empty map for the server/first-paint snapshot, so every tag renders
// its hashed default until the client reads the saved choices just after
// hydration — no server/client mismatch, the same way the theme is applied.
const EMPTY: Record<string, TagColorKey> = Object.freeze({})

// The parsed map, cached so getSnapshot hands back a stable reference between
// changes (useSyncExternalStore compares snapshots by identity). Invalidated on a
// cross-tab write and replaced on a local one, so a new reference signals a real
// change and nothing else does.
let cache: Record<string, TagColorKey> | null = null

function load(): Record<string, TagColorKey> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const out: Record<string, TagColorKey> = {}
    for (const [tag, key] of Object.entries(parsed)) {
      if (isTagColorKey(key)) out[tag] = key
    }
    return out
  } catch {
    return {}
  }
}

const listeners = new Set<() => void>()

export const tagColorStore = {
  subscribe(cb: () => void) {
    listeners.add(cb)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        cache = null
        cb()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(cb)
      window.removeEventListener('storage', onStorage)
    }
  },
  getSnapshot(): Record<string, TagColorKey> {
    if (cache === null) cache = load()
    return cache
  },
  getServerSnapshot(): Record<string, TagColorKey> {
    return EMPTY
  },
  // The color a tag is set to, or undefined when it rides its hashed default.
  get(tag: string): TagColorKey | undefined {
    return (cache ?? (cache = load()))[tag.toLowerCase()]
  },
  // Assign a tag a color, or clear it (null) back to the hashed default. A new
  // map object is stored so the snapshot identity changes and screens re-tint.
  set(tag: string, key: TagColorKey | null) {
    const t = tag.toLowerCase()
    const cur = cache ?? load()
    const next = { ...cur }
    if (key === null) delete next[t]
    else next[t] = key
    cache = next
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
    listeners.forEach(l => l())
  },
}

// The color classes a tag pill should wear, given the current choices: the chosen
// color when the tag has one, otherwise its hashed default. Pure, so it's safe to
// call inside a render loop once the map has been read at the top with
// useTagColors — no per-tag hook needed.
export function resolveTagClasses(tag: string, map: Record<string, TagColorKey>): string {
  const key = map[tag.toLowerCase()]
  const chip = key ? CHIP_BY_KEY.get(key) : undefined
  return chip ?? tagColor(tag)
}

// The render-time hook: an empty map on the server and the first client paint,
// then the saved choices — so a recolored tag switches just after hydration with
// no mismatch. Read once at the top of a component, then pass the map to
// resolveTagClasses for each tag it draws.
export function useTagColors(): Record<string, TagColorKey> {
  return useSyncExternalStore(tagColorStore.subscribe, tagColorStore.getSnapshot, tagColorStore.getServerSnapshot)
}
