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
