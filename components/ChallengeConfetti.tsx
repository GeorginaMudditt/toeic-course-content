'use client'

import { useEffect, useRef } from 'react'

const COLORS = ['#38438f', '#ba3627', '#f5c542', '#22c55e', '#ffffff', '#e8eaf6']

type Piece = {
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy: number
  rotation: number
  spin: number
  color: string
}

export default function ChallengeConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    let frame = 0
    let animation = 0
    const pieces: Piece[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const burst = (originX: number) => {
      for (let i = 0; i < 70; i++) {
        pieces.push({
          x: originX,
          y: canvas.height * 0.32,
          w: 6 + Math.random() * 6,
          h: 8 + Math.random() * 8,
          vx: (Math.random() - 0.5) * 14,
          vy: -8 - Math.random() * 10,
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.25,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
        })
      }
    }

    burst(canvas.width * 0.28)
    burst(canvas.width * 0.72)

    const tick = () => {
      frame += 1
      context.clearRect(0, 0, canvas.width, canvas.height)
      for (const piece of pieces) {
        piece.vy += 0.28
        piece.x += piece.vx
        piece.y += piece.vy
        piece.vx *= 0.99
        piece.rotation += piece.spin
        context.save()
        context.translate(piece.x, piece.y)
        context.rotate(piece.rotation)
        context.fillStyle = piece.color
        context.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h)
        context.restore()
      }
      if (frame < 180) {
        animation = requestAnimationFrame(tick)
      }
    }

    animation = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(animation)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60]"
    />
  )
}
