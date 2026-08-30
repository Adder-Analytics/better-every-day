'use client'

import { useEffect } from 'react'

// Registers the offline service worker (see public/sw.js). It's a no-op in
// development, where a caching worker would only fight hot reload; in
// production it registers after load so it never competes with the first paint.
// Once installed, the planner opens and runs with no network — fitting for an
// app whose data never leaves the browser to begin with. Renders nothing.
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const register = () => {
      // A failed registration just means no offline support; the app still
      // works online, so there's nothing to surface to the user.
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch(() => {})
    }

    if (document.readyState === 'complete') {
      register()
      return
    }
    window.addEventListener('load', register)
    return () => window.removeEventListener('load', register)
  }, [])

  return null
}
