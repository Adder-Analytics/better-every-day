// One line for the day's focus — the single thing you most want to get done, or
// keep in view. Forward-looking, and the mirror of the day note (which is where
// a day's leavings go once it's over): the focus is set in the morning and sits
// at the top all day. Stored apart from the planner under its own key, so it
// never touches task data, and keyed by date so each day gets its own.

const STORAGE_KEY = 'bed-dayfocus'
const FOCUS_VERSION = 1

type DayFocusData = {
  version: typeof FOCUS_VERSION
  focus: Record<string, string> // date (YYYY-MM-DD) → focus text
}

// Read the day-focus map (date → text). Tolerant of anything malformed — a bad
// blob reads as empty rather than throwing — and skips empty strings so the
// stored shape stays clean. Reads localStorage, so it's client-only, like the
// planner loader.
export function loadDayFocus(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    const focus = (parsed as Record<string, unknown>).focus
    if (typeof focus !== 'object' || focus === null) return {}
    const out: Record<string, string> = {}
    for (const [date, text] of Object.entries(focus as Record<string, unknown>)) {
      if (typeof text === 'string' && text) out[date] = text
    }
    return out
  } catch {
    return {}
  }
}

function saveDayFocus(focus: Record<string, string>): void {
  try {
    const data: DayFocusData = { version: FOCUS_VERSION, focus }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

// Set the focus for one day, or clear it when the text is empty, and persist.
// Collapses whitespace (a focus is a single line) and returns the updated map so
// the caller can hold it in state.
export function setDayFocus(
  focus: Record<string, string>,
  date: string,
  text: string
): Record<string, string> {
  const next = { ...focus }
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned) next[date] = cleaned
  else delete next[date]
  saveDayFocus(next)
  return next
}
