// Better Every Day — offline service worker.
//
// The planner is local-first: your tasks live in this browser and nothing is
// fetched from a server to use it. The one thing still tying it to the network
// was *loading the app itself* — so an installed planner opened on a plane, a
// subway, or a dead zone would fail at a blank screen. This caches the app
// shell and its assets, so once the app has been opened it runs with no
// connection at all, exactly as it does online.
//
// It's a plain hand-rolled worker (no build step, no dependency): a small set
// of strategies over same-origin GETs. Data never touches it — there's nothing
// to sync — so it only ever caches the code and static files that render the UI.

const VERSION = 'bed-v1'
const CORE_CACHE = `${VERSION}-core`
const RUNTIME_CACHE = `${VERSION}-runtime`

// The app's own routes, precached on install so each one opens offline even if
// only the home page was visited before the connection dropped.
const CORE_ROUTES = ['/', '/week', '/routines', '/history', '/changelog']

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CORE_CACHE)
      // Add routes one by one rather than with addAll (which is atomic, so a
      // single 404 on a given deploy would abort the whole install). A route
      // that fails just isn't precached; the runtime cache still picks it up
      // the first time it's visited online.
      await Promise.all(
        CORE_ROUTES.map(async route => {
          try {
            const res = await fetch(route, { cache: 'no-cache' })
            if (res.ok) await cache.put(route, res)
          } catch {
            /* offline during install, or route unavailable — skip it */
          }
        })
      )
      // Take over as soon as this build's worker is installed, so a returning
      // visitor gets the newest offline shell without a second reload.
      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // Drop caches from older builds so a version bump reclaims their space.
      const keys = await caches.keys()
      await Promise.all(
        keys.filter(k => k !== CORE_CACHE && k !== RUNTIME_CACHE).map(k => caches.delete(k))
      )
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  // Only GETs are cacheable, and the app makes no cross-origin requests to
  // serve itself (fonts are self-hosted by next/font), so anything else is
  // left to the network untouched.
  if (request.method !== 'GET') return
  if (new URL(request.url).origin !== self.location.origin) return

  // Page loads: network-first, so an online visit always renders the freshest
  // build (and picks up each day's update), falling back to the cached shell —
  // the visited page, or the home page — only when the network is gone.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request)
          if (fresh && fresh.ok) {
            const cache = await caches.open(RUNTIME_CACHE)
            cache.put(request, fresh.clone())
          }
          return fresh
        } catch {
          return (
            (await caches.match(request)) ||
            (await caches.match('/')) ||
            Response.error()
          )
        }
      })()
    )
    return
  }

  // Everything else same-origin — Next's hashed JS and CSS, the self-hosted
  // fonts, the icons — is served stale-while-revalidate: answer from cache at
  // once (instant repeat loads, and it's what makes offline work), while a
  // background fetch quietly refreshes the entry so a changed asset is current
  // next time. Hashed asset URLs change per build, so a stale copy is never
  // wrong — it's simply replaced by its new-URL successor.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request)
      const network = fetch(request)
        .then(res => {
          if (res && res.ok && res.type === 'basic') {
            caches.open(RUNTIME_CACHE).then(cache => cache.put(request, res.clone()))
          }
          return res
        })
        .catch(() => undefined)
      return cached || (await network) || Response.error()
    })()
  )
})
