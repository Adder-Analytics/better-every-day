// Shared link detection for the two places a URL can hide in what a user types:
// a task's title and its note. Kept in one module so the title's link chips and
// the note's inline links read the same string the same way.

// http(s):// URLs and bare www. links. Stops at whitespace or a '<'.
const URL_RE = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi
// Punctuation that's almost always sentence-trailing, not part of the URL.
const TRAILING = /[.,;:!?'")\]]+$/

// A run of a piece of text: either plain text, or a link with the href to
// follow (`href`) and the exact matched string (`text`) as its visible label.
export type LinkSegment =
  | { link: false; text: string }
  | { link: true; href: string; text: string }

// Split text into plain runs and link runs. A bare www. link is given an
// https:// scheme so it's followable; trailing sentence punctuation is peeled
// off the match and kept as plain text, so "see www.x.com." doesn't link the
// period. Adjacent plain runs are merged, so a consumer can map straight over
// the result.
export function splitLinks(text: string): LinkSegment[] {
  const out: LinkSegment[] = []
  const re = new RegExp(URL_RE.source, 'gi')
  const pushText = (s: string) => {
    if (!s) return
    const prev = out[out.length - 1]
    if (prev && !prev.link) prev.text += s
    else out.push({ link: false, text: s })
  }
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    let url = m[0]
    const trail = TRAILING.exec(url)?.[0] ?? ''
    if (trail) url = url.slice(0, -trail.length)
    if (!url) continue
    if (m.index > last) pushText(text.slice(last, m.index))
    const href = url.toLowerCase().startsWith('http') ? url : `https://${url}`
    out.push({ link: true, href, text: url })
    if (trail) pushText(trail)
    last = m.index + m[0].length
  }
  if (last < text.length) pushText(text.slice(last))
  return out
}

// Whether the text holds at least one link — a cheap guard before splitting, so
// the common linkless title takes no extra work.
export function hasLink(text: string): boolean {
  return new RegExp(URL_RE.source, 'i').test(text)
}

// A short, readable label for a link: its host without a leading "www." (so a
// title chip reads "github.com", not the whole path). Falls back to the raw
// URL if it can't be parsed.
export function linkHostname(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, '')
  } catch {
    return href
  }
}
