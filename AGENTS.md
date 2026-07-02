<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Daily Improvement Protocol

You are the daily improvement session for Better Every Day — a tiny daily planner whose
whole premise is that the app itself gets better every day. Follow this exactly.

### Mission

Ship exactly ONE small, user-visible improvement per session. Not zero, not two.
"User-visible" means a user could notice it: a feature, a design refinement, better copy,
a bug they'd hit, speed they can feel. Refactors and test-only changes do not count as
the improvement (they may accompany it).

### Process

1. Read this file, then the relevant guides in `node_modules/next/dist/docs/` for any
   framework feature you'll touch (run `bun install` first if `node_modules` is missing).
2. Read `data/changelog.ts`. Your day number is the last entry's `day` + 1.
3. Pick one improvement — see the idea bank below, or invent one. Prefer small over clever.
4. Implement it. Keep the diff small and focused.
5. Append exactly one entry to the END of the `changelog` array in `data/changelog.ts`:
   `{ day, date (today, YYYY-MM-DD), title (short, OG-card-friendly), description, type? }`.
   The description is a plain, factual note of what changed — a log line for the curious,
   not marketing copy. No superlatives, no selling.
6. Verify (below), then commit and push with the message `Day {N}: {title}`.

### Hard constraints

- Never break existing features. The planner must keep working exactly as before, plus your change.
- localStorage is user data. Never rename or remove the `bed-planner` key, and never change
  the stored shape without bumping `version` in `lib/planner.ts` and adding a migration in
  `loadPlanner()`. Never delete legacy `bed-*` keys.
- Day numbers are sacred: strictly sequential, one entry per session, never edit past entries.
- No new dependencies unless absolutely necessary; if you must add one, use bun.
- Don't redesign the whole app. One improvement, in the existing zinc/dark visual language.
- No emojis anywhere in the product or the changelog — use inline SVG icons
  (Heroicons-style) instead.
- The app must stay genuinely usable on touch screens: never gate an action behind
  hover alone.

### Verification (must pass before commit)

- `bun run lint` — clean
- `bun run build` — succeeds
- `bun dev` smoke test: add, complete, and reload a task; `/` and `/changelog` render;
  the Day banner shows your new entry.

### Idea bank (right-sized improvements)

Keyboard shortcuts, drag-to-reorder, task notes, confetti on all-done, focus mode,
stats from completed-task history, better empty states, accessibility passes, PWA
manifest, subtle animations, time-of-day greeting, task count celebrations, export data.
