'use client'

import { useRef, useState } from 'react'

export default function MarketingAudioPlayer({
  audioUrl,
  label,
}: {
  audioUrl: string
  label: string
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }

    try {
      await audio.play()
      setPlaying(true)
    } catch {
      setPlaying(false)
    }
  }

  return (
    <div>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
      <button
        type="button"
        onClick={togglePlay}
        className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#38438f' }}
        aria-label={playing ? `Pause pronunciation of ${label}` : `Play pronunciation of ${label}`}
      >
        <span aria-hidden="true" className="text-xl">
          {playing ? '⏸' : '🔊'}
        </span>
        {playing ? 'Pause' : 'Play'}
      </button>
    </div>
  )
}
