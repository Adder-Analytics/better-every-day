'use client'

import { useEffect, useRef } from 'react'

type Particle = {
  x: number; y: number
  vx: number; vy: number
  color: string; size: number
  angle: number; spin: number
}

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6']

export default function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Particle[] = Array.from({ length: 130 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 150,
      vx: (Math.random() - 0.5) * 5,
      vy: 2 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 7,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.25,
    }))

    const start = performance.now()
    const DURATION = 3200

    const draw = (now: number) => {
      const elapsed = now - start
      if (elapsed > DURATION) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const progress = elapsed / DURATION
      const alpha = progress > 0.65 ? 1 - (progress - 0.65) / 0.35 : 1

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.12
        p.vx *= 0.995
        p.angle += p.spin

        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.5)
        ctx.restore()
      }

      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)

    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}
