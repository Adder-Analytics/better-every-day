// Today's timed tasks, as a calendar file (.ics) you can open in Google
// Calendar, Apple Calendar, Outlook, or any app that reads iCalendar. It exists
// to close the one gap the in-app reminders can't: those only fire while this
// tab is open. Hand your schedule to a real calendar and its own alarms nudge
// your phone even when the planner is closed. Nothing leaves the browser — the
// file is built here and handed straight to a download.
//
// Only timed tasks become events (an untimed to-do isn't a calendar entry).
// Times are written as "floating" local times — no timezone and no UTC "Z" — so
// a 9 AM task lands at 9 AM on whatever device opens it, matching how the app
// treats a time of day. Each event carries a display alarm at its start.

import type { Task } from './planner'
import { extractTags, stripTags } from './tags'

// RFC 5545 text escaping: backslash, semicolon, comma, and newlines are special
// in a property value and must be escaped so a title like "Email a, b; c" reads
// back intact.
function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

const pad = (n: number): string => String(n).padStart(2, '0')

// A local floating datetime (YYYYMMDDTHHMMSS, no zone) for `min` minutes into
// `dateStr`. The wall-clock math is done in UTC purely as arithmetic — Date.UTC
// never applies a local offset — so adding an estimate that crosses midnight
// rolls the date correctly without any timezone drifting the result.
function floatingStamp(dateStr: string, min: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d) + min * 60000)
  return (
    `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}` +
    `T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00`
  )
}

// A UTC timestamp (…Z) for DTSTAMP — when the file was generated.
function utcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

// A bare time with no estimate is a moment, not a block; give its event a short
// nominal length so a calendar has something to draw. Matches the timeline's
// treatment of an untimed-length task.
const DEFAULT_EVENT_MIN = 30

// Fold a content line to 75 octets per RFC 5545: long lines continue on the
// next physical line, which begins with a single space. Counted in UTF-8 bytes
// and split only on whole code points, so a multi-byte character is never cut.
function foldLine(line: string): string {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  let out = ''
  let seg = ''
  let segBytes = 0
  let limit = 75 // first physical line; continuations lose one octet to the space
  for (const ch of line) {
    const chBytes = enc.encode(ch).length
    if (segBytes + chBytes > limit) {
      out += (out ? '\r\n ' : '') + seg
      seg = ch
      segBytes = chBytes
      limit = 74
    } else {
      seg += ch
      segBytes += chBytes
    }
  }
  return out + (out ? '\r\n ' : '') + seg
}

// Build the iCalendar document for the given tasks placed on `dateStr`. Untimed
// tasks are skipped. `now` is injected so the caller owns the clock. Returns the
// full VCALENDAR text (CRLF-terminated) ready to hand to a download.
export function tasksToICS(tasks: Task[], dateStr: string, now: Date = new Date()): string {
  const dtstamp = utcStamp(now)
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Better Every Day//Daily Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const t of tasks) {
    if (t.timeMin == null) continue
    const len = t.estimateMin && t.estimateMin > 0 ? t.estimateMin : DEFAULT_EVENT_MIN
    const title = stripTags(t.text) || t.text.trim()
    const tags = extractTags(t.text)
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${t.id}-${dateStr}@better-every-day`)
    lines.push(`DTSTAMP:${dtstamp}`)
    lines.push(`DTSTART:${floatingStamp(dateStr, t.timeMin)}`)
    lines.push(`DTEND:${floatingStamp(dateStr, t.timeMin + len)}`)
    lines.push(`SUMMARY:${escapeText(title)}`)
    if (t.note) lines.push(`DESCRIPTION:${escapeText(t.note)}`)
    if (tags.length) lines.push(`CATEGORIES:${tags.map(escapeText).join(',')}`)
    // A display alarm at the task's start — the reason to export at all: the
    // calendar nudges you even when this planner isn't open.
    lines.push('BEGIN:VALARM')
    lines.push('ACTION:DISPLAY')
    lines.push(`DESCRIPTION:${escapeText(title)}`)
    lines.push('TRIGGER:PT0S')
    lines.push('END:VALARM')
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}

export function icsFilename(date: string): string {
  return `better-every-day-${date}.ics`
}
