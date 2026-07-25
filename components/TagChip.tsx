'use client'

import { tagColor } from '@/lib/tags'

// One tag, as a small tinted pill reading "#work". Clickable (a filter toggle)
// when `onClick` is given, otherwise a static label — same shape either way so a
// row, the add preview, and the filter bar all read as one system. `active`
// marks the tag currently being filtered by; `dimmed` quiets it on a finished
// task, matching the other pills on the row.
export default function TagChip({
  tag,
  onClick,
  active = false,
  dimmed = false,
}: {
  tag: string
  onClick?: (tag: string) => void
  active?: boolean
  dimmed?: boolean
}) {
  const base = `inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${tagColor(tag)} ${
    active ? 'ring-1 ring-inset ring-current/60' : ''
  } ${dimmed ? 'opacity-60' : ''}`

  if (!onClick) {
    return <span className={base}>#{tag}</span>
  }
  return (
    <button
      type="button"
      onClick={() => onClick(tag)}
      aria-pressed={active}
      title={active ? `Clear #${tag} filter` : `Show only #${tag}`}
      // Keyboard-driven actions aside, a filter tap wants instant feedback:
      // a small press-scale and a quiet hover fade, transform/opacity only.
      className={`${base} transition-[transform,opacity] duration-100 ease-out hover:opacity-80 active:scale-95`}
    >
      #{tag}
    </button>
  )
}
