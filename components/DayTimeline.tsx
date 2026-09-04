'use client'

import { formatTime, formatTimeRange } from '@/lib/planner'
import { stripTags } from '@/lib/tags'

// A timed task as the timeline needs it — the day's spatial view reads only
// these fields, all of which already exist on a Task.
export type TimelineTask = {
  id: string
  text: string
  timeMin: number
  estimateMin?: number
  done: boolean
  priority?: boolean
}

// A bare time (no estimate) is a moment, not a block — give it a small nominal
// length so its segment is wide enough to read and tap. Only affects how wide
// the block draws; the day's span math uses the real end.
const MIN_BLOCK = 20

// Only offer an open stretch as plannable once it's at least this wide, so a
// sliver between two back-to-back blocks never sprouts a tap target.
const GAP_MIN = 30

// Round down / up to the hour, so the bar starts and ends on clean gridlines.
const floorHour = (min: number) => Math.floor(min / 60) * 60
const ceilHour = (min: number) => Math.ceil(min / 60) * 60

// Round a minute-of-day up to the next clean 5, so a slot suggested from "now"
// lands on 9:35 rather than 9:33.
const round5 = (min: number) => Math.ceil(min / 5) * 5

// A single horizontal read on the day: timed tasks laid out in proportion to
// when they happen and how long they take, the space between them left empty so
// free time shows itself, and a live marker for now. Tapping a block jumps to
// its task in the list. It complements the agenda list — the list is the order,
// this is the shape. Shown only once there are at least two timed tasks, so a
// near-empty bar never appears.
export default function DayTimeline({
  tasks,
  nowMin,
  onSelect,
  onPlan,
}: {
  tasks: TimelineTask[]
  nowMin: number
  onSelect: (id: string) => void
  // Plan a task into an open slot: given, the empty stretches between blocks
  // become tappable and hand back the minute-of-day to start a task at. Omitted
  // (e.g. in a read-only context), the gaps stay inert as before.
  onPlan?: (timeMin: number) => void
}) {
  // Each task's true end; the day spans from the earliest start to the latest
  // end, always widened to include now so the marker sits on the bar.
  const ends = tasks.map(t => t.timeMin + (t.estimateMin ?? 0))
  const firstStart = Math.min(...tasks.map(t => t.timeMin))
  const lastEnd = Math.min(1440, Math.max(...ends))
  const start = floorHour(Math.min(firstStart, nowMin))
  // Cap at midnight so hour labels never read past the day; keep at least an
  // hour of span so the math is always sound.
  const end = Math.min(1440, Math.max(ceilHour(Math.max(lastEnd, nowMin)), start + 60))
  const total = end - start
  const pct = (min: number) => ((Math.max(start, Math.min(end, min)) - start) / total) * 100

  // Place blocks into lanes so overlaps don't hide one another: each block takes
  // the first lane free at its start time. Capped at two lanes — deeper stacks
  // (already flagged as conflicts in the list) reuse a lane rather than shrink
  // every block to a sliver.
  const laneEnds: number[] = []
  const placed = tasks.map(t => {
    const blockEnd = t.timeMin + (t.estimateMin ?? 0)
    let lane = laneEnds.findIndex(e => e <= t.timeMin)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(blockEnd)
    } else {
      laneEnds[lane] = blockEnd
    }
    return { task: t, lane }
  })
  const laneCount = Math.min(Math.max(1, laneEnds.length), 2)
  const laneH = 100 / laneCount

  // Open time: the stretches of the span no block occupies. Occupancy uses each
  // task's real block (a bare time held to MIN_BLOCK so a moment still reserves
  // its spot), merged so overlapping blocks don't split a gap into slivers. Only
  // the part of a gap that's still ahead (from now, rounded to a clean 5) is
  // offered, and only when what's left is wide enough to be worth a tap. Each
  // becomes a "+" slot that plans a task starting at that minute.
  const openSlots: { startMin: number; left: number; width: number }[] = []
  if (onPlan) {
    const occ = tasks
      .map(t => [t.timeMin, t.timeMin + Math.max(t.estimateMin ?? 0, MIN_BLOCK)] as [number, number])
      .sort((a, b) => a[0] - b[0])
    const merged: [number, number][] = []
    for (const iv of occ) {
      const last = merged[merged.length - 1]
      if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1])
      else merged.push([iv[0], iv[1]])
    }
    const gaps: [number, number][] = []
    let cursor = start
    for (const [s, e] of merged) {
      if (s > cursor) gaps.push([cursor, s])
      cursor = Math.max(cursor, e)
    }
    if (cursor < end) gaps.push([cursor, end])
    for (const [gs, ge] of gaps) {
      const from = Math.max(gs, round5(nowMin))
      if (ge - from < GAP_MIN) continue
      const left = pct(from)
      openSlots.push({ startMin: from, left, width: pct(ge) - left })
    }
  }

  // Hour gridlines across the span; label a thinned-out set (≤ ~6) so a long day
  // doesn't crowd, with the ends aligned inward so they don't clip the edges.
  const hours: number[] = []
  for (let h = start; h <= end; h += 60) hours.push(h)
  const labelStep = Math.max(1, Math.ceil((hours.length - 1) / 6))

  const nowPct = pct(nowMin)
  const nowInRange = nowMin >= start && nowMin <= end

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 pt-2.5 pb-2">
      {/* The track. Gridlines sit behind, blocks in their lanes, the now-line on
          top. Inset so blocks never touch the rounded corners. */}
      <div className="relative h-11" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 bottom-0">
          {/* Hour gridlines */}
          {hours.slice(1, -1).map(h => (
            <div
              key={h}
              className="absolute top-0 bottom-0 w-px bg-zinc-100 dark:bg-zinc-800"
              style={{ left: `${pct(h)}%` }}
            />
          ))}
          {/* Open slots — the free stretches, made tappable to plan a task into
              the time they hold. Quiet at rest (a faint centered "+") so the bar
              still reads as a picture, and clearer on hover or focus, where the
              start time it would use shows. Sits behind the blocks and now-line.
              aria-hidden is turned back on for each button so it's reachable even
              though the decorative track around it isn't. */}
          {openSlots.map(slot => (
            <button
              key={slot.startMin}
              type="button"
              onClick={() => onPlan!(slot.startMin)}
              aria-hidden="false"
              aria-label={`Plan a task at ${formatTime(slot.startMin)}`}
              title={`Plan a task at ${formatTime(slot.startMin)}`}
              className="group absolute inset-y-0 flex items-center justify-center rounded-md border border-dashed border-transparent text-zinc-400 transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/5 hover:text-emerald-600 focus:outline-none focus-visible:border-emerald-500/70 focus-visible:bg-emerald-500/5 dark:text-zinc-600 dark:hover:text-emerald-400 dark:focus-visible:text-emerald-400"
              style={{ left: `${slot.left}%`, width: `${slot.width}%` }}
            >
              <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-medium tabular-nums">
                <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="max-w-0 overflow-hidden opacity-0 transition-all duration-150 group-hover:max-w-[6rem] group-hover:opacity-100 group-focus-visible:max-w-[6rem] group-focus-visible:opacity-100">
                  {formatTime(slot.startMin)}
                </span>
              </span>
            </button>
          ))}
          {/* Timed blocks */}
          {placed.map(({ task, lane }) => {
            const drawEnd = Math.max(task.timeMin + (task.estimateMin ?? MIN_BLOCK), task.timeMin + MIN_BLOCK)
            const left = pct(task.timeMin)
            const width = Math.max(0, pct(drawEnd) - left)
            const overdue = !task.done && task.timeMin < nowMin
            const fill = task.done
              ? 'bg-emerald-500/90 dark:bg-emerald-500/80'
              : task.priority
                ? 'bg-amber-400 dark:bg-amber-400/90'
                : overdue
                  ? 'bg-zinc-300 dark:bg-zinc-600'
                  : 'bg-zinc-400 dark:bg-zinc-500'
            const label = `${task.estimateMin ? formatTimeRange(task.timeMin, task.estimateMin) : formatTime(task.timeMin)} · ${stripTags(task.text)}`
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onSelect(task.id)}
                title={label}
                aria-hidden="false"
                aria-label={`Go to ${label}`}
                className={`absolute rounded-md ${fill} transition-[filter,transform] hover:brightness-110 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  minWidth: '0.5rem',
                  top: `calc(${lane * laneH}% + 1px)`,
                  height: `calc(${laneH}% - 2px)`,
                }}
              />
            )
          })}
          {/* Now marker */}
          {nowInRange && (
            <div className="absolute top-0 bottom-0 z-10" style={{ left: `${nowPct}%` }}>
              <div className="absolute inset-y-0 -left-px w-0.5 rounded-full bg-emerald-500" />
              <div className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
            </div>
          )}
        </div>
      </div>
      {/* Hour axis */}
      <div className="relative mt-1 h-3.5">
        {hours.map((h, i) => {
          if (i % labelStep !== 0 && i !== hours.length - 1) return null
          const align = i === 0 ? 'translate-x-0' : i === hours.length - 1 ? '-translate-x-full' : '-translate-x-1/2'
          return (
            <span
              key={h}
              className={`absolute top-0 whitespace-nowrap text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500 ${align}`}
              style={{ left: `${pct(h)}%` }}
            >
              {formatTime(h % 1440)}
            </span>
          )
        })}
      </div>
    </div>
  )
}
