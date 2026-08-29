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
  {
    day: 28,
    date: '2026-07-10',
    title: 'Star what matters most',
    description:
      'Any task can be starred as important from its actions, and starred tasks float to the top of the list. Timed tasks keep their agenda order, so the star only reorders untimed ones. Focus mode marks a starred task as important. Stored data bumps to version 6 with the added optional field.',
    type: 'feature',
  },
  {
    day: 29,
    date: '2026-07-11',
    title: 'See what’s slipped past its time',
    description:
      'A timed task that’s still unfinished after its moment has passed now shows a quiet amber "25m late" hint, mirroring the emerald "in 25m" on the next task coming up. It updates with the clock and clears when the task is completed or rescheduled.',
    type: 'feature',
  },
  {
    day: 30,
    date: '2026-07-12',
    title: 'A calendar of what you got done',
    description:
      'The History page now opens with an activity calendar: one square per day for the last five weeks, shaded from light to dark by how many tasks were completed, with today outlined and a legend for the scale. It reads from the completion history the planner already keeps, so nothing is stored differently. Each square names its day and count on hover, and the weekly bars now share the same counting.',
    type: 'feature',
  },
  {
    day: 31,
    date: '2026-07-13',
    title: 'Break a task into steps',
    description:
      'A task can now hold a checklist of steps. Open one from a task’s actions ("Break into steps"), then add, check off, rename (double-click), or remove each step; the row shows a "2/3" count that turns green when every step is done. Steps don’t complete the task on their own — the task is still checked off as one thing. They ride along in exports and backups. Stored data bumps to version 7 with the added optional field.',
    type: 'feature',
  },
  {
    day: 32,
    date: '2026-07-14',
    title: 'A command menu, a keystroke away',
    description:
      'Press Cmd/Ctrl+K — or the new Commands button by the add box — to open a searchable menu of the app’s actions: add a task, enter or exit focus mode, toggle reminders, switch theme, bring carried-over tasks to today, export a backup, and open History or What’s new. Filter by typing; move with the arrow keys, Enter runs, Esc closes. Each command appears only when it applies, and every one is also reachable in the normal UI, so the menu is a shortcut rather than the only way. The header theme switcher and the menu now share one preference.',
    type: 'feature',
  },
  {
    day: 33,
    date: '2026-07-15',
    title: 'Step through your day by keyboard',
    description:
      'Today’s list can now be driven from the keyboard. Press j or k to move a selection through it — the arrow keys join in once you’re navigating — then Space or Enter to check the selected task off (or back on), and Backspace to remove it, with the usual undo. The selected row shows a ring and scrolls into view, and checking one off steps the selection to the next task still to do. It covers today’s tasks; carryovers and upcoming days keep their own actions. Mouse and touch are unchanged.',
    type: 'feature',
  },
  {
    day: 34,
    date: '2026-07-16',
    title: 'Repeat on the days you choose',
    description:
      'A routine can now recur on a specific set of weekdays — Monday, Wednesday, Friday, say — alongside the daily, weekdays, and weekly options. The repeat menu gained a day-of-week picker; the days commit when the menu closes, and clearing them all turns repeating off. The task’s row names the set ("Mon Wed Fri", or "Weekdays"/"Weekends" when it matches one). Like every routine, it shows up only on the days it’s due. Stored data bumps to version 8 with one added optional field; existing routines are untouched.',
    type: 'feature',
  },
  {
    day: 35,
    date: '2026-07-17',
    title: 'A note for each day',
    description:
      'A card on the home page holds an optional freeform note for the day — a place for the things a day leaves behind that aren’t tasks: how it went, a number to remember, a line worth keeping. Notes are kept per day in the browser under a new bed-daynotes key, separate from your tasks, and each day’s note shows again in History under that day. URLs in a note are clickable, like task notes.',
    type: 'feature',
  },
  {
    day: 36,
    date: '2026-07-18',
    title: 'Task names that never get squeezed out',
    description:
      'Reworked the task row into two tiers so the name always stays readable. Before, a task with a time, an estimate, and a "starts in" hint could crowd its own name down to a letter or nothing on a narrow phone. Now the name gets the full width of its line (with the time leading and a star trailing), and the quieter details — the countdown, an overdue "late" note, a streak, a repeat cadence, an estimate, step progress — sit on a second line beneath it and wrap instead of pushing on the name. Rows with no such details stay a single line. All actions and the layout are otherwise unchanged.',
    type: 'design',
  },
  {
    day: 37,
    date: '2026-07-19',
    title: 'A Someday list for tasks without a day',
    description:
      'Tasks can now be kept in a Someday list instead of on a specific day — a place to capture what you want to do eventually without committing to when. Add one with the new Someday option beside Today and Tomorrow on the add box, or park an existing task there from its schedule menu. Someday tasks wait in their own section, out of Today, carryovers, and the tab count; "Do today" or scheduling a day lifts one back into the plan. They ride along in exports and backups. Stored data bumps to version 9 with one added optional field; existing tasks are untouched.',
    type: 'feature',
  },
  {
    day: 38,
    date: '2026-07-20',
    title: 'Search across all your tasks',
    description:
      'The command menu (Cmd/Ctrl+K) now searches your tasks, not just its actions. Type a word and matching tasks appear under a Tasks group alongside any matching commands — each with a status dot (done or still to do) and a quiet label for where it lives: Today, the day it carries over from, a scheduled day, Someday, or a routine’s cadence. Both the task text and that label are searchable. Choosing a result closes the menu, scrolls the task into view, and flashes it briefly so your eye lands on it; the whole thing is keyboard-driven, and finished tasks show up too. Tasks only appear once there’s a query, so an empty menu stays a clean list of actions. No stored data changed.',
    type: 'feature',
  },
  {
    day: 39,
    date: '2026-07-21',
    title: 'Fold away what you’ve finished',
    description:
      'Today’s completed tasks can now be collapsed into a "Completed" summary row, so a day with a lot checked off keeps the work that’s left up top. A click on the row folds or unfolds them; finished tasks still sink below what’s active either way, and the choice is remembered across visits under a new bed-completed key. Revealing a finished task from search opens the section automatically, and folded tasks drop out of keyboard navigation. Default is unchanged — completed tasks show until you collapse them. No task data changed.',
    type: 'design',
  },
  {
    day: 40,
    date: '2026-07-22',
    title: 'Add several tasks at once',
    description:
      'The add box is now a text area, so a pasted list keeps its line breaks and Shift+Enter stacks more lines — each non-empty line becomes its own task. Every line still runs through quick-add parsing (so "gym every day" or "call Sam tomorrow" work per line) and honors the Today/Tomorrow/Someday toggle. Plain Enter still adds on every device, so single-task entry is unchanged; the box grows to fit what you type and shows how many tasks will be added once there is more than one line. No stored data changed.',
    type: 'feature',
  },
  {
    day: 41,
    date: '2026-07-23',
    title: 'Carried-over tasks show their real age',
    description:
      'Unfinished tasks from past days used to sit under one "From yesterday" heading regardless of how long they had actually been waiting. They are now grouped by the day each was meant for, most-recent first, with an honest label — "Yesterday", a weekday within the past week, or a date like "Wed, Jul 15" — so a task left over from last week no longer hides among yesterday’s. The layout mirrors the upcoming section. A "Bring all to today" action now sits on the section (shown once more than one is waiting), surfacing the bulk move that previously lived only in the command palette; each row keeps its own "Do today". No stored data changed.',
    type: 'design',
  },
  {
    day: 42,
    date: '2026-07-24',
    title: 'Group your tasks with #tags',
    description:
      'Add a #tag inside any task — "Email Sam #work", "Gym #health" — and it shows as a colored chip on the task. Tapping a chip filters the whole list to that tag; a bar names the filter and clears it (Esc does too), and Focus mode follows the filter. Tags are read from the task text itself, so they are added or removed just by editing the task, and nothing changes in how data is stored. The tab count, reminders, and the all-done celebration keep reading the full day, not the filtered slice.',
    type: 'feature',
  },
  {
    day: 43,
    date: '2026-07-25',
    title: 'Copy today’s plan as text',
    description:
      'A new action copies the day to the clipboard as a plain-text checklist — the date, then one line per task in the order shown, with times leading, estimates in parentheses, and a checked box for finished ones. It is meant for pasting into a standup note, a message, or a journal. Reach it from a clipboard button in the day header or from the command menu (Cmd/Ctrl+K); a brief toast confirms the copy. It reads the whole day, not a tag-filtered slice, and nothing about how data is stored changed.',
    type: 'feature',
  },
  {
    day: 44,
    date: '2026-07-26',
    title: 'A timer for Focus mode',
    description:
      'Focus mode now carries a session timer, so a task can be worked in a set block of time. A ring counts the block down with the time left in the middle; start, pause, resume, and reset from the controls beneath it, and pick a length (15, 25, or 50 minutes) — or the task’s own time estimate, when it has one, which is the default. When a block ends the ring settles into "Time’s up," and if the tab is in the background and notifications are already allowed, a quiet nudge fires. The timer is a working aid, not stored data: it resets when you switch to another task and starts fresh on reload, so nothing about how tasks are saved changed.',
    type: 'feature',
  },
  {
    day: 45,
    date: '2026-07-27',
    title: 'A key for the keyboard shortcuts',
    description:
      'Press ? anywhere to open a reference of the app’s keyboard shortcuts, grouped by what they do — getting around (the command menu, adding a task, this help, Escape), driving today’s list (j/k to move the selection, Space to complete, Backspace to delete), and editing (double-click a task, undo a delete). It’s also in the command menu as "Keyboard shortcuts" so it’s reachable without a keyboard, and Escape or a click outside closes it. An open menu or panel now fully owns the keyboard, so list shortcuts no longer fire behind it. No stored data changed.',
    type: 'feature',
  },
  {
    day: 46,
    date: '2026-07-28',
    title: 'See when today’s plan will wrap up',
    description:
      'The day’s time summary now projects a finish time. It adds up the estimated tasks you haven’t done yet, counts from the current time, and shows a "finish around 4:30 PM" — a quiet read on whether the day’s plan fits before the day is out. It appears once there’s unfinished estimated work, ticks with the clock, and reads "runs past midnight" when the plan won’t fit. It reads only today’s estimates, and nothing about how data is stored changed.',
    type: 'feature',
  },
  {
    day: 47,
    date: '2026-07-30',
    title: 'Block out a task with a time range',
    description:
      'Quick-add now reads a time range and turns it into a block: "Deep work 9-11am" becomes a 9 AM task with a 2h estimate, in one phrase. It accepts a shared meridiem ("9-11am"), one per end ("9am-1pm"), minutes ("9:30-10:30am"), and 24-hour times ("14:00-15:30"); a bare "read pages 9-11" is left alone, as single times already were. A timed task that carries an estimate now shows its window — "9 – 11 AM" — on its row, in the add preview, in Focus mode, and in History, instead of just the start. It reuses the existing time and estimate fields, so nothing about how tasks are stored changed.',
    type: 'feature',
  },
  {
    day: 48,
    date: '2026-07-31',
    title: 'A heads-up when two tasks overlap',
    description:
      'A timed task now shows a quiet amber "overlaps" flag when its time or block runs into another of today’s still-to-do tasks — a 10 AM call landing inside a 9–11 AM block, or two things booked for the same moment. Hovering the flag names the clash and its time. Back-to-back blocks that only touch (9–11, then 11–12) don’t flag, and a bare time counts as a single minute so same-time collisions still register. It reads the whole day, not a tag-filtered slice, and reuses the existing time and estimate fields, so nothing about how tasks are stored changed.',
    type: 'feature',
  },
  {
    day: 49,
    date: '2026-08-01',
    title: 'A head start on reminders',
    description:
      'Reminders can now fire a few minutes before a timed task instead of only as it begins. When reminders are on, a small control under the day header sets the lead — at the time, or 5, 10, or 15 minutes early — and the notification says how soon the task starts. The choice is kept in the browser under a new bed-reminder-lead key; nothing about how tasks are stored changed, and reminders still only fire while the tab is open.',
    type: 'feature',
  },
  {
    day: 50,
    date: '2026-08-02',
    title: 'Work a task’s steps in Focus mode',
    description:
      'Focus mode now shows a task’s steps beneath it, each checkable in place, so a multi-step task can be worked through without leaving focus. A count reads how many are done, and the steps stay in sync with the task’s row — checking one here or there is the same step. It appears only when the task has steps; adding, renaming, and removing them still happens in the main list. No stored data changed.',
    type: 'feature',
  },
  {
    day: 51,
    date: '2026-08-03',
    title: 'Room for the full task title',
    description:
      'On a mouse, a task row’s quick-action buttons (star, repeat, schedule, estimate, note, steps, edit) used to reserve their horizontal space even while hidden, squeezing the title into a narrow strip — so a normal entry like “Draft the quarterly planning doc” was clipped to a few words with the rest of the row sitting empty. Those buttons now live in a cluster that collapses to nothing at rest and slides open only when the row is hovered, a button inside takes keyboard focus, or one of its menus is open, so the title keeps the row’s full width. Touch screens are unchanged — the actions were already tucked behind the ellipsis menu there. No stored data changed.',
    type: 'fix',
  },
  {
    day: 52,
    date: '2026-08-04',
    title: 'Tasks that repeat every month',
    description:
      'Routines can now recur monthly, alongside daily, weekdays, weekly, and specific weekdays. A monthly task returns on the same day-of-month it was created — pick Monthly from the repeat menu, or type "monthly"/"every month" when adding ("Pay rent monthly"). Months too short for that day (a task set for the 31st) fall to the month’s last day, so it still fires once every month. The row names the cadence, and its streak counts by months. Stored data bumps to version 10 with the new repeat value; existing tasks are untouched.',
    type: 'feature',
  },
  {
    day: 53,
    date: '2026-08-05',
    title: 'Send the rest of today to tomorrow',
    description:
      'A one-tap action moves today’s still-to-do tasks to tomorrow at once, so what you won’t get to now is planned as tomorrow’s work instead of nagging the next morning as an overdue carryover. It sits below today’s list once two or more tasks are left, and in the command menu (Cmd/Ctrl+K). It complements the per-task "Move to tomorrow" with the bulk form. Routines recur on their own schedule and are left alone; each moved task keeps its time, estimate, notes, and steps. No stored data changed.',
    type: 'feature',
  },
  {
    day: 54,
    date: '2026-08-06',
    title: 'A daily streak for showing up',
    description:
      'The "This week" card now shows how many days in a row you’ve completed at least one task. Today is a grace day — an unfinished today doesn’t break a run, and finishing something extends it — and the count reads from the completion history the week bars and calendar already keep, so both one-off tasks and routines feed it. It appears once a run reaches two days and uses the same flame the per-routine streaks do. No stored data changed.',
    type: 'feature',
  },
  {
    day: 55,
    date: '2026-08-07',
    title: 'Your last 30 days, at a glance',
    description:
      'The History page opens with a short summary of the last 30 days: tasks done, how many days had at least one thing completed, the weekday you finish the most on, and the longest run of days in a row. The activity calendar below still shows the day-by-day shape; the summary just reads the same completion history back as a few plain numbers, replacing the single "N tasks completed" line. Nothing is stored differently.',
    type: 'feature',
  },
  {
    day: 56,
    date: '2026-08-08',
    title: 'Your day on a timeline',
    description:
      'Today now opens with a compact timeline above the list: each timed task is a block, sized to its estimate and placed by its start time, with the gaps between blocks left as free time and a live marker for the current moment — so how full the day is, and where the openings are, reads at a glance. Tapping a block jumps to that task in the list. It appears once at least two tasks have a time of day, reads the whole day (a tag filter narrows the list, not the timeline), and sits under the "planned today" summary. Finished blocks are green and starred ones amber, matching the rest of the app. No stored data changed.',
    type: 'feature',
  },
  {
    day: 57,
    date: '2026-08-09',
    title: 'Reorder tasks from the keyboard',
    description:
      'Today’s list can now be reordered without a pointer. With a task selected (j/k), press Shift+J or Shift+K to move it down or up — the keyboard counterpart to dragging, which was mouse- and touch-only. It moves a task within its manual group (untimed, still-to-do, same priority — the same tasks dragging reorders), so the timed agenda keeps its chronological order and finished tasks keep their place; the selection rides along with the task as it shifts. The new keys are listed in the shortcuts panel (?). No stored data changed.',
    type: 'feature',
  },
  {
    day: 58,
    date: '2026-08-10',
    title: 'Duplicate a task',
    description:
      'A task can now be duplicated from its actions — the hover icons on a mouse, the ellipsis menu on touch. The copy drops in right below the original, in the same section, carrying its text and tags, note, time, estimate, star, and repeat cadence, so a near-identical task (or a fork of a routine) takes one tap instead of retyping. The copy starts clean: not done, no completion history, and any steps reset to unchecked. It flashes briefly where it lands. No stored data changed.',
    type: 'feature',
  },
  {
    day: 59,
    date: '2026-08-11',
    title: 'Filter the day by tag, in one tap',
    description:
      'A tag bar now sits above the day: every tag in play, each with how many tasks carry it, and a leading "All". Tapping one slices the whole board — today, carryovers, upcoming, and Someday — to that context; tapping it again, or "All", clears it. Until now a filter could only be started by finding a task already wearing a tag and clicking its chip, so a context whose tasks were all finished, folded away, or on another day was unreachable. Tapping a chip switches contexts directly, and the bar appears once there are two or more tags. Tags are still read from task text, so nothing is stored differently; the row chips, Esc-to-clear, and the existing filter indicator all keep working.',
    type: 'feature',
  },
  {
    day: 60,
    date: '2026-08-12',
    title: 'Reorder tasks on a touch screen',
    description:
      'Reordering today’s tasks reached a touch screen. Until now the manual order could only be changed by dragging the grip handle (which needs a mouse) or with Shift+J/Shift+K (which needs a keyboard), so on a phone or tablet there was no way to do it at all. A task’s actions menu — the ellipsis on touch — now offers "Move up" and "Move down", shown only for the untimed, still-to-do tasks that drag and the keyboard already reorder, and only in a direction that would actually move it. The menu stays open between moves so a task can be nudged several places in a row. It reorders within the same manual group as before (timed tasks keep their chronological order, finished ones their place), and nothing about how tasks are stored changed.',
    type: 'feature',
  },
  {
    day: 61,
    date: '2026-08-13',
    title: 'Take a rest day from a routine',
    description:
      'A repeating task can now be skipped for today from its actions (the hover icons on a mouse, the ellipsis menu on touch) — a rest day. A skipped routine steps out of today’s list, its done count, the timeline, and any reminders, and waits in a "Resting today" section with a one-tap Resume that puts it back exactly where it was. A rest day counts as neither done nor missed, so it bridges the routine’s streak rather than breaking it — a deliberate day off no longer costs a run, and the best-ever streak counts the same way. Stored data bumps to version 11 with an added optional field; existing tasks are untouched.',
    type: 'feature',
  },
  {
    day: 62,
    date: '2026-08-14',
    title: 'The week ahead',
    description:
      'A new page lays out the next seven days at once, so planning ahead no longer means scrolling past today. Each day is a card showing what falls on it — one-off tasks scheduled for that day and any routines due — with times, estimates, tags, and a slim meter that reads each day’s load against the busiest one, so a lopsided week is visible at a glance. Today’s card also gathers the tasks carried over from earlier days. Every card has its own quick-add: type a task under any day to place it there, with the same inline parsing the home box uses (a time like "9am", a block like "9–11am", or "every day" to make it repeat). One-off tasks can be removed from here; routines are managed from their row on the home page. It reads and writes the tasks already stored — nothing about how data is saved changed. Reachable from a "Week" link in the header and the command menu (Cmd/Ctrl+K).',
    type: 'feature',
  },
  {
    day: 63,
    date: '2026-08-15',
    title: 'All your routines in one place',
    description:
      'A new Routines page gathers every repeating task, so your habits are visible even on days they aren’t due — until now a routine only showed up on the home page when it was scheduled for that day. Each one lists its cadence, current streak, best-ever run, and when it’s next due, alongside a strip of dots for its recent due days: kept, rested, or missed at a glance. Today’s due routines can be checked off right from the page (the same per-day completion the home page records), and a rest day can be resumed here too. Rows sort with the ones still waiting on you today first, then by streak. It reads and writes the tasks already stored — nothing about how data is saved changed. Reachable from a "Routines" link in the header and the command menu (Cmd/Ctrl+K).',
    type: 'feature',
  },
  {
    day: 64,
    date: '2026-08-16',
    title: 'Repeat every few days',
    description:
      'Routines can now recur every N days — every other day, every 3 days, every 10 — counting from the day the task was created, alongside daily, weekdays, weekly, specific weekdays, and monthly. Pick it from the repeat menu (a stepper under "Every few days"), or type it when adding a task: "Workout every other day", "Water plants every 3 days". It fills the gap between daily and weekly for the habits that fall on their own rhythm rather than fixed weekdays. The cadence shows on the task row and the Routines page, and its streak counts by that rhythm like every other routine. Stored data bumps to version 12 with the new repeat value and one optional field; existing tasks are untouched.',
    type: 'feature',
  },
  {
    day: 65,
    date: '2026-08-18',
    title: 'Schedule a task by its date',
    description:
      'Quick-add now understands a calendar date at the end of a task, so planning further out no longer means opening the week view or counting days. Type "Dentist Aug 20", "Renew passport Dec 1", "Wedding 3rd of December", or "Pick up order 20 Aug" and the task lands on that day; a date that has already passed this year rolls to next year, the way naming a weekday already points ahead. "In 2 weeks" joins the existing "in 3 days" and "next week". A month name is required, so a bare number like "Read pages 9-11" is never mistaken for a date, and an impossible day like "Feb 30" stays part of the title. It reads alongside the time, estimate, and repeat phrases already parsed, so "Call Sam Aug 20 at 2pm" sets both the day and the time, and the same parsing powers the week page. Nothing about how tasks are stored changed.',
    type: 'feature',
  },
  {
    day: 66,
    date: '2026-08-19',
    title: 'Tags no longer hide a task’s schedule',
    description:
      'Quick-add reads a time, estimate, date, or repeat even when a #tag is written after it, so a natural entry like "Standup 10am #work", "Gym 6pm every day #health", or "Write proposal 90m #work" now sets the time (or routine, or estimate) and keeps the tag. Before, a hashtag at the end of the line sat between the parser and the schedule phrase, so the whole phrase was left as literal text — the task got no time chip and a routine never started repeating. Tags anywhere in the line are set aside while the trailing schedule is read, then put back in their original order; a task typed as just "#tag" still stays a plain title. Nothing about how tasks are stored changed.',
    type: 'fix',
  },
  {
    day: 67,
    date: '2026-08-20',
    title: 'Send today’s schedule to your calendar',
    description:
      'Today’s timed tasks can now be handed to a real calendar. A new calendar action — in the today header next to Copy plan, and in the command menu (Cmd/Ctrl+K) as "Add today’s schedule to calendar" — downloads a standard .ics file that opens in Google Calendar, Apple Calendar, Outlook, or anything that reads iCalendar. It fills the one gap the in-app reminders leave: those only fire while this tab is open, whereas each exported event carries an alarm at its start, so your calendar nudges your phone even when the planner is closed. A task with an estimate becomes a block of that length; a bare time becomes a 30-minute event. Times are written as floating local times, so a 9 AM task stays 9 AM wherever it opens; #tags become the event’s categories and a task’s note becomes its description. Only still-to-do timed tasks are included — untimed to-dos and finished tasks are left out. The file is built in your browser and nothing is sent anywhere; how tasks are stored didn’t change.',
    type: 'feature',
  },
  {
    day: 68,
    date: '2026-08-21',
    title: 'Say a time in words',
    description:
      'Quick-add now reads a named time of day the same way it already reads "9am" or "14:00", so the words people actually type set a time. "Lunch noon", "Meds midnight", "Call mom tonight", "Standup this morning", "Gym this evening", "Review notes afternoon" each land the task at a round hour — noon at 12 PM, midnight at 12 AM, morning at 9 AM, afternoon at 2 PM, evening at 6 PM, night or tonight at 9 PM. Only a trailing phrase is read, and only when a title is left in front of it, so a one-word task like "Morning" or a mid-sentence "the morning briefing" stays literal. The recognized time shows in the add preview before you commit, and the time menu can nudge it after. It stacks with the rest of quick-add, so "Dentist Aug 25 morning", "Lunch noon 45m", and "Standup noon #work" all read the day, estimate, or tag alongside the time. Nothing about how tasks are stored changed.',
    type: 'feature',
  },
  {
    day: 69,
    date: '2026-08-22',
    title: 'Give a task a deadline',
    description:
      'A task can now carry a due date — when it needs to be done by — kept separate from the day it sits on. Type it in quick-add after the word "due": "Submit report due Friday", "Renew passport due Dec 1", "Pay invoice due tomorrow", "File taxes due today", "Call Sam due in 3 days". Or set it from a task\'s schedule menu, under "Due by", where a "Clear due date" option removes it. A "due" chip then shows on the row: quiet while the deadline is days out ("due Fri", "due Sep 1"), amber the day before and the day of ("due tomorrow", "due today"), and rose once it has passed ("overdue"). Because an unfinished one-off carries into the next day, the chip counts itself down without any nudging. The deadline is only a heads-up — it never changes which day a task appears on, so "Submit report due Friday" stays on today, while a plain "Dentist Aug 20" still schedules the task onto that day as before. It reads alongside the time, estimate, tag, and repeat phrases already parsed. Stored data bumps to version 13 with one new optional field; existing tasks are untouched.',
    type: 'feature',
  },
  {
    day: 70,
    date: '2026-08-23',
    title: 'Reuse a tag in a tap',
    description:
      'While you\'re composing a task, the add box now offers the tags you\'ve already used as small chips beneath it — tap one to drop it into the task instead of retyping it from memory. They\'re sorted by how often you use each, capped at eight, and a tag already in the draft steps out of the row. Because the spelling comes from the chip, a stray "#wrok" no longer splinters a filter away from "#work". The chips appear only while the box is focused and holds a single line, so a resting box and a pasted brain dump stay uncluttered, and a first-ever task shows nothing since there\'s nothing to suggest yet. Tags are still read from the task text, so nothing about how data is stored changed.',
    type: 'feature',
  },
  {
    day: 71,
    date: '2026-08-24',
    title: 'See what’s coming due',
    description:
      'A task with a deadline that isn’t sitting in today’s list — one parked in Someday, scheduled for a later day, or carried over from a past one — now shows in a "Coming due" panel at the top of the day instead of only on its own row further down. It gathers the ones that are overdue or due within a day, sorts them earliest-deadline-first, and notes where each lives and how its deadline reads ("overdue", "due today", "due tomorrow"); overdue items are marked in rose, ones due soon in amber. Tapping a row jumps to the task and flashes it. The panel only appears when something is in that window, so a day with nothing looming stays uncluttered, and today’s own tasks are left out since they already sit at the top with their due chip. It reads deadlines already stored on tasks, so nothing about how data is stored changed.',
    type: 'feature',
  },
  {
    day: 72,
    date: '2026-08-25',
    title: 'Star a task as you add it',
    description:
      'Quick-add now reads a trailing "!" as an importance flag, so a task can be starred the moment it\'s captured instead of opening its menu afterward — handy on a phone. End the line with "!" (or "!!") set off by a space: "Call the bank !", "Submit report tomorrow 2pm !". The recognized star shows in the add preview as an "Important" chip before you commit, and the task lands already starred — floating to the top of the day like any other important task. The space in front of the bang is the whole guard: an ordinary exclamation with no space before it ("Ship it!", "We did it!!") stays literal, and a lone "!" stays its own task. It stacks with the day, time, estimate, tag, due, and repeat phrases already parsed, and reads them even when the "!" is written last. Nothing about how tasks are stored changed.',
    type: 'feature',
  },
  {
    day: 73,
    date: '2026-08-26',
    title: 'See what you can type',
    description:
      'The add box has quietly grown to understand a lot of trailing phrases — "tomorrow" or "Friday" or "Aug 20" to pick a day, "9am" or "noon" or "9–11am" for a time, "30m" for how long, "due Friday" for a deadline, "every day" or "weekdays" or "every 3 days" to repeat, "#work" to tag, and a trailing "!" to mark it important — and they all stack in any order. None of that was written down where you type, so a "What you can type" line now sits under the add box: tap it and a small reference opens, grouped by what each phrase sets, each with an example you could type verbatim, and a note that they combine ("Report tomorrow 2pm 30m #work !" reads all of it at once). It is a plain disclosure — no hover, no modal, closes on tap again or Esc — and nothing about how tasks are stored changed.',
    type: 'feature',
  },
  {
    day: 74,
    date: '2026-08-27',
    title: 'A recap when your day is done',
    description:
      'Checking off the last task of the day now shows a short recap in place of the plain "all done" line: how many tasks you finished, the time you had planned (when tasks carried estimates), and your current run of days completing something — each shown only when it has a real number. A "Plan tomorrow" button sits below it, setting the add box to Tomorrow and dropping the cursor there, so the natural next step is one tap away. It reads the completion history and estimates the planner already keeps; nothing about how tasks are stored changed, and the confetti burst is unchanged.',
    type: 'design',
  },
  {
    day: 75,
    date: '2026-08-28',
    title: 'Your streak, visible all day',
    description:
      'The daily streak — how many days in a row you\'ve finished at least one task — now sits quietly in the header beside the date, not only in the end-of-day recap. So the run you\'re keeping is visible the moment you open the app, when it can still nudge you to add and finish something today, rather than only once everything\'s already checked off. It appears once the run is real (two days or more), stays out of the way otherwise, and tapping it opens History and its activity calendar. Today counts as a grace day, so an unfinished morning never drops the streak early. It reads the completion history the recap and calendar already keep; nothing about how tasks are stored changed.',
    type: 'feature',
  },
  {
    day: 76,
    date: '2026-08-29',
    title: 'Search your history',
    description:
      'The History page now has a search box: type a word and it filters the completed tasks below to the ones that match, grouped by the day they were finished, with a count of how many tasks across how many days. It answers the "when did I last do this?" questions — the gym, an invoice, a call — without scrolling the whole 30 days. Matches are highlighted in each result, the match runs over the task text and its #tags, and clearing the box (or pressing Escape) brings back the summary, calendar, and streaks. It reads the completion history the page already shows; nothing about how tasks are stored changed.',
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
