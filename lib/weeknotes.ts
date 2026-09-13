// A short, freeform reflection kept for a single week — the weekly review's
// counterpart to the per-day note: a place to write how the week went, what to
// carry forward, or a line worth keeping before the next week starts. Stored
// apart from the planner under its own key, so it never touches task data, and
// keyed by the week's Sunday (YYYY-MM-DD) so each week gets its own.

const STORAGE_KEY = 'bed-weeknotes'
const NOTES_VERSION = 1

type WeekNotesData = {
  version: typeof NOTES_VERSION
  notes: Record<string, string> // week start (YYYY-MM-DD) → note text
}

// Read the week-notes map (week start → text). Tolerant of anything malformed —
// a bad blob reads as empty rather than throwing — and skips empty strings so
// the stored shape stays clean. Reads localStorage, so it's client-only, like
// the planner loader.
export function loadWeekNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    const notes = (parsed as Record<string, unknown>).notes
    if (typeof notes !== 'object' || notes === null) return {}
    const out: Record<string, string> = {}
    for (const [week, text] of Object.entries(notes as Record<string, unknown>)) {
      if (typeof text === 'string' && text) out[week] = text
    }
    return out
  } catch {
    return {}
  }
}

function saveWeekNotes(notes: Record<string, string>): void {
  try {
    const data: WeekNotesData = { version: NOTES_VERSION, notes }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

// Set the note for one week, or clear it when the text is empty, and persist.
// Returns the updated map so the caller can hold it in state.
export function setWeekNote(
  notes: Record<string, string>,
  weekStart: string,
  text: string
): Record<string, string> {
  const next = { ...notes }
  const trimmed = text.trim()
  if (trimmed) next[weekStart] = trimmed
  else delete next[weekStart]
  saveWeekNotes(next)
  return next
}
