function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
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
      gain.gain.exponentialRampToValueAtTime(0.28, startAt + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.28)
      oscillator.start(startAt)
      oscillator.stop(startAt + 0.3)
    }

    playBeep(0)
    playBeep(0.35)
    playBeep(0.7)
    window.setTimeout(() => void ctx.close(), 1500)
  } catch {
    // Audio may be blocked until user gesture; ignore.
  }
}

/** Wire countdown timers for TOEIC writing practice (emails + essay). */
export function mountWritingPracticeTimers(root: HTMLElement): () => void {
  const hosts = Array.from(
    root.querySelectorAll('[data-writing-timer-minutes]:not([data-writing-timer-mounted])'),
  ) as HTMLElement[]

  if (hosts.length === 0) {
    return () => {}
  }

  const cleanups: (() => void)[] = []

  hosts.forEach((host) => {
    const minutes = Number.parseInt(host.getAttribute('data-writing-timer-minutes') || '10', 10)
    const totalSeconds = Number.isFinite(minutes) && minutes > 0 ? minutes * 60 : 600
    const label =
      host.getAttribute('data-writing-timer-label') ||
      `Start the ${minutes === 30 ? 'thirty' : 'ten'} minute timer`

    const wrapper = document.createElement('div')
    wrapper.className = 'itw-writing-timer'

    const startButton = document.createElement('button')
    startButton.type = 'button'
    startButton.className = 'itw-writing-timer-start'
    startButton.textContent = label

    const display = document.createElement('div')
    display.className = 'itw-writing-timer-display'
    display.hidden = true
    display.setAttribute('role', 'timer')
    display.setAttribute('aria-live', 'polite')

    let remainingSeconds = totalSeconds
    let intervalId: ReturnType<typeof setInterval> | null = null

    const stopInterval = () => {
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    const triggerTimeUp = () => {
      stopInterval()
      display.textContent = "Time's up!"
      display.classList.add('itw-writing-timer-expired')
      wrapper.classList.add('itw-writing-timer-shake')
      playTimeUpSound()
      window.setTimeout(() => wrapper.classList.remove('itw-writing-timer-shake'), 700)
    }

    const tick = () => {
      remainingSeconds -= 1
      if (remainingSeconds <= 0) {
        triggerTimeUp()
        return
      }
      display.textContent = formatCountdown(remainingSeconds)
    }

    const startTimer = () => {
      remainingSeconds = totalSeconds
      display.textContent = formatCountdown(remainingSeconds)
      display.hidden = false
      display.classList.remove('itw-writing-timer-expired')
      startButton.hidden = true
      stopInterval()
      intervalId = setInterval(tick, 1000)
    }

    startButton.addEventListener('click', startTimer)
    cleanups.push(() => {
      stopInterval()
      startButton.removeEventListener('click', startTimer)
    })

    wrapper.appendChild(startButton)
    wrapper.appendChild(display)
    host.appendChild(wrapper)
    host.setAttribute('data-writing-timer-mounted', 'true')
  })

  return () => {
    cleanups.forEach((fn) => fn())
    hosts.forEach((host) => {
      host.removeAttribute('data-writing-timer-mounted')
      host.querySelector('.itw-writing-timer')?.remove()
    })
  }
}
