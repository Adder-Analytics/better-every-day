export type ChangeType = 'feature' | 'design' | 'fix' | 'speed' | 'content'

export type ChangelogEntry = {
  day: number
  date: string // YYYY-MM-DD, the date it shipped
  title: string // short and OG-card friendly
  description: string // a plain, factual note of what changed
  type?: ChangeType
}

// Append-only: new entries go at the END of this array, one per day.
// Day numbers must be strictly sequential (1, 2, 3, ...).
export const changelog: ChangelogEntry[] = [
  {
    day: 1,
    date: '2026-06-09',
    title: 'Better Every Day is born',
    description:
      'The initial planner: add tasks for today, check them off, and carry unfinished ones over to the next day. Everything is stored locally in the browser.',
    type: 'feature',
  },
  {
    day: 2,
    date: '2026-06-10',
    title: 'Confetti when you finish everything',
    description: 'Checking off the last task of the day triggers a brief confetti burst.',
    type: 'design',
  },
  {
    day: 3,
    date: '2026-06-11',
    title: 'Press n to add a task',
    description: 'Pressing n anywhere on the page focuses the task input.',
    type: 'feature',
  },
  {
    day: 4,
    date: '2026-06-12',
    title: 'Double-click to edit any task',
    description:
      'Tasks can be edited in place — double-click the text or use the pencil icon. Enter saves, Escape cancels.',
    type: 'feature',
  },
  {
    day: 5,
    date: '2026-06-13',
    title: 'Drag tasks to reorder them',
    description: 'Tasks can be reordered by dragging the grip handle that appears on hover.',
    type: 'feature',
  },
  {
    day: 6,
    date: '2026-06-14',
    title: 'See your week at a glance',
    description:
      'A small bar chart shows how many tasks were completed on each of the last 7 days. It appears once there is any history.',
    type: 'feature',
  },
  {
    day: 7,
    date: '2026-06-15',
    title: 'Add a note to any task',
    description:
      'Tasks can carry a free-text note, added from the note icon and edited with a double-click. Cmd/Ctrl+Enter saves.',
    type: 'feature',
  },
  {
    day: 8,
    date: '2026-06-16',
    title: 'Finished tasks drop to the bottom',
    description:
      'Completed tasks now sort below the ones still to do, keeping relative order within each group. Drag-to-reorder still works.',
    type: 'design',
  },
  {
    day: 9,
    date: '2026-06-17',
    title: 'Focus mode: one task at a time',
    description:
      'Focus mode shows a single task front and center; checking it off advances to the next. Esc or "Exit focus" returns to the full list.',
    type: 'feature',
  },
  {
    day: 10,
    date: '2026-06-18',
    title: 'Your tab counts what’s left',
    description:
      'The tab title shows how many tasks remain, like "(3) Better Every Day". The count disappears when everything is done.',
    type: 'feature',
  },
  {
    day: 11,
    date: '2026-06-19',
    title: 'Links in notes are clickable',
    description: 'URLs in task notes (including bare www. links) now render as clickable links.',
    type: 'feature',
  },
  {
    day: 12,
    date: '2026-06-20',
    title: 'A greeting that knows the hour',
    description: 'The header greeting now follows the time of day.',
    type: 'design',
  },
  {
    day: 13,
    date: '2026-06-21',
    title: 'Plan tomorrow tonight',
    description:
      'A Today/Tomorrow toggle on the add box queues tasks for tomorrow. They wait in their own section and move into today when the date changes.',
    type: 'feature',
  },
  {
    day: 14,
    date: '2026-06-22',
    title: 'Move a task to tomorrow',
    description:
      'A task can be pushed to tomorrow from its row, complementing the existing "Do today" action on carryovers.',
    type: 'feature',
  },
  {
    day: 15,
    date: '2026-06-22',
    title: 'Light, dark, or system',
    description:
      'A theme switcher in the header offers light, dark, or system, applied before first paint so there is no flash. The app also now renders in its intended typeface.',
    type: 'feature',
  },
  {
    day: 16,
    date: '2026-06-23',
    title: 'Tasks that repeat',
    description:
      'Tasks can repeat every day, on weekdays, or weekly. Routines return each due day, with completion tracked per day, and never clutter carryovers.',
    type: 'feature',
  },
  {
    day: 17,
    date: '2026-06-25',
    title: 'Export and import your tasks',
    description:
      'A "Your data" card exports tasks to a JSON backup file and imports one back. Imports merge by id rather than overwrite.',
    type: 'feature',
  },
  {
    day: 18,
    date: '2026-06-26',
    title: 'Type the day, skip the menus',
    description:
      'The add box parses trailing phrases — "tomorrow", "every day", "weekdays", "weekly" — and shows a preview of what will be created. The word "today" is left alone.',
    type: 'feature',
  },
  {
    day: 19,
    date: '2026-06-27',
    title: 'Schedule a task for any day',
    description:
      'Tasks can be scheduled for any date, typed ("friday", "in 3 days", "next week") or picked from a calendar menu. Scheduled tasks group under their day and move into today when it arrives.',
    type: 'feature',
  },
  {
    day: 20,
    date: '2026-06-28',
    title: 'Estimate how long a task takes',
    description:
      'Tasks can carry a rough time estimate, typed inline ("30m", "1h 30m") or picked from the clock menu. A summary line shows total time planned for the day.',
    type: 'feature',
  },
  {
    day: 21,
    date: '2026-06-29',
    title: 'Give a task a time of day',
    description:
      'Tasks can have a time of day, typed inline ("9am", "at 14:00") or set from the schedule menu. Timed tasks sort to the top chronologically and lead Focus mode.',
    type: 'feature',
  },
  {
    day: 22,
    date: '2026-06-30',
    title: 'A live line for right now',
    description:
      'A "now" line tracks the clock and sits in the agenda between past and upcoming timed tasks. The next timed task shows how soon it starts.',
    type: 'feature',
  },
  {
    day: 23,
    date: '2026-07-01',
    title: 'Reminders when a task’s time arrives',
    description:
      'Optional browser notifications fire when a timed task is due, toggled by a bell in the header. They only fire while the tab is open; nothing leaves the device.',
    type: 'feature',
  },
  {
    day: 24,
    date: '2026-07-02',
    title: 'Install it, and use it by touch',
    description:
      'The planner is now an installable web app with a proper icon set, manifest, and theme color. On touch screens, task actions moved from hover-only icons (which never appeared there) to a visible menu on each task. Also: the weekly chart’s bars, which had been collapsing to zero height, render again; the changelog became a plain log; and the header lost its duplicate day counter.',
    type: 'feature',
  },
  {
    day: 25,
    date: '2026-07-03',
    title: 'Look back at what you got done',
    description:
      'A History page lists completed tasks from the last 30 days, grouped by day with the newest first. Routines appear on each day they were finished. It opens from the count on the weekly activity card.',
    type: 'feature',
  },
  {
    day: 26,
    date: '2026-07-04',
    title: 'Streaks for routines',
    description:
      'Repeating tasks now show their current streak once it reaches two — consecutive due days completed, counted by each routine’s own cadence, so a weekend never breaks a weekday streak and an unfinished today never breaks anything. The History page lists every live streak alongside the routine’s best-ever run. Routine completion logs are no longer trimmed to 30 days, so long streaks survive.',
    type: 'feature',
  },
  {
    day: 27,
    date: '2026-07-05',
    title: 'Undo a delete',
    description:
      'Deleting a task now shows a brief toast with an Undo button; Cmd/Ctrl+Z works too. Undo puts the task back exactly where it was, with its notes, schedule, and completion history intact. Several deletes in a row can be walked back one by one. The window lasts about eight seconds, then the deletion becomes final as before.',
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
