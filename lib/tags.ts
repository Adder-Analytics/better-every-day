// Tags let a task carry a context — #work, #home, #errands — so a busy list can
// be sliced to one area at a time. They live *inline in the task's own text*
// (Bear/Obsidian-style), which is deliberate: nothing new is stored, every tag
// is editable exactly where the task is, and old backups keep importing cleanly.
// The planner derives the tag chips and the filter from the text at render time.

// A hashtag is a '#' at a word boundary followed by a letter and then letters,
// digits, underscores or hyphens (up to 30). Requiring a leading letter keeps
// "#1", issue "#42" and "C#" from being read as tags; the boundary group keeps
// "id#4" (mid-word) out too. Global, so matchAll/replace walk every occurrence.
const TAG_RE = /(^|\s)#([a-zA-Z][\w-]{0,29})/g

// Every distinct tag in a string, lowercased and in first-seen order. The single
// source of truth for both the chips a task shows and whether it matches a
// filter, so the two can never disagree.
export function extractTags(text: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const m of text.matchAll(TAG_RE)) {
    const tag = m[2].toLowerCase()
    if (!seen.has(tag)) {
      seen.add(tag)
      out.push(tag)
    }
  }
  return out
}

// The task text with its hashtags removed for display, whitespace tidied. Falls
// back to the original when stripping would leave nothing (a task typed as just
// "#idea"), so a row's title is never blank.
export function stripTags(text: string): string {
  const stripped = text
    .replace(TAG_RE, (_m, pre: string) => pre) // drop "#tag", keep its leading space
    .replace(/\s{2,}/g, ' ')
    .trim()
  return stripped || text.trim()
}

// Whether a task's text carries a given (already-lowercased) tag.
export function hasTag(text: string, tag: string): boolean {
  return extractTags(text).includes(tag)
}

// A small, fixed set of tinted chip styles — legible in light and dark, in the
// app's muted palette. A tag always lands on the same color (hashed by name), so
// #work is the same hue everywhere it appears. Full class strings so Tailwind's
// scanner can see them.
const TAG_PALETTE = [
  'text-rose-600 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/50',
  'text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/50',
  'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/50',
  'text-teal-600 bg-teal-50 dark:text-teal-300 dark:bg-teal-950/50',
  'text-sky-600 bg-sky-50 dark:text-sky-300 dark:bg-sky-950/50',
  'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/50',
  'text-violet-600 bg-violet-50 dark:text-violet-300 dark:bg-violet-950/50',
  'text-fuchsia-600 bg-fuchsia-50 dark:text-fuchsia-300 dark:bg-fuchsia-950/50',
]

export function tagColor(tag: string): string {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0
  return TAG_PALETTE[h % TAG_PALETTE.length]
}

// Solid swatches parallel to TAG_PALETTE — same order, so the same tag lands on
// the same hue as its tinted chip. For the places a tag needs a filled block
// rather than a pill (the "where your day goes" bar). bg-*-500 reads on both
// themes; full class strings so Tailwind's scanner keeps every one.
const TAG_DOT_PALETTE = [
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-fuchsia-500',
]

// The solid swatch for a tag's hashed default color — the fill counterpart to
// tagColor, hashed identically so a tag's block matches its chip's hue.
export function tagDot(tag: string): string {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0
  return TAG_DOT_PALETTE[h % TAG_DOT_PALETTE.length]
}

// A tag name as typed into a rename box, cleaned to what a task would carry: a
// leading '#' dropped, lowercased. Null when it isn't a valid tag (it must start
// with a letter, then letters, digits, '_' or '-', up to 30), so the caller can
// refuse it before touching any task.
export function normalizeTagName(input: string): string | null {
  const name = input.trim().replace(/^#/, '').toLowerCase()
  return /^[a-z][\w-]{0,29}$/.test(name) ? name : null
}

// Rewrite one tag to another inside a task's text. Each "#from" (any case)
// becomes "#to"; when the text already carries "#to", the "#from" is dropped
// instead, so a merge never leaves the same tag twice. Text without the tag
// comes back unchanged (the same string), so callers can skip untouched tasks.
export function renameTagInText(text: string, from: string, to: string): string {
  const tags = extractTags(text)
  if (!tags.includes(from) || from === to) return text
  const merge = tags.includes(to)
  const out = text.replace(TAG_RE, (m, pre: string, name: string) =>
    name.toLowerCase() === from ? (merge ? pre : `${pre}#${to}`) : m
  )
  return merge ? out.replace(/ {2,}/g, ' ').trim() : out
}
