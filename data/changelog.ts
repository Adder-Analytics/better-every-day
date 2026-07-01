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
  {
    day: 16,
    date: '2026-06-23',
    title: 'Tasks that repeat',
    description:
      'Routines no longer need re-typing every morning. Hover a task, hit the repeat icon, and set it to recur every day, on weekdays, or weekly. It returns on schedule with a fresh checkbox each day, never clutters your carryovers, and its history still feeds the weekly chart. Done is now tracked per day, so finishing today’s leaves tomorrow’s waiting.',
    type: 'feature',
  },
  {
    day: 17,
    date: '2026-06-25',
    title: 'Export and import your tasks',
    description:
      'Your tasks have always lived only in this browser. Now you can take them with you. A new "Your data" card lets you export a backup file in one click and import it back on another browser or after a fresh start. Import merges rather than overwrites, so nothing already on your list is lost.',
    type: 'feature',
  },
  {
    day: 18,
    date: '2026-06-26',
    title: 'Type the day, skip the menus',
    description:
      'The add box now reads plain language. End a task with “tomorrow” and it schedules for tomorrow; end with “every day”, “weekdays”, or “weekly” and it becomes a routine — no toggles or menus. A small preview shows the cleaned title and detected schedule before you add, so the phrase is never stripped by surprise. The word “today” is left alone, so real titles stay intact.',
    type: 'feature',
  },
  {
    day: 19,
    date: '2026-06-27',
    title: 'Schedule a task for any day',
    description:
      'Planning is no longer limited to today and tomorrow. Type a day at the end of a task — "call Sam friday", "pay rent in 3 days", "review notes next week" — and it schedules itself, or use the new calendar button on any task to pick a date. Tasks scheduled ahead are grouped under their day ("Tomorrow", "Saturday", "Mon, Jul 6") and drop into Today automatically when their day arrives.',
    type: 'feature',
  },
  {
    day: 20,
    date: '2026-06-28',
    title: 'Estimate how long a task takes',
    description:
      'Give any task a rough time estimate — type it inline ("Write the report 30m", "Deep work 1h 30m") or pick one from the clock menu. A quiet line then shows about how much time the day holds, so you can tell at a glance whether you\'ve planned a realistic day or packed in more than fits. No estimate, no number — it stays out of the way until you ask for it.',
    type: 'feature',
  },
  {
    day: 21,
    date: '2026-06-29',
    title: 'Give a task a time of day',
    description:
      'Tasks can now have a time, turning today into a simple agenda. Type it inline ("Standup 9am", "Lunch 12:30pm", "Call Sam at 2pm") or pick one from the schedule menu. Timed tasks rise to the top in chronological order — and lead the way in Focus mode — while everything untimed keeps its place below, still free to drag. The time shows as a quiet label and never gets in the way of tasks you’d rather leave loose.',
    type: 'feature',
  },
  {
    day: 22,
    date: '2026-06-30',
    title: 'A live line for right now',
    description:
      'Once your day has times on it, a quiet “now” line tracks the real clock and sits between what’s behind you and what’s ahead — so a glance tells you where you are in the day. The next timed task still coming up gets a small “in 25m” hint beside its time. Both stay out of the way until your agenda has something to anchor them.',
    type: 'feature',
  },
  {
    day: 23,
    date: '2026-07-01',
    title: 'Reminders when a task’s time arrives',
    description:
      'Give a task a time of day and the agenda can now nudge you when its moment comes. A bell in the header turns on reminders; the browser asks once, then a quiet notification fires the instant each timed task is due, so you can look away from the clock and still start on time. Finishing, rescheduling, or deleting a task cancels its reminder, and if notifications are blocked the app says so plainly. It only fires while this tab is open — nothing leaves your device.',
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
