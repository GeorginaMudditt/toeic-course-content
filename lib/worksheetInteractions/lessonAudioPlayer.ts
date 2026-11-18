/**
 * Custom listening player for lesson worksheets.
 * Inline scripts in resource HTML do not run, so WorksheetViewer mounts this.
 *
 * Markup: [data-lesson-audio] with data-audio-src, an <audio> element, and
 * buttons [data-audio-action="play|back|forward|speed"].
 */

const SKIP_SECONDS = 10

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const minutes = Math.floor(total / 60)
  const secs = total % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function mountLessonAudioPlayers(root: HTMLElement): () => void {
  const cleanups: Array<() => void> = []

  root.querySelectorAll<HTMLElement>('[data-lesson-audio]').forEach((player) => {
    if (player.getAttribute('data-lesson-audio-mounted') === 'true') return

    const src = player.getAttribute('data-audio-src') || ''
    const audio = player.querySelector('audio')
    if (!audio || !src) return

    const playBtn = player.querySelector<HTMLButtonElement>('[data-audio-action="play"]')
    const backBtn = player.querySelector<HTMLButtonElement>('[data-audio-action="back"]')
    const forwardBtn = player.querySelector<HTMLButtonElement>('[data-audio-action="forward"]')
    const speedButtons = Array.from(
      player.querySelectorAll<HTMLButtonElement>('[data-audio-action="speed"]')
    )
    const seek = player.querySelector<HTMLInputElement>('[data-audio-seek]')
    const timeEl = player.querySelector<HTMLElement>('[data-audio-time]')
    const status = player.querySelector<HTMLElement>('[data-audio-status]')

    audio.preload = 'metadata'
    audio.setAttribute('playsinline', '')
    audio.src = src

    const setSpeed = (rate: number) => {
      audio.playbackRate = rate
      speedButtons.forEach((button) => {
        const active = Number(button.getAttribute('data-speed')) === rate
        button.setAttribute('aria-pressed', active ? 'true' : 'false')
      })
    }

    const paintTime = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0
      if (timeEl) {
        const total = duration > 0 ? formatTime(duration) : '–:––'
        timeEl.textContent = `${formatTime(audio.currentTime)} / ${total}`
      }
      if (seek && duration > 0 && document.activeElement !== seek) {
        seek.value = String((audio.currentTime / duration) * 100)
      }
    }

    const onPlayClick = () => {
      if (audio.paused) {
        void audio.play().catch(() => {
          if (status) status.textContent = 'The recording is not available yet.'
        })
      } else {
        audio.pause()
      }
    }

    const onBack = () => {
      audio.currentTime = Math.max(0, audio.currentTime - SKIP_SECONDS)
      paintTime()
    }

    const onForward = () => {
      const end = Number.isFinite(audio.duration) ? audio.duration : audio.currentTime + SKIP_SECONDS
      audio.currentTime = Math.min(end, audio.currentTime + SKIP_SECONDS)
      paintTime()
    }

    const onSeek = () => {
      if (!seek || !Number.isFinite(audio.duration) || audio.duration <= 0) return
      audio.currentTime = (Number(seek.value) / 100) * audio.duration
      paintTime()
    }

    const onPlay = () => {
      if (playBtn) playBtn.textContent = 'Pause'
    }

    const onPause = () => {
      if (playBtn) playBtn.textContent = 'Play'
    }

    const onError = () => {
      if (status) status.textContent = 'The recording is not available yet.'
    }

    const onReady = () => {
      if (status && audio.error == null) status.textContent = ''
      paintTime()
    }

    setSpeed(1)
    paintTime()

    playBtn?.addEventListener('click', onPlayClick)
    backBtn?.addEventListener('click', onBack)
    forwardBtn?.addEventListener('click', onForward)
    seek?.addEventListener('input', onSeek)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('timeupdate', paintTime)
    audio.addEventListener('loadedmetadata', onReady)
    audio.addEventListener('canplay', onReady)
    audio.addEventListener('error', onError)

    const speedCleanups: Array<() => void> = []
    speedButtons.forEach((button) => {
      const onSpeed = () => setSpeed(Number(button.getAttribute('data-speed')) || 1)
      button.addEventListener('click', onSpeed)
      speedCleanups.push(() => button.removeEventListener('click', onSpeed))
    })

    player.setAttribute('data-lesson-audio-mounted', 'true')

    cleanups.push(() => {
      playBtn?.removeEventListener('click', onPlayClick)
      backBtn?.removeEventListener('click', onBack)
      forwardBtn?.removeEventListener('click', onForward)
      seek?.removeEventListener('input', onSeek)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('timeupdate', paintTime)
      audio.removeEventListener('loadedmetadata', onReady)
      audio.removeEventListener('canplay', onReady)
      audio.removeEventListener('error', onError)
      speedCleanups.forEach((fn) => fn())
      audio.pause()
      player.removeAttribute('data-lesson-audio-mounted')
    })
  })

  return () => {
    cleanups.forEach((fn) => fn())
  }
}
