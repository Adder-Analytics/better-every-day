// Reading a pasted list. Lists copied from a notes app, a doc, an email, or a
// Markdown file arrive dressed in list syntax: "- [ ] Call Sam", "1. Email
// Jo", "• Groceries". Typed into the add box as-is, every task would keep that
// clutter in its name. This turns each line back into what the person meant:
// the marker is dropped, a checked box ("- [x]", "☑") marks the item as already
// done, and a heading over the list ("Monday", "To do:") is left out.
//
// The app's own copied formats read back cleanly too. "Copy today's plan"
// writes "- [ ] 9 AM · Write report #work (1h)", which becomes "Write report
// #work at 9 AM for 1h" so the quick-add parser restores its time and estimate;
// a standup line's trailing "(done)" marks it done.

export type PastedItem = { text: string; done: boolean }

// A leading bullet, number, or letter: "-", "*", "+", "•", "◦", "▪", "‣", "–",
// "1.", "2)", "(3)", "a.", "b)". Letters are lowercase only, so "A. Smith"
// stays, and a space must follow, so "-5 degrees" or "2024 plans" do too.
const MARKER_RE = /^(?:[-*+•◦▪▫‣⁃–—·]|\(?\d{1,3}[.)]|\(?[a-z][.)])\s+/
// A checkbox, with or without a bullet before it: "[ ]", "[x]", "[X]", "☐", "☑", "☒", "✓", "✔".
const BOX_RE = /^(?:\[( |x|X)\]|([☐☑☒✓✔]))\s*/
// The time a copied plan leads with: "9 AM · ", "9:30 PM · ", "09:00 · ".
const LEAD_TIME_RE = /^(\d{1,2}(?::\d{2})?(?:\s?[AaPp][Mm])?)\s+·\s+/
// The estimate a copied plan trails with: "(1h)", "(45m)", "(1h 30m)".
const TRAIL_ESTIMATE_RE = /\s+\((\d+h(?:\s\d+m)?|\d+m)\)$/
const TRAIL_DONE_RE = /\s+\(done\)$/i

type Line = { text: string; done: boolean; marked: boolean }

function readLine(raw: string): Line {
  let text = raw.trim()
  let marked = false
  let done = false
  const marker = text.match(MARKER_RE)
  if (marker) {
    text = text.slice(marker[0].length)
    marked = true
  }
  const box = text.match(BOX_RE)
  if (box) {
    text = text.slice(box[0].length)
    marked = true
    done = box[1] ? box[1] !== ' ' : box[2] !== '☐'
  }
  if (!marked) return { text, done, marked }
  // Only a list item gets the copied-plan treatment, so a plain typed line
  // like "Read (done)" or "9 · 3" is never rewritten.
  if (TRAIL_DONE_RE.test(text)) {
    text = text.replace(TRAIL_DONE_RE, '')
    done = true
  }
  let suffix = ''
  const time = text.match(LEAD_TIME_RE)
  if (time) {
    text = text.slice(time[0].length)
    suffix += ` at ${time[1]}`
  }
  const est = text.match(TRAIL_ESTIMATE_RE)
  if (est) {
    text = text.slice(0, est.index)
    suffix += ` for ${est[1]}`
  }
  text = text.trim()
  return { text: text ? text + suffix : '', done, marked }
}

// Each non-empty line of the add box as one item. Plain lines pass through
// trimmed, exactly as before. Only when the text contains list items does a
// heading get skipped: an unmarked line ending in ":" or written as a Markdown
// heading ("## Errands"), or one that starts a block (the first line, or the
// line after a blank one) with list items right below it.
export function readPastedLines(raw: string): PastedItem[] {
  const rows = raw.split(/\r?\n/)
  const lines = rows.map(r => (r.trim() ? readLine(r) : null))
  const isList = lines.some(l => l?.marked)
  const items: PastedItem[] = []
  lines.forEach((line, i) => {
    if (!line || !line.text) return
    if (isList && !line.marked) {
      if (/:$/.test(line.text) || /^#{1,6}\s/.test(line.text)) return
      const startsBlock = i === 0 || lines[i - 1] === null
      const next = lines.slice(i + 1).find(l => l !== null)
      if (startsBlock && next?.marked) return
    }
    items.push({ text: line.text, done: line.done })
  })
  return items
}
