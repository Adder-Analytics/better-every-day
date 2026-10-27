'use client'

import { useRef, useState } from 'react'
import { formatDuration, formatTime, formatTimeRange } from '@/lib/planner'
import { useHour12 } from '@/lib/timeformat'
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
// length so its segment is wide enough to read and tap. The bar's span reaches
// the end of this drawn block too, so the day's last task is never clipped.
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

// A press has to travel this far sideways before it counts as a drag, so a tap
// (or a slightly shaky one) still just jumps to the task.
const DRAG_THRESHOLD_PX = 5

// Dragged times snap to this grid, and the arrow keys step a block by it.
const SNAP_MIN = 5
const KEY_STEP_MIN = 15

// A single horizontal read on the day: timed tasks laid out in proportion to
// when they happen and how long they take, the space between them left empty so
// free time shows itself, and a live marker for now. Tapping a block jumps to
// its task in the list; dragging an unfinished one sideways moves it to a new
// time, snapped to 5 minutes, and dragging its right edge changes how long it
// takes. It complements the agenda list — the list is the order,
// this is the shape. Shown only once there are at least two timed tasks, so a
// near-empty bar never appears.
export default function DayTimeline({
  tasks,
  nowMin,
  onSelect,
  onPlan,
  onMove,
  onResize,
}: {
  tasks: TimelineTask[]
  nowMin: number
  onSelect: (id: string) => void
  // Plan a task into an open slot: given, the empty stretches between blocks
  // become tappable and hand back the minute-of-day to start a task at. Omitted
  // (e.g. in a read-only context), the gaps stay inert as before.
  onPlan?: (timeMin: number) => void
  // Move a task to a new start time: given, unfinished blocks can be dragged
  // sideways (or nudged with the arrow keys) and hand back the minute dropped on.
  onMove?: (id: string, timeMin: number) => void
  // Change how long a task takes: given, unfinished blocks get a handle on their
  // right edge that drags the end (or [ and ] step it) and hands back the new
  // length in minutes.
  onResize?: (id: string, estimateMin: number) => void
}) {
  const hour12 = useHour12()
  const trackRef = useRef<HTMLDivElement>(null)
  // The block being dragged: whether the whole block moves or only its end,
  // where the press began, the start time and length it began with, the
  // minutes one pixel is worth (fixed for the whole drag), and the span the bar
  // showed when it began, so the scale doesn't shift under the pointer.
  const dragRef = useRef<{
    id: string
    mode: 'move' | 'resize'
    pointerId: number
    x0: number
    fromMin: number
    fromLen: number
    minPerPx: number
    moved: boolean
  } | null>(null)
  const [drag, setDrag] = useState<{
    id: string
    mode: 'move' | 'resize'
    timeMin: number
    estimateMin?: number
    spanStart: number
    spanEnd: number
  } | null>(null)
  // Set when a drag ends so the click that follows the release doesn't also
  // count as a tap on the block.
  const suppressClick = useRef(false)

  // While a block is being dragged, draw it at its new time and length.
  const shown = drag
    ? tasks.map(t => (t.id === drag.id ? { ...t, timeMin: drag.timeMin, estimateMin: drag.estimateMin } : t))
    : tasks

  // Where each block's drawn end lands (a bare time or a short task held to
  // MIN_BLOCK); the day spans from the earliest start to the latest of these,
  // always widened to include now so the marker sits on the bar.
  const ends = shown.map(t => t.timeMin + Math.max(t.estimateMin ?? 0, MIN_BLOCK))
  const firstStart = Math.min(...shown.map(t => t.timeMin))
  const lastEnd = Math.min(1440, Math.max(...ends))
  // During a drag the span holds still (only growing, an hour at a time, when a
  // block is pushed past an edge), so the bar doesn't rescale mid-gesture.
  const start = drag
    ? Math.min(drag.spanStart, floorHour(drag.timeMin))
    : floorHour(Math.min(firstStart, nowMin))
  // Cap at midnight so hour labels never read past the day; keep at least an
  // hour of span so the math is always sound.
  const end = drag
    ? Math.min(1440, Math.max(drag.spanEnd, ceilHour(lastEnd)))
    : Math.min(1440, Math.max(ceilHour(Math.max(lastEnd, nowMin)), start + 60))
  const total = end - start

  // The latest a block can start and still end by midnight.
  const latestStart = (t: TimelineTask) => 1440 - Math.max(t.estimateMin ?? 0, SNAP_MIN)
  const clampMin = (t: TimelineTask, min: number) => Math.max(0, Math.min(latestStart(t), min))
  // A length runs from 5 minutes up to whatever still ends by midnight.
  const clampLen = (t: TimelineTask, len: number) => Math.max(SNAP_MIN, Math.min(1440 - t.timeMin, len))

  const beginDrag = (e: React.PointerEvent<HTMLElement>, task: TimelineTask, mode: 'move' | 'resize') => {
    if (task.done || e.button !== 0 || !trackRef.current) return false
    const width = trackRef.current.getBoundingClientRect().width
    if (width <= 0) return false
    // Follow the pointer even once it leaves the block or the bar.
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      id: task.id,
      mode,
      pointerId: e.pointerId,
      x0: e.clientX,
      fromMin: task.timeMin,
      // Resizing starts from the edge as drawn, so a bare time (shown as a
      // 20-minute block) grows from where its handle actually sits.
      fromLen: Math.max(task.estimateMin ?? 0, MIN_BLOCK),
      minPerPx: total / width,
      moved: false,
    }
    return true
  }

  const onBlockPointerDown = (e: React.PointerEvent<HTMLButtonElement>, task: TimelineTask) => {
    if (onMove) beginDrag(e, task, 'move')
  }

  // The edge handle sits inside the block, so its press must not also start a
  // move of the whole block.
  const onHandlePointerDown = (e: React.PointerEvent<HTMLSpanElement>, task: TimelineTask) => {
    if (!onResize) return
    if (beginDrag(e, task, 'resize')) e.stopPropagation()
  }

  const onDragPointerMove = (e: React.PointerEvent<HTMLElement>, task: TimelineTask) => {
    const d = dragRef.current
    if (!d || d.id !== task.id || d.pointerId !== e.pointerId) return
    e.stopPropagation()
    const dx = e.clientX - d.x0
    if (!d.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) return
      d.moved = true
    }
    const snapped = (min: number) => Math.round(min / SNAP_MIN) * SNAP_MIN
    const timeMin = d.mode === 'move' ? clampMin(task, snapped(d.fromMin + dx * d.minPerPx)) : task.timeMin
    const estimateMin = d.mode === 'resize' ? clampLen(task, snapped(d.fromLen + dx * d.minPerPx)) : task.estimateMin
    setDrag(prev => ({
      id: task.id,
      mode: d.mode,
      timeMin,
      estimateMin,
      spanStart: prev?.spanStart ?? start,
      spanEnd: prev?.spanEnd ?? end,
    }))
  }

  const endDrag = (e: React.PointerEvent<HTMLElement>, commit: boolean) => {
    const d = dragRef.current
    if (!d || d.pointerId !== e.pointerId) return
    e.stopPropagation()
    dragRef.current = null
    if (!d.moved) return
    suppressClick.current = true
    if (commit && drag && drag.id === d.id) {
      if (d.mode === 'move' && drag.timeMin !== d.fromMin) onMove?.(d.id, drag.timeMin)
      const was = tasks.find(t => t.id === d.id)?.estimateMin
      if (d.mode === 'resize' && drag.estimateMin != null && drag.estimateMin !== was) onResize?.(d.id, drag.estimateMin)
    }
    setDrag(null)
  }

  const onBlockKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, task: TimelineTask) => {
    if (task.done || e.metaKey || e.ctrlKey || e.altKey) return
    if (onResize && (e.key === '[' || e.key === ']')) {
      // Shorter or longer by 15 minutes, from the length as drawn.
      e.preventDefault()
      const len = Math.max(task.estimateMin ?? 0, MIN_BLOCK)
      const next = clampLen(task, len + (e.key === ']' ? KEY_STEP_MIN : -KEY_STEP_MIN))
      if (next !== task.estimateMin) onResize(task.id, next)
      return
    }
    if (!onMove) return
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const step = e.shiftKey ? 60 : KEY_STEP_MIN
    const next = clampMin(task, task.timeMin + (e.key === 'ArrowRight' ? step : -step))
    if (next !== task.timeMin) onMove(task.id, next)
  }
  const pct = (min: number) => ((Math.max(start, Math.min(end, min)) - start) / total) * 100

  // Place blocks into lanes so overlaps don't hide one another: each block takes
  // the first lane free at its start time. Capped at two lanes — deeper stacks
  // (already flagged as conflicts in the list) reuse a lane rather than shrink
  // every block to a sliver.
  const laneEnds: number[] = []
  const placed = shown.map(t => {
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
  if (onPlan && !drag) {
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
      <div ref={trackRef} className="relative h-11" aria-hidden="true">
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
              aria-label={`Plan a task at ${formatTime(slot.startMin, hour12)}`}
              title={`Plan a task at ${formatTime(slot.startMin, hour12)}`}
              className="group absolute inset-y-0 flex items-center justify-center rounded-md border border-dashed border-transparent text-zinc-400 transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/5 hover:text-emerald-600 focus:outline-none focus-visible:border-emerald-500/70 focus-visible:bg-emerald-500/5 dark:text-zinc-600 dark:hover:text-emerald-400 dark:focus-visible:text-emerald-400"
              style={{ left: `${slot.left}%`, width: `${slot.width}%` }}
            >
              <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-medium tabular-nums">
                <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="max-w-0 overflow-hidden opacity-0 transition-all duration-150 group-hover:max-w-[6rem] group-hover:opacity-100 group-focus-visible:max-w-[6rem] group-focus-visible:opacity-100">
                  {formatTime(slot.startMin, hour12)}
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
            // Tinted fills with a firmer left edge, so the title written inside
            // stays readable in both themes and the state still shows at a glance.
            const fill = task.done
              ? 'bg-emerald-50 text-emerald-800/70 line-through decoration-emerald-800/40 shadow-[inset_2px_0_0_var(--color-emerald-500)] dark:bg-emerald-500/15 dark:text-emerald-300/70 dark:decoration-emerald-300/40'
              : task.priority
                ? 'bg-amber-100 text-amber-900 shadow-[inset_2px_0_0_var(--color-amber-400)] dark:bg-amber-400/20 dark:text-amber-100'
                : overdue
                  ? 'bg-zinc-100 text-zinc-500 shadow-[inset_2px_0_0_var(--color-zinc-300)] dark:bg-zinc-800 dark:text-zinc-400 dark:shadow-[inset_2px_0_0_var(--color-zinc-600)]'
                  : 'bg-zinc-200/80 text-zinc-800 shadow-[inset_2px_0_0_var(--color-zinc-400)] dark:bg-zinc-700/70 dark:text-zinc-100 dark:shadow-[inset_2px_0_0_var(--color-zinc-500)]'
            const title = stripTags(task.text)
            const when = task.estimateMin ? formatTimeRange(task.timeMin, task.estimateMin, hour12) : formatTime(task.timeMin, hour12)
            const label = `${when} · ${title}`
            const movable = !!onMove && !task.done
            const resizable = !!onResize && !task.done
            const dragging = drag?.id === task.id
            const hints = [movable && 'Left and right arrows move it.', resizable && '[ and ] change its length.'].filter(Boolean).join(' ')
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => {
                  if (suppressClick.current) {
                    suppressClick.current = false
                    return
                  }
                  onSelect(task.id)
                }}
                onPointerDown={e => onBlockPointerDown(e, task)}
                onPointerMove={e => onDragPointerMove(e, task)}
                onPointerUp={e => endDrag(e, true)}
                onPointerCancel={e => endDrag(e, false)}
                onKeyDown={e => onBlockKeyDown(e, task)}
                title={movable && resizable ? `${label} (drag to move, drag the right edge to change length)` : movable ? `${label} (drag to move)` : label}
                aria-hidden="false"
                aria-label={hints ? `Go to ${label}. ${hints}` : `Go to ${label}`}
                className={`@container absolute flex items-center overflow-hidden rounded-md ${fill} ${movable || resizable ? 'cursor-grab touch-pan-y select-none [-webkit-touch-callout:none]' : ''} ${dragging ? 'z-20 cursor-grabbing shadow-lg ring-2 ring-emerald-500/70 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900' : 'transition-[filter,transform] active:scale-[0.97]'} hover:brightness-95 dark:hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  minWidth: '0.5rem',
                  top: `calc(${lane * laneH}% + 1px)`,
                  height: `calc(${laneH}% - 2px)`,
                }}
              >
                {/* The title, written in when the block is wide enough to hold a
                    few letters; narrower blocks stay plain shapes. */}
                <span className="hidden min-w-0 truncate pr-1 pl-1.5 text-left text-[10px] leading-none font-medium @min-[2.5rem]:block">
                  {title}
                </span>
                {/* The end handle: drag it to change how long the task takes. A
                    short grip line shows it's there without needing a hover;
                    hidden on blocks too narrow to also leave room to grab the
                    block itself. */}
                {resizable && (
                  <span
                    onPointerDown={e => onHandlePointerDown(e, task)}
                    onPointerMove={e => onDragPointerMove(e, task)}
                    onPointerUp={e => endDrag(e, true)}
                    onPointerCancel={e => endDrag(e, false)}
                    className="group/handle absolute inset-y-0 right-0 hidden w-3 cursor-ew-resize touch-none items-center justify-center @min-[1.5rem]:flex"
                  >
                    <span className={`h-3.5 w-0.5 rounded-full bg-current transition-opacity ${dragging && drag?.mode === 'resize' ? 'opacity-70' : 'opacity-30 group-hover/handle:opacity-70'}`} />
                  </span>
                )}
              </button>
            )
          })}
          {/* While dragging, the time the block would land on, above its start
              (or, while resizing, the new range and length above its end). */}
          {drag && (() => {
            const t = shown.find(x => x.id === drag.id)
            if (!t) return null
            const at = drag.mode === 'resize' ? t.timeMin + Math.max(t.estimateMin ?? 0, MIN_BLOCK) : t.timeMin
            return (
              <div
                className="pointer-events-none absolute -top-7 z-30 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white shadow-md dark:bg-white dark:text-zinc-900"
                style={{ left: `${Math.min(88, Math.max(12, pct(at)))}%` }}
              >
                {t.estimateMin ? formatTimeRange(t.timeMin, t.estimateMin, hour12) : formatTime(t.timeMin, hour12)}
                {drag.mode === 'resize' && t.estimateMin ? <span className="opacity-60"> · {formatDuration(t.estimateMin)}</span> : null}
              </div>
            )
          })()}
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
          const last = hours.length - 1
          if (i % labelStep !== 0 && i !== last) return null
          // The end always gets a label; skip a thinned one that would crowd it.
          if (i !== last && i !== 0 && last - i < labelStep) return null
          const align = i === 0 ? 'translate-x-0' : i === hours.length - 1 ? '-translate-x-full' : '-translate-x-1/2'
          return (
            <span
              key={h}
              className={`absolute top-0 whitespace-nowrap text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500 ${align}`}
              style={{ left: `${pct(h)}%` }}
            >
              {formatTime(h % 1440, hour12)}
            </span>
          )
        })}
      </div>
    </div>
  )
}
