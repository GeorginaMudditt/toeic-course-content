/**
 * A1 speaking topic cards: a face-down fan, a flutter-and-flip draw,
 * and a one-minute countdown. Worksheet <script> tags do not run, so
 * this is mounted from WorksheetViewer.
 */

type Pose = { x: number; y: number; angle: number; scale: number }
type CardStatus = 'fan' | 'flying' | 'active' | 'discard'

type CardRecord = {
  el: HTMLButtonElement
  inner: HTMLElement
  topicEl: HTMLElement
  topic: string
  status: CardStatus
  pose: Pose
}

const RING_LENGTH = 2 * Math.PI * 52
const DEFAULT_TOPICS = [
  'My family',
  'My house',
  'Sport',
  'Food',
  'Animals',
  'Hobbies',
  'Clothes',
  'Holidays',
  'My job',
  'My day',
  'My town',
  'The weather',
  'My friends',
  'Music',
  'Shopping',
  'The weekend',
  'Films',
]

function shuffle<T>(items: T[]): T[] {
  const next = items.slice()
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
  }
  return next
}

function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function relBox(el: HTMLElement, table: HTMLElement): DOMRect {
  const a = el.getBoundingClientRect()
  const b = table.getBoundingClientRect()
  return new DOMRect(a.left - b.left, a.top - b.top, a.width, a.height)
}

function poseToTransform(pose: Pose): string {
  return `translate(${pose.x}px, ${pose.y}px) rotate(${pose.angle}deg) scale(${pose.scale})`
}

function playTimeUpSound(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()
    const playBeep = (delaySeconds: number) => {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.frequency.value = 880
      oscillator.type = 'sine'
      const startAt = ctx.currentTime + delaySeconds
      gain.gain.setValueAtTime(0.0001, startAt)
      gain.gain.exponentialRampToValueAtTime(0.22, startAt + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.28)
      oscillator.start(startAt)
      oscillator.stop(startAt + 0.3)
    }

    playBeep(0)
    playBeep(0.32)
    playBeep(0.64)
    window.setTimeout(() => void ctx.close(), 1400)
  } catch {
    // Audio may be blocked until a user gesture.
  }
}

function parseTopics(raw: string | null): string[] {
  const fromAttr = (raw || '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
  return fromAttr.length > 0 ? fromAttr : DEFAULT_TOPICS.slice()
}

function mountSpeakingTopicsPack(root: HTMLElement): () => void {
  if (root.getAttribute('data-speaking-topics-mounted') === 'true') {
    return () => {}
  }

  const table = root.querySelector('.st-table') as HTMLElement | null
  const fanArea = root.querySelector('[data-st-fan]') as HTMLElement | null
  const slot = root.querySelector('[data-st-slot]') as HTMLElement | null
  const discardEl = root.querySelector('[data-st-discard]') as HTMLElement | null
  const timerEl = root.querySelector('[data-st-timer]') as HTMLElement | null
  const timeEl = root.querySelector('[data-st-time]') as HTMLElement | null
  const ringEl = root.querySelector('[data-st-ring]') as SVGGeometryElement | null
  const startBtn = root.querySelector('[data-st-start]') as HTMLButtonElement | null
  const statusEl = root.querySelector('[data-st-status]') as HTMLElement | null
  const newPackBtn = root.querySelector('[data-st-new-pack]') as HTMLButtonElement | null

  if (!table || !fanArea || !slot || !discardEl || !timerEl || !timeEl || !startBtn || !newPackBtn) {
    return () => {}
  }

  const totalSeconds = Math.max(
    5,
    Number.parseInt(root.getAttribute('data-seconds') || '60', 10) || 60,
  )

  const cleanups: Array<() => void> = []
  const cards: CardRecord[] = []
  let busy = false
  let remainingSeconds = totalSeconds
  let intervalId: ReturnType<typeof setInterval> | null = null
  let hoverCard: HTMLButtonElement | null = null

  const stopTimer = () => {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  const setRing = (secondsLeft: number) => {
    if (!ringEl) return
    const progress = secondsLeft / totalSeconds
    ringEl.style.strokeDasharray = String(RING_LENGTH)
    ringEl.style.strokeDashoffset = String(RING_LENGTH * (1 - progress))
  }

  const showTime = (secondsLeft: number, expired = false) => {
    remainingSeconds = secondsLeft
    timerEl.classList.toggle('is-low', !expired && secondsLeft > 0 && secondsLeft <= 10)
    timerEl.classList.toggle('is-up', expired)
    timeEl.textContent = expired ? "Time's up!" : formatTime(secondsLeft)
    setRing(expired ? 0 : secondsLeft)
  }

  const resetTimer = (enableStart: boolean) => {
    stopTimer()
    showTime(totalSeconds, false)
    startBtn.disabled = !enableStart
    startBtn.textContent = 'Start'
  }

  const startTimer = () => {
    if (startBtn.disabled) return
    stopTimer()
    showTime(totalSeconds, false)
    startBtn.textContent = 'Reset'
    intervalId = setInterval(() => {
      const next = remainingSeconds - 1
      if (next <= 0) {
        stopTimer()
        showTime(0, true)
        startBtn.textContent = 'Start'
        playTimeUpSound()
        return
      }
      showTime(next, false)
    }, 1000)
  }

  const fanCards = () => cards.filter((card) => card.status === 'fan')
  const discardCards = () => cards.filter((card) => card.status === 'discard')
  const activeCard = () => cards.find((card) => card.status === 'active') || null

  const updateStatus = () => {
    const left = fanCards().length
    if (statusEl) {
      statusEl.textContent =
        left === 0 ? 'No cards left.' : left === 1 ? '1 card left.' : `${left} cards left.`
    }
    newPackBtn.classList.toggle('is-visible', left === 0)
    slot.classList.toggle('is-filled', Boolean(activeCard()) || discardCards().length > 0)
  }

  const cardSize = () => {
    const sample = cards[0]?.el
    return {
      width: sample?.offsetWidth || 150,
      height: sample?.offsetHeight || 210,
    }
  }

  const fanPoseFor = (index: number, count: number): Pose => {
    const { width, height } = cardSize()
    const area = relBox(fanArea, table)
    const t = count <= 1 ? 0.5 : index / (count - 1)
    const spread = Math.min(area.width * 0.78, count > 12 ? 360 : 300)
    const maxAngle = count > 12 ? 36 : 30
    const angle = -maxAngle + t * maxAngle * 2
    const x = area.x + area.width / 2 - width / 2 + (t - 0.5) * spread
    const lift = Math.pow(Math.abs(t - 0.5), 2) * Math.min(90, area.height * 0.28)
    const y = area.y + area.height * 0.12 + lift
    return { x, y: y + height * 0.02, angle, scale: 1 }
  }

  const slotPose = (): Pose => {
    const box = relBox(slot, table)
    return { x: box.x, y: box.y, angle: 2, scale: 1 }
  }

  const discardPoseFor = (index: number): Pose => {
    const box = relBox(discardEl, table)
    const { width, height } = cardSize()
    const scale = 0.42
    return {
      x: box.x + index * 8 - (width * (1 - scale)) / 2,
      y: box.y + index * 4 - (height * (1 - scale)) / 2,
      angle: -10 + (index % 4) * 4,
      scale,
    }
  }

  const applyPose = (card: CardRecord, pose: Pose) => {
    card.pose = pose
    card.el.style.transform = poseToTransform(pose)
  }

  const setFlipped = (card: CardRecord, flipped: boolean, animate: boolean) => {
    const end = flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
    card.inner.getAnimations().forEach((animation) => animation.cancel())
    if (!animate || prefersReducedMotion()) {
      card.inner.style.transform = end
      return
    }
    const animation = card.inner.animate(
      [{ transform: flipped ? 'rotateY(0deg)' : 'rotateY(180deg)' }, { transform: end }],
      {
        duration: 520,
        easing: 'cubic-bezier(0.22, 0.8, 0.28, 1)',
        fill: 'forwards',
      },
    )
    animation.finished
      .then(() => {
        animation.cancel()
        card.inner.style.transform = end
      })
      .catch(() => {
        card.inner.style.transform = end
      })
  }

  const layoutFan = (animate: boolean) => {
    const remaining = fanCards()
    remaining.forEach((card, index) => {
      const pose = fanPoseFor(index, remaining.length)
      card.el.style.zIndex = String(20 + index)
      card.el.classList.add('is-fan')
      card.el.disabled = false
      const lift = hoverCard === card.el ? { ...pose, y: pose.y - 16 } : pose
      if (!animate || prefersReducedMotion()) {
        card.el.getAnimations().forEach((animation) => animation.cancel())
        applyPose(card, lift)
        return
      }
      void animateTo(card, lift, 280, false)
    })
  }

  const layoutDiscards = () => {
    discardCards().forEach((card, index) => {
      card.el.classList.remove('is-fan')
      card.el.disabled = true
      card.el.style.zIndex = String(8 + index)
      applyPose(card, discardPoseFor(index))
    })
  }

  const animateTo = (card: CardRecord, end: Pose, duration: number, flutter: boolean): Promise<void> => {
    const start = card.pose
    applyPose(card, end)
    if (prefersReducedMotion() || duration <= 0) return Promise.resolve()

    const lerp = (from: number, to: number, t: number) => from + (to - from) * t
    const keyframes: Keyframe[] = flutter
      ? [
          { transform: poseToTransform(start), offset: 0 },
          {
            transform: poseToTransform({
              x: lerp(start.x, end.x, 0.22) + 18,
              y: lerp(start.y, end.y, 0.18) - 42,
              angle: start.angle + 16,
              scale: 1.07,
            }),
            offset: 0.28,
          },
          {
            transform: poseToTransform({
              x: lerp(start.x, end.x, 0.68) - 14,
              y: lerp(start.y, end.y, 0.62) - 10,
              angle: end.angle - 11,
              scale: 1.04,
            }),
            offset: 0.58,
          },
          { transform: poseToTransform(end), offset: 1 },
        ]
      : [{ transform: poseToTransform(start) }, { transform: poseToTransform(end) }]

    const animation = card.el.animate(keyframes, {
      duration,
      easing: 'cubic-bezier(0.2, 0.75, 0.25, 1)',
      fill: 'forwards',
    })
    return animation.finished
      .then(() => {
        animation.cancel()
        applyPose(card, end)
      })
      .catch(() => {
        applyPose(card, end)
      })
  }

  const dealCard = async (card: CardRecord) => {
    if (busy || card.status !== 'fan') return
    busy = true
    hoverCard = null

    const current = activeCard()
    if (current) {
      current.status = 'discard'
      current.el.classList.remove('is-fan')
      current.el.disabled = true
      void animateTo(current, discardPoseFor(discardCards().length - 1), 420, false)
    }

    card.status = 'flying'
    card.el.classList.remove('is-fan')
    card.el.disabled = true
    card.el.style.zIndex = '80'
    const landing = slotPose()
    setFlipped(card, true, true)
    await animateTo(card, landing, prefersReducedMotion() ? 0 : 820, true)
    card.status = 'active'
    card.el.setAttribute('aria-label', card.topic)
    card.el.style.zIndex = '40'
    layoutFan(true)
    layoutDiscards()
    resetTimer(true)
    updateStatus()
    busy = false
  }

  const rebuildPack = () => {
    stopTimer()
    hoverCard = null
    const topics = shuffle(cards.map((card) => card.topic))
    cards.forEach((card, index) => {
      card.el.getAnimations().forEach((animation) => animation.cancel())
      card.inner.getAnimations().forEach((animation) => animation.cancel())
      card.topic = topics[index]
      card.topicEl.textContent = topics[index]
      card.el.setAttribute('aria-label', 'Face-down topic card')
      card.status = 'fan'
      card.el.classList.add('is-fan')
      card.el.disabled = false
      setFlipped(card, false, false)
    })
    layoutFan(false)
    resetTimer(false)
    updateStatus()
  }

  const topics = shuffle(parseTopics(root.getAttribute('data-topics')))
  topics.forEach((topic) => {
    const el = document.createElement('button')
    el.type = 'button'
    el.className = 'st-card is-fan'
    el.setAttribute('aria-label', 'Face-down topic card')
    el.innerHTML = `
      <div class="st-card-inner">
        <div class="st-card-back"></div>
        <div class="st-card-face">
          <div class="st-card-topic"></div>
          <div class="st-card-prompt">Talk for 1 minute</div>
        </div>
      </div>
    `
    const inner = el.querySelector('.st-card-inner') as HTMLElement
    const topicEl = el.querySelector('.st-card-topic') as HTMLElement
    topicEl.textContent = topic
    table.appendChild(el)

    const record: CardRecord = {
      el,
      inner,
      topicEl,
      topic,
      status: 'fan',
      pose: { x: 0, y: 0, angle: 0, scale: 1 },
    }
    cards.push(record)

    const onClick = () => {
      void dealCard(record)
    }
    const onEnter = () => {
      if (record.status !== 'fan' || busy) return
      hoverCard = el
      layoutFan(false)
    }
    const onLeave = () => {
      if (hoverCard === el) hoverCard = null
      if (record.status === 'fan') layoutFan(false)
    }

    el.addEventListener('click', onClick)
    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
    el.addEventListener('focus', onEnter)
    el.addEventListener('blur', onLeave)
    cleanups.push(() => {
      el.removeEventListener('click', onClick)
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
      el.removeEventListener('focus', onEnter)
      el.removeEventListener('blur', onLeave)
      el.remove()
    })
  })

  const onStart = () => {
    if (startBtn.textContent === 'Reset' && intervalId !== null) {
      resetTimer(true)
      return
    }
    startTimer()
  }
  const onNewPack = () => rebuildPack()
  startBtn.addEventListener('click', onStart)
  newPackBtn.addEventListener('click', onNewPack)
  cleanups.push(() => startBtn.removeEventListener('click', onStart))
  cleanups.push(() => newPackBtn.removeEventListener('click', onNewPack))

  const onResize = () => {
    layoutFan(false)
    const current = activeCard()
    if (current) applyPose(current, slotPose())
    layoutDiscards()
  }
  window.addEventListener('resize', onResize)
  cleanups.push(() => window.removeEventListener('resize', onResize))

  layoutFan(false)
  resetTimer(false)
  updateStatus()
  root.setAttribute('data-speaking-topics-mounted', 'true')

  return () => {
    stopTimer()
    cards.forEach((card) => {
      card.el.getAnimations().forEach((animation) => animation.cancel())
      card.inner.getAnimations().forEach((animation) => animation.cancel())
    })
    cleanups.forEach((fn) => fn())
    root.removeAttribute('data-speaking-topics-mounted')
  }
}

export function mountSpeakingTopicsPacks(host: HTMLElement): () => void {
  const roots = Array.from(host.querySelectorAll('[data-speaking-topics]')) as HTMLElement[]
  const cleanups = roots
    .filter((el) => el.getAttribute('data-speaking-topics-mounted') !== 'true')
    .map((el) => mountSpeakingTopicsPack(el))
  return () => cleanups.forEach((fn) => fn())
}
