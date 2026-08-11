'use client'

import { tagColor } from '@/lib/tags'

// A glanceable row of the tags in play, each a tap-to-filter toggle with how
// many tasks carry it. Tags live inline in task text, so until now the only way
// to filter by one was to find a task already wearing that chip and click it —
// a context whose tasks were all finished, folded away, or on another day
// couldn't be reached at all. This surfaces every tag in one place, so slicing
// the list to #work (or back to everything) is always one tap.
//
// Purely a view lens over the day, like the chips it mirrors: it changes what's
// shown, never the tasks. Held back until there are at least two tags — a lone
// tag has nothing to switch between, so a bar would only add noise.
export default function TagBar({
  tags,
  activeTag,
  totalCount,
  onSelect,
}: {
  // Each tag and how many tasks carry it, already ordered for display.
  tags: { tag: string; count: number }[]
  activeTag: string | null
  // How many tasks are on the board in all — the count on the "All" chip.
  totalCount: number
  // Set the filter to a tag, or null to clear it. The same activeTag the row
  // chips and the list read, so the two always agree.
  onSelect: (tag: string | null) => void
}) {
  if (tags.length < 2) return null

  return (
    // Scrolls sideways when the tags outrun the width, so a long list never
    // wraps into a tall block or pushes the day down. The scrollbar is hidden;
    // on touch it's a swipe, on a trackpad a horizontal scroll.
    <div
      role="group"
      aria-label="Filter tasks by tag"
      className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* Back to the whole day — pressed while nothing's filtered. */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-pressed={activeTag === null}
        title="Show all tasks"
        className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-[transform,opacity,background-color] duration-100 ease-out active:scale-95 ${
          activeTag === null
            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
            : 'bg-zinc-100 text-zinc-500 hover:text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
      >
        All
        <span className="tabular-nums opacity-60">{totalCount}</span>
      </button>

      {tags.map(({ tag, count }) => {
        const active = tag === activeTag
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onSelect(active ? null : tag)}
            aria-pressed={active}
            title={active ? `Clear #${tag} filter` : `Show only #${tag}`}
            className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tagColor(
              tag
            )} transition-[transform,opacity] duration-100 ease-out hover:opacity-80 active:scale-95 ${
              active ? 'ring-2 ring-inset ring-current/50' : ''
            }`}
          >
            #{tag}
            <span className="tabular-nums opacity-60">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
