'use client'

import { type Task, formatDuration } from '@/lib/planner'
import { extractTags } from '@/lib/tags'
import { resolveTagClasses, resolveTagDot, useTagColors } from '@/lib/tagcolors'

// "Where your day goes" — the single "about Xh planned" figure, opened up into
// its parts. Each estimated task's time is attributed to its first #tag (its
// primary context) or to an "untagged" bucket, and the buckets are drawn as one
// slim stacked bar over a small legend. So the plan isn't just "3 hours", it's
// "2h of #work, 45m of #personal" — a glance at where the day is weighted before
// it's spent. The buckets sum to the same total as the planned-time line above,
// so the two always agree.
//
// First tag wins so a task counts once, never split across contexts; a task with
// no estimate isn't weighed at all (the same tasks the line above sums).
//
// It only earns its space when it adds signal: shown when two or more buckets
// carry time. A day whose estimates all sit under one tag (or are all untagged)
// says nothing this bar doesn't, so it stays quiet. Reads no storage of its own —
// the tag colors come from the same shared store every chip on the page uses.

// A bucket key no real tag can collide with (tags always start with a letter),
// used for the estimated tasks that carry none.
const UNTAGGED = '\u0000untagged'

export default function DaySpread({ tasks }: { tasks: Task[] }) {
  const tagColors = useTagColors()

  // Sum each task's estimate into its primary-tag bucket. First tag wins so the
  // buckets never double-count — the segments add up to the planned-time total.
  const byTag = new Map<string, number>()
  for (const t of tasks) {
    if (!t.estimateMin) continue
    const tag = extractTags(t.text)[0] ?? UNTAGGED
    byTag.set(tag, (byTag.get(tag) ?? 0) + t.estimateMin)
  }

  const total = [...byTag.values()].reduce((sum, min) => sum + min, 0)
  // Biggest share first; the untagged bucket always sinks to the end so the real
  // contexts lead.
  const buckets = [...byTag.entries()].sort((a, b) => {
    if (a[0] === UNTAGGED) return 1
    if (b[0] === UNTAGGED) return -1
    return b[1] - a[1]
  })

  // Nothing to weigh, or everything in one bucket — the line above already said
  // it. Stay out of the way.
  if (total === 0 || buckets.length < 2) return null

  const label = (tag: string) => (tag === UNTAGGED ? 'untagged' : `#${tag}`)

  return (
    <div className="space-y-1.5 px-1">
      <div
        className="flex h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
        role="img"
        aria-label={`Planned time by tag: ${buckets
          .map(([tag, min]) => `${label(tag)} ${formatDuration(min)}`)
          .join(', ')}`}
      >
        {buckets.map(([tag, min]) => (
          <div
            key={tag}
            className={`h-full ${
              tag === UNTAGGED ? 'bg-zinc-300 dark:bg-zinc-600' : resolveTagDot(tag, tagColors)
            }`}
            style={{ width: `${(min / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {buckets.map(([tag, min]) => (
          <span key={tag} className="inline-flex items-center gap-1 text-[11px] tabular-nums text-zinc-400">
            {tag === UNTAGGED ? (
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                untagged
              </span>
            ) : (
              <span
                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${resolveTagClasses(tag, tagColors)}`}
              >
                #{tag}
              </span>
            )}
            <span className="text-zinc-500 dark:text-zinc-400">{formatDuration(min)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
