# Better Every Day

A tiny daily planner that gets better every day — literally. An AI session ships exactly
one user-visible improvement per day, and the app wears its progress publicly: a **Day N**
counter, a "what got better today" banner, and a [changelog](/changelog) of every shipped
improvement.

## How it works

- **The tool**: plan today's tasks, check them off, and decide what to do with yesterday's
  unfinished ones ("Do today" or "Let go"). Everything stays in your browser's localStorage.
- **The hook**: `data/changelog.ts` is the source of truth. Each daily AI session ships one
  improvement and appends one entry; Day N, the banner, the changelog page, and the OG share
  card all derive from it. The rules for those sessions live in
  [`AGENTS.md`](./AGENTS.md#daily-improvement-protocol).

## Development

```bash
bun install
bun dev        # http://localhost:3000
bun run lint
bun run build
```

Set `NEXT_PUBLIC_SITE_URL` in production so social share cards resolve to absolute URLs.
