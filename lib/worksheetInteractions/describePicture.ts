/**
 * A1 "Describe a Picture": the same ten pictures, carousel, microphone
 * recording, and tick-as-done behaviour as the stage-ados speaking activity.
 * Worksheet <script> tags do not run, so this is mounted from WorksheetViewer.
 * Recordings stay in this browser (IndexedDB). Ticked pictures are saved
 * with the student's worksheet notes.
 */

export type DescribePicturePersistence = {
  getTicked: () => number[]
  setTicked: (indexes: number[]) => void
}

const TICKED_KEY = 'describePictureTicked'
const DB_NAME = 'brizzle-describe-picture'
const DB_STORE = 'clips'

export function parseDescribePictureTickedFromNotes(notes: string | null | undefined): number[] {
  try {
    const parsed = JSON.parse(notes || '{}') as { describePictureTicked?: unknown }
    if (!Array.isArray(parsed.describePictureTicked)) return []
    return parsed.describePictureTicked.filter(
      (item): item is number => typeof item === 'number' && Number.isInteger(item) && item >= 0,
    )
  } catch {
    return []
  }
}

export function mergeDescribePictureTickedIntoNotes(
  notes: string | null | undefined,
  indexes: number[],
): string {
  let parsed: Record<string, unknown> = {}
  try {
    if (notes && notes.trim()) {
      const value = JSON.parse(notes) as unknown
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        parsed = { ...(value as Record<string, unknown>) }
      }
    }
  } catch {
    return notes || ''
  }

  const unique: number[] = []
  indexes.forEach((index) => {
    if (!unique.includes(index)) unique.push(index)
  })
  unique.sort((a, b) => a - b)
  parsed[TICKED_KEY] = unique
  return JSON.stringify(parsed)
}

type PictureItem = {
  src: string
  label: string
  alt: string
}

function progressText(ticked: number, total: number): string {
  return `${ticked} of ${total} pictures ticked.`
}

function clipKey(owner: string, index: number): string {
  return `${owner || 'pending'}:${index}`
}

function openRecordings(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(DB_STORE)) {
        request.result.createObjectStore(DB_STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function mountDescribePicture(
  root: HTMLElement,
  persistence: DescribePicturePersistence | undefined,
  ownerKey: string,
): () => void {
  if (root.getAttribute('data-describe-picture-mounted') === 'true') {
    return () => {}
  }

  const picture = root.querySelector('[data-dp-picture]') as HTMLImageElement | null
  const caption = root.querySelector('[data-dp-caption]')
  const status = root.querySelector('[data-dp-status]')
  const progress = root.querySelector('[data-dp-progress]')
  const feedback = root.querySelector('[data-dp-feedback]') as HTMLElement | null
  const prev = root.querySelector('[data-dp-prev]')
  const next = root.querySelector('[data-dp-next]')
  const doneButton = root.querySelector('[data-dp-done]') as HTMLButtonElement | null
  const recordButton = root.querySelector('[data-dp-record]') as HTMLButtonElement | null
  const playback = root.querySelector('[data-dp-playback]') as HTMLAudioElement | null
  const thumbButtons = Array.from(root.querySelectorAll('[data-dp-thumb]')) as HTMLButtonElement[]

  if (!picture || !caption || !doneButton || !recordButton || !playback || thumbButtons.length === 0) {
    return () => {}
  }

  const pictureEl: HTMLImageElement = picture
  const captionEl: Element = caption
  const doneEl: HTMLButtonElement = doneButton
  const recordEl: HTMLButtonElement = recordButton
  const playbackEl: HTMLAudioElement = playback

  const pictures: PictureItem[] = thumbButtons.map((button) => ({
    src: button.getAttribute('data-src') || '',
    label: button.getAttribute('data-label') || '',
    alt: button.getAttribute('data-alt') || '',
  }))

  const ticked = new Set(persistence?.getTicked() ?? [])
  const clipUrls = new Map<string, string>()
  let pictureIndex = 0
  let recordIndex = 0
  let recorder: MediaRecorder | null = null
  let recordStream: MediaStream | null = null
  let removed = false

  function rememberClip(key: string, blob: Blob) {
    const previous = clipUrls.get(key)
    if (previous) URL.revokeObjectURL(previous)
    clipUrls.set(key, URL.createObjectURL(blob))
  }

  async function storeRecording(index: number, blob: Blob) {
    const key = clipKey(ownerKey, index)
    rememberClip(key, blob)
    try {
      const db = await openRecordings()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite')
        tx.objectStore(DB_STORE).put(blob, key)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
      db.close()
    } catch {
      // Playback still works for this visit from the copy kept in memory.
    }
  }

  async function readRecording(index: number): Promise<string> {
    const key = clipKey(ownerKey, index)
    const cached = clipUrls.get(key)
    if (cached) return cached
    try {
      const db = await openRecordings()
      const blob = await new Promise<Blob | null>((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readonly')
        const request = tx.objectStore(DB_STORE).get(key)
        request.onsuccess = () => resolve((request.result as Blob | undefined) || null)
        request.onerror = () => reject(request.error)
      })
      db.close()
      if (!blob) return ''
      rememberClip(key, blob)
      return clipUrls.get(key) || ''
    } catch {
      return ''
    }
  }

  function markThumbs() {
    thumbButtons.forEach((thumb, index) => {
      thumb.classList.toggle('is-done', ticked.has(index))
    })
  }

  function showFeedback(message: string) {
    if (!feedback) return
    if (!message) {
      feedback.hidden = true
      feedback.textContent = ''
      return
    }
    feedback.hidden = false
    feedback.textContent = message
  }

  function updateProgress() {
    if (progress) progress.textContent = progressText(ticked.size, pictures.length)
  }

  function updateTools() {
    const index = pictureIndex
    const done = ticked.has(index)
    const recording = recorder !== null && recorder.state === 'recording'
    doneEl.setAttribute('aria-pressed', String(done))
    doneEl.textContent = done ? '✓ Ticked' : 'Tick this picture'
    doneEl.classList.toggle('is-done', done)
    recordEl.textContent = recording ? 'Stop' : 'Record'
    recordEl.classList.toggle('is-recording', recording)
    recordEl.setAttribute('aria-pressed', String(recording))
    markThumbs()
    updateProgress()
    playbackEl.pause()
    playbackEl.hidden = true
    if (recording && recordIndex === index) return

    void readRecording(index).then((url) => {
      if (removed || pictureIndex !== index) return
      if (recorder && recorder.state === 'recording' && recordIndex === index) return
      if (!url) {
        playbackEl.removeAttribute('src')
        playbackEl.hidden = true
        return
      }
      recordEl.textContent = 'Record again'
      if (playbackEl.getAttribute('src') !== url) playbackEl.src = url
      playbackEl.hidden = false
    })
  }

  function showPicture(index: number) {
    playbackEl.pause()
    if (recorder && recorder.state === 'recording') recorder.stop()
    pictureIndex = (index + pictures.length) % pictures.length
    const item = pictures[pictureIndex]
    pictureEl.src = item.src
    pictureEl.alt = item.alt
    const line = `${item.label} · ${pictureIndex + 1} of ${pictures.length}`
    captionEl.textContent = line
    if (status) status.textContent = line
    showFeedback('')
    thumbButtons.forEach((thumb, thumbIndex) => {
      if (thumbIndex === pictureIndex) thumb.setAttribute('aria-current', 'true')
      else thumb.removeAttribute('aria-current')
    })
    updateTools()
  }

  function toggleDone() {
    if (ticked.has(pictureIndex)) ticked.delete(pictureIndex)
    else ticked.add(pictureIndex)
    persistence?.setTicked([...ticked])
    updateTools()
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      showFeedback('This browser cannot record sound.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (removed) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      const chunks: Blob[] = []
      recordIndex = pictureIndex
      recordStream = stream
      const preferred = ['audio/webm', 'audio/mp4']
      const mimeType = preferred.find((type) => MediaRecorder.isTypeSupported(type)) || ''
      const active = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      recorder = active
      active.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data)
      }
      active.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        if (recordStream === stream) recordStream = null
        const blob = new Blob(chunks, { type: active.mimeType || 'audio/webm' })
        const index = recordIndex
        if (recorder === active) recorder = null
        void storeRecording(index, blob).then(() => {
          if (!removed && pictureIndex === index) updateTools()
        })
        updateTools()
      }
      active.start()
      showFeedback('')
      updateTools()
    } catch {
      showFeedback('Allow the microphone to record.')
      recorder = null
      updateTools()
    }
  }

  function toggleRecording() {
    if (recorder && recorder.state === 'recording') {
      recorder.stop()
      return
    }
    void startRecording()
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!root.contains(document.activeElement)) return
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      showPicture(pictureIndex + 1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      showPicture(pictureIndex - 1)
    }
  }

  const onPrev = () => showPicture(pictureIndex - 1)
  const onNext = () => showPicture(pictureIndex + 1)
  const thumbHandlers = thumbButtons.map((button, index) => {
    const handler = () => showPicture(index)
    button.addEventListener('click', handler)
    return { button, handler }
  })

  prev?.addEventListener('click', onPrev)
  next?.addEventListener('click', onNext)
  doneEl.addEventListener('click', toggleDone)
  recordEl.addEventListener('click', toggleRecording)
  root.addEventListener('keydown', onKeyDown)

  root.setAttribute('data-describe-picture-mounted', 'true')
  showPicture(0)

  return () => {
    removed = true
    root.removeAttribute('data-describe-picture-mounted')
    prev?.removeEventListener('click', onPrev)
    next?.removeEventListener('click', onNext)
    doneEl.removeEventListener('click', toggleDone)
    recordEl.removeEventListener('click', toggleRecording)
    root.removeEventListener('keydown', onKeyDown)
    thumbHandlers.forEach(({ button, handler }) => button.removeEventListener('click', handler))
    if (recorder && recorder.state === 'recording') {
      recorder.onstop = null
      try {
        recorder.stop()
      } catch {
        // The recorder may already have stopped.
      }
    }
    recordStream?.getTracks().forEach((track) => track.stop())
    recordStream = null
    recorder = null
    playbackEl.pause()
    clipUrls.forEach((url) => URL.revokeObjectURL(url))
    clipUrls.clear()
  }
}

export function mountDescribePictures(
  host: ParentNode,
  persistence: DescribePicturePersistence | undefined,
  ownerKey: string,
): () => void {
  const roots = Array.from(host.querySelectorAll('[data-describe-picture]')) as HTMLElement[]
  const detaches = roots
    .filter((el) => el.getAttribute('data-describe-picture-mounted') !== 'true')
    .map((el) => mountDescribePicture(el, persistence, ownerKey))
  return () => {
    detaches.forEach((detach) => detach())
  }
}
