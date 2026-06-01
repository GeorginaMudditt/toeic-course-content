/**
 * Drag-and-drop matching for "Giving Information and Answering Questions".
 * Mounted from WorksheetViewer / ResourcePreview (inline <script> in resource HTML does not run).
 */

type MatchItem = { prompt: string; answer: string }

type MatchLabels = {
  promptColumn: string
  answerColumn: string
  dropPlaceholder: string
}

const DIRECTIONS_ITEMS: MatchItem[] = [
  { prompt: 'Turn left.', answer: 'Tournez à gauche.' },
  { prompt: 'Turn right.', answer: 'Tournez à droite.' },
  { prompt: 'Go straight ahead.', answer: 'Continuez tout droit.' },
  { prompt: 'Go around the corner.', answer: 'Tournez au coin de la rue.' },
  { prompt: 'Continue for about a kilometre.', answer: 'Continuez pendant environ un kilomètre.' },
  { prompt: 'Go past the school.', answer: 'Passez devant l\'école.' },
  { prompt: 'At the roundabout, take the second exit.', answer: 'Au rond-point, prenez la deuxième sortie.' },
  { prompt: 'It\u2019s next to the museum.', answer: 'C\u2019est à côté du musée.' },
  { prompt: 'It\u2019s behind the museum.', answer: 'C\u2019est derrière le musée.' },
  { prompt: 'It\u2019s opposite the museum.', answer: 'C\u2019est en face du musée.' },
  { prompt: 'It\u2019s between the museum and the café.', answer: 'C\u2019est entre le musée et le café.' },
  { prompt: 'It\u2019s on the left.', answer: 'C\u2019est à gauche.' },
  { prompt: 'It\u2019s on the right.', answer: 'C\u2019est à droite.' },
  { prompt: 'It\u2019s at the end of the street.', answer: 'C\u2019est au bout de la rue.' },
]

const QA_ITEMS: MatchItem[] = [
  {
    prompt: 'Is there a restaurant?',
    answer: 'Yes, there is. It is open every day in summer.',
  },
  {
    prompt: 'Where is the nearest bank?',
    answer: 'Turn left, then it\u2019s opposite the town hall.',
  },
  {
    prompt: 'How long does it take to walk to the beach?',
    answer: 'About ten minutes.',
  },
  {
    prompt: 'Is there public transport available?',
    answer: 'I\u2019m afraid not. You have to drive.',
  },
  {
    prompt: 'Is the activity suitable for beginners?',
    answer: 'Yes \u2013 no previous experience is necessary.',
  },
  {
    prompt: 'Can I pay by credit card?',
    answer: 'Yes, you can.',
  },
  {
    prompt: 'What time does the activity start?',
    answer: 'Half past ten.',
  },
  {
    prompt: 'Where can I buy tickets?',
    answer: 'Online or at reception.',
  },
]

const CONFIG: Record<string, { items: MatchItem[]; labels: MatchLabels }> = {
  directions: {
    items: DIRECTIONS_ITEMS,
    labels: {
      promptColumn: 'English',
      answerColumn: 'French \u2014 drag left \u2192',
      dropPlaceholder: 'Drag French here',
    },
  },
  'questions-answers': {
    items: QA_ITEMS,
    labels: {
      promptColumn: 'Question',
      answerColumn: 'Answer \u2014 drag left \u2192',
      dropPlaceholder: 'Drag answer here',
    },
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

  let rowIndex = 0
  const allRows = items
    .map((item) => {
      rowIndex += 1
      const id = `giaq-${rowIndex}`
      return `
        <div class="kl-table-row">
          <div class="kl-cell kl-cell--en">
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
    <div class="kl-board">
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
    chip.setAttribute('aria-label', text)

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

  const dropPlaceholder = `<span class="kl-drop-placeholder">${escapeHtml(labels.dropPlaceholder)}</span>`

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

  const returnChipToSlot = (chip: HTMLElement) => {
    chip.setAttribute('draggable', 'true')
    chip.style.cursor = 'grab'
    chip.classList.remove('is-selected')
    const emptySlot = chipSlots.find((slot) => !slot.querySelector('.kl-chip'))
    if (emptySlot) emptySlot.appendChild(chip)
    compactChipSlots()
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
    compactChipSlots()

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
    updateChipSlotEmptyStates()
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
        ? 'Add some answers first, then check.'
        : `Score: ${correct} / ${drops.length}`,
    )
  }

  on(checkBtn, 'click', checkAnswers)
  on(resetBtn, 'click', reset)
  reset()

  return () => {
    cleanups.forEach((fn) => fn())
    root.innerHTML = ''
  }
}

export function mountGivingInformationMatchActivity(root: HTMLElement): () => void {
  const matchType = root.getAttribute('data-giaq-match') || ''
  const config = CONFIG[matchType]
  if (!config) {
    root.innerHTML =
      '<p style="margin:0;color:#b91c1c;">Activity could not load. Please refresh the page.</p>'
    return () => {
      root.innerHTML = ''
    }
  }

  const cleanup = mountKlDragDropMatch(root, config.items, config.labels)
  root.setAttribute('data-giaq-mounted', 'true')

  return () => {
    cleanup()
    root.removeAttribute('data-giaq-mounted')
  }
}

export function mountGivingInformationActivities(host: HTMLElement): () => void {
  const cleanups: (() => void)[] = []

  host.querySelectorAll('[data-giaq-match]').forEach((node) => {
    const el = node as HTMLElement
    if (el.getAttribute('data-giaq-mounted') === 'true') return
    cleanups.push(mountGivingInformationMatchActivity(el))
  })

  return () => {
    cleanups.forEach((fn) => fn())
  }
}
