/**
 * Drag-and-drop matching for "Giving Information and Answering Questions".
 * Mounted from WorksheetViewer / ResourcePreview (inline <script> in resource HTML does not run).
 */

type MatchItem = { prompt: string; answer: string; audio?: string; answerAudio?: string }

const DIRECTIONS_AUDIO_BASE = '/images/everyday-english/directions-audio/'
const QUESTIONS_AUDIO_BASE = '/images/everyday-english/questions-audio/'
const ANSWERS_AUDIO_BASE = '/images/everyday-english/answers-audio/'

function matchAudioUrl(base: string, filename: string): string {
  return base + encodeURIComponent(filename)
}

type MatchLabels = {
  promptColumn: string
  answerColumn: string
  dropPlaceholder: string
}

const DIRECTIONS_ITEMS: MatchItem[] = [
  { prompt: 'Turn left.', answer: 'Tournez à gauche.', audio: 'turn-left.mp3' },
  { prompt: 'Turn right.', answer: 'Tournez à droite.', audio: 'turn-right.mp3' },
  { prompt: 'Go straight ahead.', answer: 'Continuez tout droit.', audio: 'go-straight-ahead.mp3' },
  { prompt: 'Go around the corner.', answer: 'Tournez au coin de la rue.', audio: 'go-around-the-corner.mp3' },
  {
    prompt: 'Continue for about a kilometre.',
    answer: 'Continuez pendant environ un kilomètre.',
    audio: 'continue-for-about-a-kilometre.mp3',
  },
  { prompt: 'Go past the school.', answer: 'Passez devant l\'école.', audio: 'go-past-the-school.mp3' },
  {
    prompt: 'At the roundabout, take the second exit.',
    answer: 'Au rond-point, prenez la deuxième sortie.',
    audio: 'at-the-roundabout-take-the-second-exit.mp3',
  },
  {
    prompt: 'It\u2019s next to the museum.',
    answer: 'C\u2019est à côté du musée.',
    audio: 'its-next-to-the-museum.mp3',
  },
  {
    prompt: 'It\u2019s behind the museum.',
    answer: 'C\u2019est derrière le musée.',
    audio: 'its-behind-the-museum.mp3',
  },
  {
    prompt: 'It\u2019s opposite the museum.',
    answer: 'C\u2019est en face du musée.',
    audio: 'its-opposite-the-museum.mp3',
  },
  {
    prompt: 'It\u2019s between the museum and the café.',
    answer: 'C\u2019est entre le musée et le café.',
    audio: 'its-between-the-museum-and-the-cafe.mp3',
  },
  { prompt: 'It\u2019s on the left.', answer: 'C\u2019est à gauche.', audio: 'its-on-the-left.mp3' },
  { prompt: 'It\u2019s on the right.', answer: 'C\u2019est à droite.', audio: 'its-on-the-right.mp3' },
  {
    prompt: 'It\u2019s at the end of the street.',
    answer: 'C\u2019est au bout de la rue.',
    audio: 'its-at-the-end-of-the-street.mp3',
  },
]

const QA_ITEMS: MatchItem[] = [
  {
    prompt: 'Is there a restaurant?',
    answer: 'Yes, there is. It is open every day in summer.',
    audio: 'is-there-a-restaurant.mp3',
    answerAudio: 'yes-there-is-it-is-open-every-day-in-summer.mp3',
  },
  {
    prompt: 'Where is the nearest bank?',
    answer: 'Turn left, then it\u2019s opposite the town hall.',
    audio: 'where-is-the-nearest-bank.mp3',
    answerAudio: 'turn-left-then-its-opposite-the-town-hall.mp3',
  },
  {
    prompt: 'How long does it take to walk to the beach?',
    answer: 'About ten minutes.',
    audio: 'how-long-does-it-take-to-walk-to-the-beach.mp3',
    answerAudio: 'about-ten-minutes.mp3',
  },
  {
    prompt: 'Is there public transport available?',
    answer: 'I\u2019m afraid not. You have to drive.',
    audio: 'is-there-public-transport-available.mp3',
    answerAudio: 'im-afraid-not-you-have-to-drive.mp3',
  },
  {
    prompt: 'Is the activity suitable for beginners?',
    answer: 'Yes \u2013 no previous experience is necessary.',
    audio: 'is-the-activity-suitable-for-beginners.mp3',
    answerAudio: 'yes-no-previous-experience-is-necessary.mp3',
  },
  {
    prompt: 'Can I pay by credit card?',
    answer: 'Yes, you can.',
    audio: 'can-i-pay-by-credit-card.mp3',
    answerAudio: 'yes-you-can.mp3',
  },
  {
    prompt: 'What time does the activity start?',
    answer: 'Half past ten.',
    audio: 'what-time-does-the-activity-start.mp3',
    answerAudio: 'half-past-ten.mp3',
  },
  {
    prompt: 'Where can I buy tickets?',
    answer: 'Online or at reception.',
    audio: 'where-can-i-buy-tickets.mp3',
    answerAudio: 'online-or-at-reception.mp3',
  },
]

const PP_PHRASAL_VERB_ITEMS: MatchItem[] = [
  { prompt: 'fill in for', answer: 'to temporarily do someone else\u2019s job or duties' },
  { prompt: 'put off', answer: 'to postpone or delay something' },
  { prompt: 'own up to', answer: 'to admit to something, especially a mistake' },
  { prompt: 'cover up', answer: 'to hide or conceal something, especially a mistake' },
  { prompt: 'catch up on', answer: 'to deal with work that has accumulated' },
  { prompt: 'fall behind on', answer: 'to fail to keep up with something' },
  { prompt: 'follow through on', answer: 'to complete what you promised to do' },
  { prompt: 'back out of', answer: 'to withdraw from a commitment or agreement' },
  { prompt: 'come down to', answer: 'to be ultimately a matter of; to depend on' },
  { prompt: 'stem from', answer: 'to originate from or be caused by' },
]

const PP_DEPENDENT_PREP_ITEMS: MatchItem[] = [
  { prompt: 'responsible for', answer: 'having a duty to deal with or take care of something' },
  { prompt: 'access to', answer: 'the right or ability to use or see something' },
  { prompt: 'dependent on', answer: 'determined or affected by; relying on' },
  { prompt: 'confident in', answer: 'feeling sure about your ability or judgement' },
  { prompt: 'involved in', answer: 'taking part in or connected with an activity' },
  { prompt: 'open to', answer: 'willing to consider or accept something' },
  { prompt: 'curious about', answer: 'interested in finding out more about something' },
  { prompt: 'capable of', answer: 'having the ability or qualities to do something' },
  { prompt: 'focused on', answer: 'giving attention or effort mainly to something' },
  { prompt: 'comfortable with', answer: 'at ease with a situation or way of behaving' },
]

const CONFIG: Record<
  string,
  { items: MatchItem[]; labels: MatchLabels; audioBase?: string; chipAudioBase?: string }
> = {
  'pp-phrasal-verbs': {
    items: PP_PHRASAL_VERB_ITEMS,
    labels: {
      promptColumn: 'Phrasal verb',
      answerColumn: 'Meaning \u2014 drag left \u2192',
      dropPlaceholder: 'Drag meaning here',
    },
  },
  'pp-dependent-prepositions': {
    items: PP_DEPENDENT_PREP_ITEMS,
    labels: {
      promptColumn: 'Expression',
      answerColumn: 'Meaning \u2014 drag left \u2192',
      dropPlaceholder: 'Drag meaning here',
    },
  },
  directions: {
    items: DIRECTIONS_ITEMS,
    labels: {
      promptColumn: 'English',
      answerColumn: 'French \u2014 drag left \u2192',
      dropPlaceholder: 'Drag French here',
    },
    audioBase: DIRECTIONS_AUDIO_BASE,
  },
  'questions-answers': {
    items: QA_ITEMS,
    labels: {
      promptColumn: 'Question',
      answerColumn: 'Answer \u2014 drag left \u2192',
      dropPlaceholder: 'Drag answer here',
    },
    audioBase: QUESTIONS_AUDIO_BASE,
    chipAudioBase: ANSWERS_AUDIO_BASE,
  },
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export type GiaqActivityPersistence = {
  getMatchPlacements: (matchKey: string) => Record<string, string>
  setMatchPlacements: (matchKey: string, placements: Record<string, string>) => void
}

export function parseGiaqMatchPlacementsFromNotes(
  notes: string,
  matchKey: string,
): Record<string, string> {
  try {
    const parsed = JSON.parse(notes || '{}') as {
      giaq?: { match?: Record<string, Record<string, string>> }
    }
    return parsed.giaq?.match?.[matchKey] ?? {}
  } catch {
    return {}
  }
}

export function mergeGiaqMatchPlacementsIntoNotes(
  notes: string,
  matchKey: string,
  placements: Record<string, string>,
): string {
  let parsed: Record<string, unknown> = {}
  try {
    if (notes.trim()) parsed = JSON.parse(notes) as Record<string, unknown>
  } catch {
    parsed = {}
  }
  const giaq = (
    parsed.giaq && typeof parsed.giaq === 'object' ? parsed.giaq : {}
  ) as Record<string, unknown>
  const match = (
    giaq.match && typeof giaq.match === 'object' ? giaq.match : {}
  ) as Record<string, Record<string, string>>
  match[matchKey] = placements
  giaq.match = match
  parsed.giaq = giaq
  return JSON.stringify(parsed)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function mountKlDragDropMatch(
  root: HTMLElement,
  items: MatchItem[],
  labels: MatchLabels,
  audioBase?: string,
  chipAudioBase?: string,
  options?: { matchKey?: string; persistence?: GiaqActivityPersistence },
): () => void {
  let selectedChip: HTMLElement | null = null
  let drops: HTMLElement[] = []
  let chipSlots: HTMLElement[] = []
  let statusEl: HTMLElement | null = null
  const cleanups: (() => void)[] = []

  const on = (el: HTMLElement, type: string, fn: EventListener) => {
    el.addEventListener(type, fn)
    cleanups.push(() => el.removeEventListener(type, fn))
  }

  const audioCache = new Map<string, HTMLAudioElement>()

  let rowIndex = 0
  const allRows = items
    .map((item) => {
      rowIndex += 1
      const id = `giaq-${rowIndex}`
      const audioBtn =
        item.audio && audioBase
          ? `<button type="button" class="phrase-audio-btn" data-audio-src="${escapeHtml(matchAudioUrl(audioBase, item.audio))}" aria-label="Listen: ${escapeHtml(item.prompt)}">🔊</button>`
          : ''
      return `
        <div class="kl-table-row">
          <div class="kl-cell kl-cell--en">
            ${audioBtn}
            <span class="kl-en-text">${escapeHtml(item.prompt)}</span>
          </div>
          <div class="kl-cell kl-cell--drop">
            <div class="kl-drop" data-drop-for="${id}" data-correct="${escapeHtml(item.answer)}">
              <span class="kl-drop-placeholder">${escapeHtml(labels.dropPlaceholder)}</span>
            </div>
          </div>
          <div class="kl-cell kl-cell--source">
            <div class="kl-chip-slot" data-kl-chip-slot="${id}"></div>
          </div>
        </div>`
    })
    .join('')

  root.innerHTML = `
    <div class="kl-board not-prose">
      <div class="kl-table">
        <div class="kl-table-head" aria-hidden="true">
          <span>${escapeHtml(labels.promptColumn)}</span>
          <span>Your answer</span>
          <span>${escapeHtml(labels.answerColumn)}</span>
        </div>
        ${allRows}
      </div>
      <div class="kl-actions">
        <button type="button" class="kl-btn" data-kl-check="true">Check answers</button>
        <button type="button" class="kl-btn kl-btn--secondary" data-kl-reset="true">Reset</button>
        <span class="kl-status" data-kl-status="true"></span>
      </div>
    </div>
  `

  drops = Array.from(root.querySelectorAll('.kl-drop'))
  chipSlots = Array.from(root.querySelectorAll('[data-kl-chip-slot]'))
  statusEl = root.querySelector('[data-kl-status="true"]')
  const checkBtn = root.querySelector('[data-kl-check="true"]') as HTMLButtonElement | null
  const resetBtn = root.querySelector('[data-kl-reset="true"]') as HTMLButtonElement | null
  if (!chipSlots.length || !statusEl || !checkBtn || !resetBtn) {
    return () => {}
  }

  const translations = drops
    .map((d) => d.getAttribute('data-correct') || '')
    .filter(Boolean)

  const answerAudioByText = new Map<string, string>()
  if (chipAudioBase) {
    items.forEach((item) => {
      if (item.answerAudio) answerAudioByText.set(item.answer.trim(), item.answerAudio)
    })
  }

  const getChipText = (chip: HTMLElement): string =>
    (chip.dataset.klText || chip.querySelector('.kl-chip-text')?.textContent || chip.textContent || '').trim()

  const setStatus = (text: string) => {
    statusEl!.textContent = text
  }

  const clearFeedback = () => {
    drops.forEach((d) => d.classList.remove('is-correct', 'is-wrong', 'is-over'))
    chipSlots.forEach((s) => s.classList.remove('is-over'))
    setStatus('')
  }

  const dropPlaceholder = `<span class="kl-drop-placeholder">${escapeHtml(labels.dropPlaceholder)}</span>`

  const clearChipSelection = () => {
    root.querySelectorAll('.kl-chip').forEach((c) => c.classList.remove('is-selected'))
    selectedChip = null
  }

  const findChipByText = (text: string): HTMLElement | null => {
    const trimmed = text.trim()
    return (
      (Array.from(root.querySelectorAll('.kl-chip')).find(
        (c) => getChipText(c as HTMLElement) === trimmed,
      ) as HTMLElement | undefined) ?? null
    )
  }

  const updateChipSlotEmptyStates = () => {
    chipSlots.forEach((slot) => {
      slot.classList.toggle('kl-chip-slot--empty', !slot.querySelector('.kl-chip'))
    })
  }

  const compactChipSlots = () => {
    const chips: HTMLElement[] = []
    chipSlots.forEach((slot) => {
      const chip = slot.querySelector('.kl-chip') as HTMLElement | null
      if (chip) chips.push(chip)
      slot.innerHTML = ''
    })
    chips.forEach((chip, index) => {
      chipSlots[index]?.appendChild(chip)
    })
    updateChipSlotEmptyStates()
  }

  const moveChipToBank = (chip: HTMLElement) => {
    const parent = chip.parentElement
    chip.remove()
    if (parent?.classList.contains('kl-drop')) {
      parent.innerHTML = dropPlaceholder
    }
    const emptySlot = chipSlots.find((slot) => !slot.querySelector('.kl-chip'))
    if (emptySlot) emptySlot.appendChild(chip)
    compactChipSlots()
  }

  const removeChipByText = (text: string, except?: HTMLElement) => {
    const trimmed = text.trim()
    root.querySelectorAll('.kl-chip').forEach((node) => {
      const chip = node as HTMLElement
      if (chip === except || getChipText(chip) !== trimmed) return
      const parent = chip.parentElement
      chip.remove()
      if (parent?.classList.contains('kl-drop')) {
        parent.innerHTML = dropPlaceholder
      }
    })
  }

  const attachChipInteractions = (chip: HTMLElement) => {
    if (chip.dataset.klBound === 'true') return
    chip.dataset.klBound = 'true'
    chip.setAttribute('draggable', 'true')
    chip.style.cursor = 'grab'

    on(chip, 'dragstart', (e) => {
      const ev = e as DragEvent
      const text = getChipText(chip)
      ev.dataTransfer?.setData('text/plain', text)
      if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move'
      clearFeedback()
    })

    on(chip, 'click', (e) => {
      if ((e.target as HTMLElement).closest('.phrase-audio-btn')) return
      e.stopPropagation()
      clearFeedback()
      if (selectedChip === chip) {
        const inDrop = chip.parentElement?.classList.contains('kl-drop')
        clearChipSelection()
        if (inDrop) moveChipToBank(chip)
        return
      }
      clearChipSelection()
      chip.classList.add('is-selected')
      selectedChip = chip
    })

    on(chip, 'keydown', (e) => {
      const ev = e as KeyboardEvent
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault()
        chip.click()
      }
    })
  }

  const createChip = (text: string): HTMLElement => {
    const chip = document.createElement('div')
    chip.className = 'kl-chip'
    chip.dataset.klText = text
    chip.setAttribute('role', 'button')
    chip.setAttribute('tabindex', '0')
    chip.setAttribute('aria-label', text)

    const answerAudio = answerAudioByText.get(text.trim())
    if (answerAudio && chipAudioBase) {
      chip.classList.add('kl-chip--with-audio')
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'phrase-audio-btn phrase-audio-btn--chip'
      btn.setAttribute('data-audio-src', matchAudioUrl(chipAudioBase, answerAudio))
      btn.setAttribute('aria-label', `Listen: ${text}`)
      btn.textContent = '🔊'
      const span = document.createElement('span')
      span.className = 'kl-chip-text'
      span.textContent = text
      chip.appendChild(btn)
      chip.appendChild(span)
    } else {
      chip.textContent = text
    }

    attachChipInteractions(chip)
    return chip
  }

  const collectPlacements = (): Record<string, string> => {
    const placements: Record<string, string> = {}
    drops.forEach((dropEl) => {
      const id = dropEl.getAttribute('data-drop-for') || ''
      const chip = dropEl.querySelector('.kl-chip')
      const text = chip ? getChipText(chip as HTMLElement) : ''
      if (id && text) placements[id] = text
    })
    return placements
  }

  const persistState = () => {
    const matchKey = options?.matchKey
    const persistence = options?.persistence
    if (!matchKey || !persistence) return
    persistence.setMatchPlacements(matchKey, collectPlacements())
  }

  const placeTextIntoDrop = (dropEl: HTMLElement, text: string, movingChip?: HTMLElement) => {
    clearFeedback()

    const existingInDrop = dropEl.querySelector('.kl-chip') as HTMLElement | null
    if (existingInDrop && existingInDrop !== movingChip) {
      moveChipToBank(existingInDrop)
    }

    removeChipByText(text, movingChip)

    let chipToPlace: HTMLElement
    if (movingChip) {
      const parent = movingChip.parentElement
      if (parent?.classList.contains('kl-drop') && parent !== dropEl) {
        parent.innerHTML = dropPlaceholder
      }
      movingChip.remove()
      chipToPlace = movingChip
    } else {
      compactChipSlots()
      chipToPlace = createChip(text)
    }

    dropEl.innerHTML = ''
    dropEl.appendChild(chipToPlace)
    attachChipInteractions(chipToPlace)
    compactChipSlots()
    clearChipSelection()
    persistState()
  }

  const returnTextToBank = (text: string) => {
    clearFeedback()
    const chip = findChipByText(text)
    if (chip) {
      moveChipToBank(chip)
    } else {
      const emptySlot = chipSlots.find((slot) => !slot.querySelector('.kl-chip'))
      if (emptySlot) emptySlot.appendChild(createChip(text))
      compactChipSlots()
    }
    clearChipSelection()
    persistState()
  }

  drops.forEach((dropEl) => {
    on(dropEl, 'dragover', (e) => {
      e.preventDefault()
      dropEl.classList.add('is-over')
    })
    on(dropEl, 'dragleave', () => dropEl.classList.remove('is-over'))
    on(dropEl, 'drop', (e) => {
      e.preventDefault()
      dropEl.classList.remove('is-over')
      const text = (e as DragEvent).dataTransfer?.getData('text/plain') || ''
      if (!text) return
      const movingChip = findChipByText(text)
      placeTextIntoDrop(dropEl, text, movingChip ?? undefined)
    })
    on(dropEl, 'click', (e) => {
      if ((e.target as HTMLElement).closest('.kl-chip')) return
      if (!selectedChip) return
      const text = getChipText(selectedChip)
      if (!text) return
      placeTextIntoDrop(dropEl, text, selectedChip)
    })
  })

  chipSlots.forEach((slot) => {
    on(slot, 'dragover', (e) => {
      e.preventDefault()
      slot.classList.add('is-over')
    })
    on(slot, 'dragleave', () => slot.classList.remove('is-over'))
    on(slot, 'drop', (e) => {
      e.preventDefault()
      slot.classList.remove('is-over')
      const text = (e as DragEvent).dataTransfer?.getData('text/plain') || ''
      if (!text) return
      returnTextToBank(text)
    })
    on(slot, 'click', (e) => {
      if ((e.target as HTMLElement).closest('.kl-chip')) return
      if (selectedChip?.parentElement?.classList.contains('kl-drop')) {
        returnTextToBank(getChipText(selectedChip))
      }
    })
  })

  const reset = (shouldPersist = true) => {
    chipSlots.forEach((slot) => {
      slot.innerHTML = ''
    })
    drops.forEach((d) => {
      d.innerHTML = dropPlaceholder
    })
    const shuffled = shuffle(translations)
    shuffled.forEach((t, index) => {
      const slot = chipSlots[index]
      if (slot) slot.appendChild(createChip(t))
    })
    updateChipSlotEmptyStates()
    selectedChip = null
    clearFeedback()
    if (shouldPersist) persistState()
  }

  const restoreSavedPlacements = (saved: Record<string, string>) => {
    if (!saved || Object.keys(saved).length === 0) return
    for (const [dropId, text] of Object.entries(saved)) {
      const trimmed = text.trim()
      if (!trimmed) continue
      const dropEl = drops.find((d) => d.getAttribute('data-drop-for') === dropId)
      if (dropEl) placeTextIntoDrop(dropEl, trimmed)
    }
    clearFeedback()
  }

  const checkAnswers = () => {
    let correct = 0
    let answered = 0
    drops.forEach((dropEl) => {
      const expected = (dropEl.getAttribute('data-correct') || '').trim()
      const chip = dropEl.querySelector('.kl-chip')
      const got = chip ? getChipText(chip as HTMLElement) : ''
      dropEl.classList.remove('is-correct', 'is-wrong')
      if (!got) return
      answered += 1
      if (got === expected) {
        correct += 1
        dropEl.classList.add('is-correct')
      } else {
        dropEl.classList.add('is-wrong')
      }
    })
    setStatus(
      answered === 0
        ? 'Add some answers first, then check.'
        : `Score: ${correct} / ${drops.length}`,
    )
  }

  on(checkBtn, 'click', checkAnswers)
  on(resetBtn, 'click', () => reset(true))

  on(root, 'click', ((e: Event) => {
    const btn = (e.target as HTMLElement).closest('button.phrase-audio-btn')
    if (!btn || !root.contains(btn)) return
    e.stopPropagation()
    const src = btn.getAttribute('data-audio-src') || ''
    if (!src) return
    let a = audioCache.get(src)
    if (!a) {
      a = new Audio(src)
      audioCache.set(src, a)
    }
    a.currentTime = 0
    void a.play().catch(() => {})
  }) as EventListener)

  const savedPlacements =
    options?.matchKey && options?.persistence
      ? options.persistence.getMatchPlacements(options.matchKey)
      : {}
  reset(false)
  restoreSavedPlacements(savedPlacements)

  return () => {
    cleanups.forEach((fn) => fn())
    root.innerHTML = ''
  }
}

export function mountGivingInformationMatchActivity(
  root: HTMLElement,
  persistence?: GiaqActivityPersistence,
): () => void {
  if (root.getAttribute('data-giaq-mounted') === 'true') {
    return () => {}
  }
  if (root.getAttribute('data-giaq-mounting') === 'true') {
    return () => {}
  }
  root.setAttribute('data-giaq-mounting', 'true')

  const matchType = root.getAttribute('data-giaq-match') || ''
  const config = CONFIG[matchType]
  if (!config) {
    root.removeAttribute('data-giaq-mounting')
    root.innerHTML =
      '<p style="margin:0;color:#b91c1c;">Activity could not load. Please refresh the page.</p>'
    return () => {
      root.innerHTML = ''
    }
  }

  const cleanup = mountKlDragDropMatch(
    root,
    config.items,
    config.labels,
    config.audioBase,
    config.chipAudioBase,
    { matchKey: matchType, persistence },
  )
  root.setAttribute('data-giaq-mounted', 'true')
  root.removeAttribute('data-giaq-mounting')

  return () => {
    cleanup()
    root.removeAttribute('data-giaq-mounted')
    root.removeAttribute('data-giaq-mounting')
  }
}

type GiaqListeningItem = { statement: string; answer: 'T' | 'F' }

const GIAQ_LISTENING_ITEMS: GiaqListeningItem[] = [
  { statement: 'The museum is opposite the tourist office.', answer: 'F' },
  { statement: 'The museum opens at 9 a.m.', answer: 'F' },
  { statement: 'Admission for adults costs €12.', answer: 'T' },
  { statement: 'Children enter free of charge.', answer: 'F' },
  { statement: "A guided tour starts at 11 o'clock.", answer: 'T' },
  { statement: 'The café is inside the museum.', answer: 'F' },
  { statement: 'The visitor can buy tickets online.', answer: 'T' },
]

export function mountGivingInformationListening(root: HTMLElement): () => void {
  if (root.getAttribute('data-giaq-listening-mounted') === 'true') {
    return () => {}
  }
  root.setAttribute('data-giaq-listening-mounting', 'true')

  const cleanups: (() => void)[] = []
  const on = (el: HTMLElement, type: string, fn: EventListener) => {
    el.addEventListener(type, fn)
    cleanups.push(() => el.removeEventListener(type, fn))
  }

  if (!root.querySelector('.psp-listening-board')) {
    const rows = GIAQ_LISTENING_ITEMS.map((item, index) => {
      const qNum = index + 1
      return `
        <div class="psp-listening-row" data-lq-row="${qNum}">
          <div class="psp-listening-statement"><strong>${qNum}.</strong> ${escapeHtml(item.statement)}</div>
          <div class="psp-listening-choices" role="radiogroup" aria-label="Question ${qNum}">
            <label><input type="radio" name="giaq-tf-${qNum}" value="T" /> True</label>
            <label><input type="radio" name="giaq-tf-${qNum}" value="F" /> False</label>
          </div>
        </div>
      `
    }).join('')

    root.innerHTML = `
      <div class="psp-listening-board">
        <div class="psp-listening-list">${rows}</div>
        <div class="psp-listening-actions">
          <button type="button" class="kl-btn" data-giaq-listening-check="true">Check answers</button>
          <button type="button" class="kl-btn kl-btn--secondary" data-giaq-listening-reset="true">Reset</button>
          <span class="kl-status" data-giaq-listening-status="true"></span>
        </div>
      </div>
    `
  }

  const statusEl = root.querySelector('[data-giaq-listening-status="true"]') as HTMLElement | null
  const checkBtn = root.querySelector('[data-giaq-listening-check="true"]') as HTMLButtonElement | null
  const resetBtn = root.querySelector('[data-giaq-listening-reset="true"]') as HTMLButtonElement | null
  if (!statusEl || !checkBtn || !resetBtn) {
    root.removeAttribute('data-giaq-listening-mounting')
    return () => {}
  }

  const clearFeedback = () => {
    root.querySelectorAll('.psp-listening-row').forEach((row) => {
      row.classList.remove('is-correct', 'is-wrong')
    })
    statusEl.textContent = ''
  }

  const checkAnswers = () => {
    let answered = 0
    let correct = 0
    GIAQ_LISTENING_ITEMS.forEach((item, index) => {
      const qNum = index + 1
      const row = root.querySelector(`[data-lq-row="${qNum}"]`) as HTMLElement | null
      const selected = root.querySelector(`input[name="giaq-tf-${qNum}"]:checked`) as HTMLInputElement | null
      if (!row) return
      row.classList.remove('is-correct', 'is-wrong')
      if (!selected) return
      answered += 1
      if (selected.value === item.answer) {
        correct += 1
        row.classList.add('is-correct')
      } else {
        row.classList.add('is-wrong')
      }
    })
    statusEl.textContent =
      answered === 0
        ? 'Select True or False first, then check.'
        : `Score: ${correct} / ${GIAQ_LISTENING_ITEMS.length}`
  }

  const reset = () => {
    root.querySelectorAll('input[type="radio"]').forEach((input) => {
      ;(input as HTMLInputElement).checked = false
    })
    clearFeedback()
  }

  on(checkBtn, 'click', checkAnswers)
  on(resetBtn, 'click', reset)

  root.setAttribute('data-giaq-listening-mounted', 'true')
  root.removeAttribute('data-giaq-listening-mounting')

  return () => {
    cleanups.forEach((fn) => fn())
    root.removeAttribute('data-giaq-listening-mounted')
    root.removeAttribute('data-giaq-listening-mounting')
    root.innerHTML = ''
  }
}

/** Mount each activity panel that is not already mounted; does not unmount existing panels. */
export function mountUnmountedGivingInformationActivities(
  host: HTMLElement,
  persistence?: GiaqActivityPersistence,
): (() => void)[] {
  const cleanups: (() => void)[] = []
  host.querySelectorAll('[data-giaq-match]').forEach((node) => {
    const el = node as HTMLElement
    if (el.getAttribute('data-giaq-mounted') === 'true') return
    if (el.getAttribute('data-giaq-mounting') === 'true') return
    cleanups.push(mountGivingInformationMatchActivity(el, persistence))
  })

  const listeningEl = host.querySelector('[data-giaq-listening]') as HTMLElement | null
  if (
    listeningEl &&
    listeningEl.getAttribute('data-giaq-listening-mounted') !== 'true' &&
    listeningEl.getAttribute('data-giaq-listening-mounting') !== 'true'
  ) {
    cleanups.push(mountGivingInformationListening(listeningEl))
  }

  return cleanups
}

/** @deprecated Prefer mountUnmountedGivingInformationActivities to avoid tearing down mounted panels. */
export function mountGivingInformationActivities(
  host: HTMLElement,
  persistence?: GiaqActivityPersistence,
): () => void {
  const cleanups = mountUnmountedGivingInformationActivities(host, persistence)
  return () => {
    cleanups.forEach((fn) => fn())
  }
}
