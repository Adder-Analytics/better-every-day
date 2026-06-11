export type ChangeType = 'feature' | 'design' | 'fix' | 'speed' | 'content'

export type ChangelogEntry = {
  day: number
  date: string // YYYY-MM-DD, the date it shipped
  title: string // short and OG-card friendly, e.g. "Now with dark mode"
  description: string
  type?: ChangeType
  emoji?: string
}

// Append-only: new entries go at the END of this array, one per day.
// Day numbers must be strictly sequential (1, 2, 3, ...) — never edit past entries.
export const changelog: ChangelogEntry[] = [
  {
    day: 1,
    date: '2026-06-09',
    title: 'Better Every Day is born',
    description:
      "A tiny daily planner launches: plan today, check things off, carry over what didn't happen. From here on, one improvement ships every single day.",
    type: 'feature',
    emoji: '🌱',
  },
  {
    day: 2,
    date: '2026-06-10',
    title: 'Confetti when you finish everything',
    description:
      'Check off your last task and the app celebrates with you — a burst of confetti, then back to quiet. You earned it.',
    type: 'design',
    emoji: '🎊',
  },
  {
    day: 3,
    date: '2026-06-11',
    title: 'Press n to add a task',
    description:
      'Hit n from anywhere on the page and the task input snaps into focus — no hunting for the box. Keyboard shortcut people will feel right at home.',
    type: 'feature',
    emoji: '⌨️',
  },
]

if (process.env.NODE_ENV !== 'production') {
  changelog.forEach((entry, i) => {
    if (entry.day !== i + 1) {
      throw new Error(
        `Changelog day numbers must be sequential: entry at index ${i} has day ${entry.day}, expected ${i + 1}`
      )
    }
  })
}

export function latestEntry(): ChangelogEntry {
  return changelog[changelog.length - 1]
}

export function currentDay(): number {
  return latestEntry().day
}
