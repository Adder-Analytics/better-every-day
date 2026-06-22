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
  {
    day: 4,
    date: '2026-06-12',
    title: 'Double-click to edit any task',
    description:
      'Typo in a task? Double-click the text (or hover and click the pencil) to edit it in place. Press Enter to save, Escape to cancel.',
    type: 'feature',
    emoji: '✏️',
  },
  {
    day: 5,
    date: '2026-06-13',
    title: 'Drag tasks to reorder them',
    description:
      'Prioritize your day by dragging tasks into the order that matters. A subtle grip handle appears on hover — drag it to slot any task exactly where you want it.',
    type: 'feature',
    emoji: '↕️',
  },
  {
    day: 6,
    date: '2026-06-14',
    title: 'See your week at a glance',
    description:
      'A quiet little bar chart now shows how many tasks you finished on each of the last 7 days. It appears once you have some history — a gentle sense of momentum, no streaks to break or guilt to feel.',
    type: 'feature',
    emoji: '📊',
  },
  {
    day: 7,
    date: '2026-06-15',
    title: 'Add a note to any task',
    description:
      'Some tasks need a little more — a link, an address, the three things to remember. Hover a task and tap the note icon to jot details underneath it. Double-click a note to edit, ⌘/Ctrl+Enter to save. Quiet until you need it.',
    type: 'feature',
    emoji: '🗒️',
  },
  {
    day: 8,
    date: '2026-06-16',
    title: 'Finished tasks drop to the bottom',
    description:
      'Check something off and it gently slides below the work that’s still left, so what remains stays right at the top where your focus is. Your order is kept within each group, and you can still drag to reorder. Less scrolling past done things, more momentum.',
    type: 'design',
    emoji: '⬇️',
  },
  {
    day: 9,
    date: '2026-06-17',
    title: 'Focus mode: one task at a time',
    description:
      'A long list can feel like noise. Tap Focus and everything fades away except your next task, front and center. Check it off and the following one slides in. Press Esc or “Exit focus” to see the whole day again. Do the thing, then the next thing.',
    type: 'feature',
    emoji: '🎯',
  },
  {
    day: 10,
    date: '2026-06-18',
    title: 'Your tab counts what’s left',
    description:
      'Keep Better Every Day open in a background tab and it now shows how many tasks you have left right in the tab title — like “(3) Better Every Day”. A quiet glance tells you what remains; finish everything and the count disappears.',
    type: 'feature',
    emoji: '🔢',
  },
  {
    day: 11,
    date: '2026-06-19',
    title: 'Links in notes are clickable',
    description:
      'Drop a URL into a task note — a meeting link, an address, an article to read — and it now turns into a link you can actually tap. Bare www. links work too. The note still double-clicks open for editing; the link just gets out of the way.',
    type: 'feature',
    emoji: '🔗',
  },
  {
    day: 12,
    date: '2026-06-20',
    title: 'A greeting that knows the hour',
    description:
      'Open the planner and it now says hello to the moment — “Good morning,” “Good afternoon,” “Good evening,” or a knowing “Working late?” after ten. A small, warm nod before you get to the day.',
    type: 'design',
    emoji: '👋',
  },
  {
    day: 13,
    date: '2026-06-21',
    title: 'Plan tomorrow tonight',
    description:
      'Flip the new Today / Tomorrow toggle by the add box to line up tasks for tomorrow before you ever start the day. They wait quietly in a “Tomorrow” section — out of today’s way — and slot right into your list the moment the day turns. Close the laptop knowing tomorrow is already set.',
    type: 'feature',
    emoji: '🌙',
  },
  {
    day: 14,
    date: '2026-06-22',
    title: 'Move a task to tomorrow',
    description:
      "Not everything has to happen today. Hover a task and tap the little moon to push it to tomorrow — it leaves today's list, waits in the Tomorrow section, and slides back in when the day turns. Now you can triage in both directions: pull things forward with “Do today,” let them wait with one tap.",
    type: 'feature',
    emoji: '🌙',
  },
  {
    day: 15,
    date: '2026-06-22',
    title: 'Light, dark, or system',
    description:
      'A theme switcher now sits in the header — keep it matched to your device, or force light or dark whenever you want. Your choice is remembered and applied before the page paints, so there is no flash. Along the way, the app now renders in its intended typeface and dropped its decorative emoji for cleaner icons.',
    type: 'feature',
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
