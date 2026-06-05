/** Wire up static phrase-audio-btn elements inside a worksheet content root. */
export function mountPhraseAudioButtons(root: HTMLElement): () => void {
  if (root.getAttribute('data-phrase-audio-mounted') === 'true') {
    return () => {}
  }

  const cleanups: (() => void)[] = []
  const audioCache = new Map<string, HTMLAudioElement>()

  root.querySelectorAll('button.phrase-audio-btn').forEach((node) => {
    const btn = node as HTMLButtonElement
    const src = btn.getAttribute('data-audio-src') || ''
    if (!src) return

    btn.disabled = false
    const handler = () => {
      let audio = audioCache.get(src)
      if (!audio) {
        audio = new Audio(src)
        audioCache.set(src, audio)
      }
      audio.currentTime = 0
      void audio.play().catch(() => {})
    }
    btn.addEventListener('click', handler)
    cleanups.push(() => btn.removeEventListener('click', handler))
  })

  root.setAttribute('data-phrase-audio-mounted', 'true')

  return () => {
    cleanups.forEach((fn) => fn())
    root.removeAttribute('data-phrase-audio-mounted')
  }
}
