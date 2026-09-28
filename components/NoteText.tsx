'use client'

import { Fragment } from 'react'
import { splitLinks } from '@/lib/links'

type Props = {
  text: string
  className?: string
  onDoubleClick?: () => void
}

// Renders a task note with any URLs turned into clickable links. The link
// detection is shared with a task's title (see lib/links), so both read a URL
// the same way.
export default function NoteText({ text, className, onDoubleClick }: Props) {
  return (
    <p className={className} onDoubleClick={onDoubleClick}>
      {splitLinks(text).map((seg, i) =>
        seg.link ? (
          <a
            key={i}
            href={seg.href}
            target="_blank"
            rel="noopener noreferrer"
            // Don't let following a link also trigger the note's edit-on-dblclick.
            onClick={e => e.stopPropagation()}
            className="underline decoration-1 underline-offset-2 decoration-zinc-300 dark:decoration-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200 break-all"
          >
            {seg.text}
          </a>
        ) : (
          <Fragment key={i}>{seg.text}</Fragment>
        )
      )}
    </p>
  )
}
