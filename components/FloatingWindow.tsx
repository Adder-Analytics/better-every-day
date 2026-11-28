'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

// An always-on-top mini window for Focus mode, built on the Document
// Picture-in-Picture API (Chrome and Edge on desktop). The focused task, its
// check-off and its timer can float above whatever else you're working in.
//
// The content isn't re-created in the new window: it renders once into a
// detached host element, and that element is moved between the page and the
// floating window. React keeps the same component tree either way, so a
// running focus timer carries straight across without a reset.

type PipApi = {
  requestWindow: (opts?: { width?: number; height?: number }) => Promise<Window>
  window: Window | null
}

function pipApi(): PipApi | null {
  if (typeof window === 'undefined') return null
  const api = (window as unknown as { documentPictureInPicture?: PipApi }).documentPictureInPicture
  return api ?? null
}

const noop = () => () => {}

// Copy the page's styles and theme into the new window so the content looks the
// same there, and keep the light/dark class in step while it's open.
function mirrorPage(win: Window): () => void {
  const doc = win.document
  document.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
    doc.head.appendChild(node.cloneNode(true))
  })
  doc.title = 'Focus · Better Every Day'
  const sync = () => {
    doc.documentElement.className = document.documentElement.className
    doc.body.className = 'min-h-full p-3'
  }
  sync()
  const observer = new MutationObserver(sync)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

export function useFloatingWindow() {
  // Support is a fixed fact of the browser; read it in a hydration-safe way so
  // the server render and the first client render agree.
  const supported = useSyncExternalStore(noop, () => pipApi() !== null, () => false)
  const [win, setWin] = useState<Window | null>(null)

  const open = useCallback(async () => {
    const api = pipApi()
    if (!api) return
    try {
      const next = await api.requestWindow({ width: 340, height: 460 })
      const stop = mirrorPage(next)
      next.addEventListener('pagehide', () => {
        stop()
        setWin(null)
      }, { once: true })
      setWin(next)
    } catch {
      // Refused (no user gesture, or the browser said no) — stay in the page.
    }
  }, [])

  const close = useCallback(() => {
    win?.close()
  }, [win])

  return { supported, win, open, close }
}

// Renders its children in the page where it's placed, or inside `target`'s
// document body while a floating window is open, without remounting them.
export function MovablePortal({ target, children }: { target: Window | null; children: React.ReactNode }) {
  const [host] = useState(() => (typeof document === 'undefined' ? null : document.createElement('div')))
  const anchorRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!host) return
    const body = target?.document.body
    if (body) body.appendChild(host)
    else anchorRef.current?.appendChild(host)
  }, [host, target])

  // When the floating window closes, bring the content home at once, before
  // its document goes away.
  useEffect(() => {
    if (!host || !target) return
    const back = () => anchorRef.current?.appendChild(host)
    target.addEventListener('pagehide', back)
    return () => target.removeEventListener('pagehide', back)
  }, [host, target])

  return (
    <>
      <div ref={anchorRef} />
      {host && createPortal(children, host)}
    </>
  )
}
