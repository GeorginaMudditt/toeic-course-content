'use client'

import { useEffect, useRef } from 'react'

interface LevelCompleteCelebrationProps {
  learnerName: string
  levelLabel: string
  alphabeticalListHref: string
  categoryListHref: string
  levelColor: string
  onContinue: () => void
}

type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  decay: number
  color: string
  size: number
  gravity: number
}

type Rocket = {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  targetY: number
}

const EXTRA_COLORS = ['#ffd166', '#ffffff', '#7bdff2', '#f72585', '#ffca39', '#c77dff']

export default function LevelCompleteCelebration({
  learnerName,
  levelLabel,
  alphabeticalListHref,
  categoryListHref,
  levelColor,
  onContinue,
}: LevelCompleteCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onContinueRef = useRef(onContinue)
  onContinueRef.current = onContinue
  const greeting = learnerName ? `Congratulations ${learnerName}!` : 'Congratulations!'

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onContinueRef.current()
    }
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let animation = 0
    let launchTimer = 0
    const sparks: Spark[] = []
    const rockets: Rocket[] = []
    const palette = [levelColor, ...EXTRA_COLORS]

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const explode = (x: number, y: number, color: string, count: number, speed: number) => {
      for (let index = 0; index < count; index++) {
        const angle = (Math.PI * 2 * index) / count + Math.random() * 0.2
        const velocity = speed * (0.45 + Math.random() * 0.7)
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: 1,
          decay: 0.008 + Math.random() * 0.01,
          color: Math.random() > 0.25 ? color : '#ffffff',
          size: 1.4 + Math.random() * 2.2,
          gravity: 0.025 + Math.random() * 0.02,
        })
      }
    }

    const launch = () => {
      if (rockets.length > 5 || sparks.length > 700) return
      const color = palette[Math.floor(Math.random() * palette.length)]!
      rockets.push({
        x: canvas.width * (0.12 + Math.random() * 0.76),
        y: canvas.height + 8,
        vx: (Math.random() - 0.5) * 1.4,
        vy: -(7.5 + Math.random() * 3.5),
        color,
        targetY: canvas.height * (0.12 + Math.random() * 0.38),
      })
    }

    if (!reduceMotion) {
      launch()
      launch()
      launch()
    }

    const tick = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.globalCompositeOperation = 'lighter'

      launchTimer += 1
      if (!reduceMotion && launchTimer % 28 === 0) launch()

      for (let index = rockets.length - 1; index >= 0; index--) {
        const rocket = rockets[index]!
        rocket.x += rocket.vx
        rocket.y += rocket.vy
        rocket.vy += 0.035
        context.fillStyle = rocket.color
        context.beginPath()
        context.arc(rocket.x, rocket.y, 2.2, 0, Math.PI * 2)
        context.fill()
        sparks.push({
          x: rocket.x,
          y: rocket.y,
          vx: (Math.random() - 0.5) * 0.4,
          vy: 0.6 + Math.random(),
          life: 0.7,
          decay: 0.04,
          color: rocket.color,
          size: 1.2,
          gravity: 0.01,
        })
        if (rocket.y <= rocket.targetY || rocket.vy >= 0) {
          explode(rocket.x, rocket.y, rocket.color, 70 + Math.floor(Math.random() * 40), 2.4 + Math.random() * 2.2)
          explode(rocket.x, rocket.y, '#ffffff', 24, 1.2)
          rockets.splice(index, 1)
        }
      }

      for (let index = sparks.length - 1; index >= 0; index--) {
        const spark = sparks[index]!
        spark.life -= spark.decay
        if (spark.life <= 0) {
          sparks.splice(index, 1)
          continue
        }
        spark.vy += spark.gravity
        spark.x += spark.vx
        spark.y += spark.vy
        spark.vx *= 0.99
        context.globalAlpha = Math.max(spark.life, 0)
        context.fillStyle = spark.color
        context.beginPath()
        context.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2)
        context.fill()
      }

      context.globalAlpha = 1
      context.globalCompositeOperation = 'source-over'
      animation = requestAnimationFrame(tick)
    }

    animation = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(animation)
      window.removeEventListener('resize', resize)
    }
  }, [levelColor])

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="level-complete-title">
      <div className="absolute inset-0 bg-black/80" />
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white px-6 py-8 text-center shadow-2xl sm:px-8">
          <h2 id="level-complete-title" className="text-3xl font-bold text-gray-900">
            {greeting}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-700">
            You have completed all the vocabulary challenges at {levelLabel}. You can download the full list of words{' '}
            <a
              href={alphabeticalListHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
              style={{ color: levelColor }}
            >
              here
            </a>
            .
          </p>
          <p className="mt-3 text-base text-gray-600">
            <a
              href={categoryListHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
              style={{ color: levelColor }}
            >
              Download the list by category
            </a>
          </p>
          <button
            type="button"
            onClick={onContinue}
            className="mt-6 inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: levelColor }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
