'use client'

import { Fragment, type ReactNode } from 'react'

// Matches http(s):// URLs and bare www. links inside note text.
const URL_RE = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi
// Punctuation that's almost always sentence-trailing, not part of the URL.
const TRAILING = /[.,;:!?'")\]]+$/

// Splits note text into plain strings and clickable <a> links. Trailing
// punctuation is peeled back off a match so "see www.x.com." doesn't link
// the period, and bare www. links get an https:// scheme to be followable.
function renderSegments(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = new RegExp(URL_RE.source, 'gi')
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    let url = m[0]
    const trail = TRAILING.exec(url)?.[0] ?? ''
    if (trail) url = url.slice(0, -trail.length)
    if (!url) continue
    if (m.index > last) out.push(text.slice(last, m.index))
    const href = url.toLowerCase().startsWith('http') ? url : `https://${url}`
    out.push(
      <a
        key={m.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        // Don't let following a link also trigger the note's edit-on-dblclick.
        onClick={e => e.stopPropagation()}
        className="underline decoration-1 underline-offset-2 decoration-zinc-300 dark:decoration-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200 break-all"
      >
        {url}
      </a>
    )
    if (trail) out.push(trail)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

type Props = {
  text: string
  className?: string
  onDoubleClick?: () => void
}

// Renders a task note with any URLs turned into clickable links.
export default function NoteText({ text, className, onDoubleClick }: Props) {
  return (
    <p className={className} onDoubleClick={onDoubleClick}>
      {renderSegments(text).map((seg, i) => (
        <Fragment key={i}>{seg}</Fragment>
      ))}
    </p>
  )
}
