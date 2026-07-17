// A short, freeform note kept for a single day — a place for the things a day
// leaves behind that aren't tasks: how it went, a number to remember, a line
// worth keeping. Stored apart from the planner under its own key, so it never
// touches task data, and keyed by date so each day gets its own page and the
// History view can look back on them.

const STORAGE_KEY = 'bed-daynotes'
const NOTES_VERSION = 1

type DayNotesData = {
  version: typeof NOTES_VERSION
  notes: Record<string, string> // date (YYYY-MM-DD) → note text
}

// Read the day-notes map (date → text). Tolerant of anything malformed — a bad
// blob just reads as empty rather than throwing — and skips empty strings so the
// stored shape stays clean. Reads localStorage, so it's client-only, like the
// planner loader.
export function loadDayNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    const notes = (parsed as Record<string, unknown>).notes
    if (typeof notes !== 'object' || notes === null) return {}
    const out: Record<string, string> = {}
    for (const [date, text] of Object.entries(notes as Record<string, unknown>)) {
      if (typeof text === 'string' && text) out[date] = text
    }
    return out
  } catch {
    return {}
  }
}

function saveDayNotes(notes: Record<string, string>): void {
  try {
    const data: DayNotesData = { version: NOTES_VERSION, notes }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

// Set the note for one day, or clear it when the text is empty, and persist.
// Returns the updated map so the caller can hold it in state.
export function setDayNote(
  notes: Record<string, string>,
  date: string,
  text: string
): Record<string, string> {
  const next = { ...notes }
  const trimmed = text.trim()
  if (trimmed) next[date] = trimmed
  else delete next[date]
  saveDayNotes(next)
  return next
}
