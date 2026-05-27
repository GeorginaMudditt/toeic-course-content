/**
 * Key Language drag-and-drop + audio for "Presenting Services and Products".
 * Mounted from WorksheetViewer / ResourcePreview (inline <script> in resource HTML does not run).
 */

const AUDIO_BASE = '/images/everyday-english/presenting-services-products-audio/'

type KlItem = { en: string; fr: string; audio: string }
type KlSection = { title: string; items: KlItem[] }

const SECTIONS: KlSection[] = [
  {
    title: 'Greeting',
    items: [
      {
        en: 'Good afternoon and welcome.',
        fr: 'Bonjour et bienvenue.',
        audio: 'good-afternoon-and-welcome.mp3',
      },
      {
        en: 'How can I help you today?',
        fr: 'Comment puis-je vous aider aujourd’hui ?',
        audio: 'how-can-i-help-you-today.mp3',
      },
      {
        en: 'What is the name of the reservation?',
        fr: 'Quel est le nom de la réservation ?',
        audio: 'what-is-the-name-of-the-reservation.mp3',
      },
    ],
  },
  {
    title: 'Presenting Products and Services',
    items: [
      {
        en: 'We have three different packages available.',
        fr: 'Nous avons trois forfaits différents disponibles.',
        audio: 'we-have-three-different-packages-available.mp3',
      },
      {
        en: 'The price includes all the equipment.',
        fr: 'Le prix comprend tout le matériel.',
        audio: 'the-price-includes-all-the-equipment.mp3',
      },
      {
        en: 'The activity lasts two hours.',
        fr: 'L’activité dure deux heures.',
        audio: 'the-activity-lasts-two-hours.mp3',
      },
      {
        en: 'We still have space available.',
        fr: 'Nous avons encore de la place disponible.',
        audio: 'we-still-have-space-available.mp3',
      },
      {
        en: 'We have this special offer at the moment.',
        fr: 'Nous avons cette offre spéciale en ce moment.',
        audio: 'we-have-this-special-offer-at-the-moment.mp3',
      },
      {
        en: 'You can book tickets online or at the booking office.',
        fr: 'Vous pouvez réserver des billets en ligne ou au guichet.',
        audio: 'you-can-book-tickets-online-or-at-the-booking-office.mp3',
      },
      {
        en: 'Would you like to book?',
        fr: 'Souhaitez-vous réserver ?',
        audio: 'would-you-like-to-book.mp3',
      },
    ],
  },
  {
    title: 'Recommending',
    items: [
      {
        en: 'This is great for families.',
        fr: 'C’est idéal pour les familles.',
        audio: 'this-is-great-for-families.mp3',
      },
      {
        en: 'I recommend this activity for groups.',
        fr: 'Je recommande cette activité pour les groupes.',
        audio: 'i-recommend-this-activity-for-groups.mp3',
      },
      {
        en: 'This one is suitable for beginners.',
        fr: 'Celui-ci convient aux débutants.',
        audio: 'this-one-is-suitable-for-beginners.mp3',
      },
      {
        en: 'This option is my favourite.',
        fr: 'Cette option est ma préférée.',
        audio: 'this-option-is-my-favourite.mp3',
      },
      {
        en: 'This is our most popular option.',
        fr: 'C’est notre option la plus populaire.',
        audio: 'this-is-our-most-popular-option.mp3',
      },
      {
        en: 'A lot of tourists like this.',
        fr: 'Beaucoup de touristes aiment ça.',
        audio: 'a-lot-of-tourists-like-this.mp3',
      },
      {
        en: 'I think this would be perfect for you.',
        fr: 'Je pense que ce serait parfait pour vous.',
        audio: 'i-think-this-would-be-perfect-for-you.mp3',
      },
    ],
  },
  {
    title: 'Closing',
    items: [
      {
        en: 'I hope you enjoyed it.',
        fr: 'J’espère que vous avez apprécié.',
        audio: 'i-hope-you-enjoyed-it.mp3',
      },
      {
        en: 'Hopefully we will see you again.',
        fr: 'J’espère que nous vous reverrons.',
        audio: 'hopefully-we-will-see-you-again.mp3',
      },
      {
        en: 'Enjoy the rest of your holiday.',
        fr: 'Profitez du reste de vos vacances.',
        audio: 'enjoy-the-rest-of-your-holiday.mp3',
      },
      {
        en: 'Have a great weekend.',
        fr: 'Passez un excellent week-end.',
        audio: 'have-a-great-weekend.mp3',
      },
    ],
  },
]

function audioUrl(filename: string): string {
  return AUDIO_BASE + filename
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function mountPresentingServicesProductsKeyLanguage(root: HTMLElement): () => void {
  let selectedChip: HTMLElement | null = null
  let drops: HTMLElement[] = []
  let chipSlots: HTMLElement[] = []
  let statusEl: HTMLElement | null = null
  const audioCache = new Map<string, HTMLAudioElement>()
  const cleanups: (() => void)[] = []

  const on = (el: HTMLElement, type: string, fn: EventListener) => {
    el.addEventListener(type, fn)
    cleanups.push(() => el.removeEventListener(type, fn))
  }

  let rowIndex = 0
  const allRows = SECTIONS.flatMap((section) =>
    section.items.map((item) => {
      rowIndex += 1
      const id = `kl-${rowIndex}`
      return `
        <div class="kl-table-row">
          <div class="kl-cell kl-cell--en">
            <button type="button" class="phrase-audio-btn" data-audio-src="${escapeHtml(audioUrl(item.audio))}" aria-label="Listen: ${escapeHtml(item.en)}">🔊</button>
            <span class="kl-en-text">${escapeHtml(item.en)}</span>
          </div>
          <div class="kl-cell kl-cell--drop">
            <div class="kl-drop" data-drop-for="${id}" data-correct="${escapeHtml(item.fr)}">
              <span class="kl-drop-placeholder">Drag French here</span>
            </div>
          </div>
          <div class="kl-cell kl-cell--source">
            <div class="kl-chip-slot" data-kl-chip-slot="${id}"></div>
          </div>
        </div>`
    }),
  ).join('')

  root.innerHTML = `
    <div class="kl-board">
      <div class="kl-table">
        <div class="kl-table-head" aria-hidden="true">
          <span>English</span>
          <span>Your answer</span>
          <span>French — drag left →</span>
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

  const setStatus = (text: string) => {
    statusEl!.textContent = text
  }

  const clearFeedback = () => {
    drops.forEach((d) => d.classList.remove('is-correct', 'is-wrong', 'is-over'))
    setStatus('')
  }

  const makeChip = (text: string, inBank: boolean): HTMLElement => {
    const chip = document.createElement('div')
    chip.className = 'kl-chip'
    chip.textContent = text
    chip.setAttribute('role', 'button')
    chip.setAttribute('tabindex', '0')
    chip.setAttribute('aria-label', `French: ${text}`)

    if (inBank) {
      chip.setAttribute('draggable', 'true')
      on(chip, 'dragstart', (e) => {
        const ev = e as DragEvent
        ev.dataTransfer?.setData('text/plain', text)
        if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move'
      })
      on(chip, 'click', () => {
        clearFeedback()
        if (selectedChip === chip) {
          chip.classList.remove('is-selected')
          selectedChip = null
          return
        }
        root.querySelectorAll('.kl-chip-slot .kl-chip').forEach((c) => c.classList.remove('is-selected'))
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
    } else {
      chip.setAttribute('draggable', 'false')
      chip.style.cursor = 'default'
    }

    return chip
  }

  const dropPlaceholder = '<span class="kl-drop-placeholder">Drag French here</span>'

  const returnChipToSlot = (chip: HTMLElement) => {
    chip.setAttribute('draggable', 'true')
    chip.style.cursor = 'grab'
    chip.classList.remove('is-selected')
    const emptySlot = chipSlots.find((slot) => !slot.querySelector('.kl-chip'))
    if (emptySlot) {
      emptySlot.appendChild(chip)
    }
  }

  const removeChipByText = (text: string, except?: HTMLElement) => {
    root.querySelectorAll('.kl-chip').forEach((node) => {
      const chip = node as HTMLElement
      if (chip === except || chip.textContent !== text) return
      const parent = chip.parentElement
      chip.remove()
      if (parent?.classList.contains('kl-drop')) {
        parent.innerHTML = dropPlaceholder
      }
    })
  }

  const placeTextIntoDrop = (dropEl: HTMLElement, text: string) => {
    clearFeedback()
    const existingChip = dropEl.querySelector('.kl-chip')
    if (existingChip) returnChipToSlot(existingChip as HTMLElement)

    removeChipByText(text)

    const placed = makeChip(text, false)
    dropEl.innerHTML = ''
    dropEl.appendChild(placed)
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
      placeTextIntoDrop(dropEl, text)
    })
    on(dropEl, 'click', () => {
      if (!selectedChip) return
      const text = selectedChip.textContent || ''
      if (!text) return
      selectedChip.remove()
      selectedChip = null
      placeTextIntoDrop(dropEl, text)
    })
  })

  const reset = () => {
    chipSlots.forEach((slot) => {
      slot.innerHTML = ''
    })
    drops.forEach((d) => {
      d.innerHTML = dropPlaceholder
    })
    const shuffled = shuffle(translations)
    shuffled.forEach((t, index) => {
      const slot = chipSlots[index]
      if (slot) slot.appendChild(makeChip(t, true))
    })
    selectedChip = null
    clearFeedback()
  }

  const checkAnswers = () => {
    let correct = 0
    let answered = 0
    drops.forEach((dropEl) => {
      const expected = (dropEl.getAttribute('data-correct') || '').trim()
      const chip = dropEl.querySelector('.kl-chip')
      const got = (chip?.textContent || '').trim()
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
        ? 'Add some translations first, then check.'
        : `Score: ${correct} / ${drops.length}`,
    )
  }

  on(checkBtn, 'click', checkAnswers)
  on(resetBtn, 'click', reset)

  root.querySelectorAll('button.phrase-audio-btn').forEach((btn) => {
    const el = btn as HTMLButtonElement
    const src = el.getAttribute('data-audio-src') || ''
    if (!src) return
    el.disabled = false
    on(el, 'click', () => {
      let a = audioCache.get(src)
      if (!a) {
        a = new Audio(src)
        audioCache.set(src, a)
      }
      a.currentTime = 0
      void a.play().catch(() => {})
    })
  })

  reset()

  return () => {
    cleanups.forEach((fn) => fn())
    root.innerHTML = ''
  }
}
