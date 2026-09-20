// The unsent contents of the add box, kept so a half-typed task — especially a
// pasted or Shift+Enter'd multi-line brain dump — survives an accidental reload
// or a trip to another page and back, instead of being lost. Stored apart from
// the planner under its own key, so it never touches task data, and cleared the
// moment the draft is added or logged. A remembered draft also carries the
// Today/Tomorrow/Someday it was being written for, so the box comes back exactly
// as it was left.

const STORAGE_KEY = 'bed-draft'
const DRAFT_VERSION = 1

export type DraftFor = 'today' | 'tomorrow' | 'someday'

export type Draft = { text: string; for: DraftFor }

function isDraftFor(value: unknown): value is DraftFor {
  return value === 'today' || value === 'tomorrow' || value === 'someday'
}

// Read the saved draft, or null when there's nothing worth restoring. Tolerant
// of anything malformed — a bad blob reads as null rather than throwing — and
// treats a blank draft as none. Reads localStorage, so it's client-only, like
// the planner loader.
export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const rec = parsed as Record<string, unknown>
    const text = typeof rec.text === 'string' ? rec.text : ''
    if (!text.trim()) return null
    return { text, for: isDraftFor(rec.for) ? rec.for : 'today' }
  } catch {
    return null
  }
}

// Mirror the current draft to storage, or clear it when the text is blank — so
// the stored draft always matches what's unsent, and nothing lingers once the
// box is empty (which is what an add or log leaves behind). Client-only, and
// silent if storage is unavailable.
export function saveDraft(text: string, draftFor: DraftFor): void {
  try {
    if (!text.trim()) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: DRAFT_VERSION, text, for: draftFor }))
  } catch {}
}
