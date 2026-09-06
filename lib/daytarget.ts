// A per-day "wrap up by" time — the hour you want the day to wind down, kept so
// the plan can be read against a real stop time (end of the workday, when you
// want to be off screens, bedtime). Forward-looking like the day focus, and
// stored the same way: apart from the planner under its own key, so it never
// touches task data, and keyed by date so each day gets its own. The value is
// minutes since local midnight (0–1439), the same unit a task's time of day uses.

const STORAGE_KEY = 'bed-daytarget'
const TARGET_VERSION = 1

type DayTargetData = {
  version: typeof TARGET_VERSION
  target: Record<string, number> // date (YYYY-MM-DD) → minutes since midnight
}

function isValidMin(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 1439
}

// Read the day-target map (date → minutes). Tolerant of anything malformed — a
// bad blob reads as empty rather than throwing — and drops out-of-range values
// so the stored shape stays clean. Reads localStorage, so it's client-only,
// like the planner loader.
export function loadDayTarget(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    const target = (parsed as Record<string, unknown>).target
    if (typeof target !== 'object' || target === null) return {}
    const out: Record<string, number> = {}
    for (const [date, min] of Object.entries(target as Record<string, unknown>)) {
      if (isValidMin(min)) out[date] = min
    }
    return out
  } catch {
    return {}
  }
}

function saveDayTarget(target: Record<string, number>): void {
  try {
    const data: DayTargetData = { version: TARGET_VERSION, target }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

// Set the wrap-up time for one day, or clear it when `min` is null, and persist.
// Returns the updated map so the caller can hold it in state.
export function setDayTarget(
  target: Record<string, number>,
  date: string,
  min: number | null
): Record<string, number> {
  const next = { ...target }
  if (min !== null && isValidMin(min)) next[date] = min
  else delete next[date]
  saveDayTarget(next)
  return next
}
