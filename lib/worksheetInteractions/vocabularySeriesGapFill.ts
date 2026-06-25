/**
 * Drag-and-drop gap fill for Vocabulary series worksheets (Telephoning, Jobs, Travel, etc.).
 * Mount on [data-vocab-gap-fill-mount]. Config via child <div class="vocab-series-gap-data"> (not <script> — React strips scripts from innerHTML).
 */

export type VocabGapSlot = {
  slot: string
  answers: string[]
}

export type VocabGapSentence = {
  number: number
  parts: Array<string | VocabGapSlot>
}

export type VocabGapConfig = {
  /** Optional override; by default the word bank is built from each gap's answer key (answers[0]). */
  words?: string[]
  sentences: VocabGapSentence[]
}

const CHIP_COLORS = ['#38438f', '#ba3627', '#5c6bc0', '#c62828', '#2d3569', '#9a2d21'] as const

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  let i = a.length
  let j: number
  let t: T
  while (i) {
    j = Math.floor(Math.random() * i--)
    t = a[i]!
    a[i] = a[j]!
    a[j] = t
  }
  return a
}

function norm(s: string | undefined | null): string {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function normAnswer(s: string): string {
  return norm(s).replace(/^to\s+/, '')
}

function answersMatch(got: string, expected: string[]): boolean {
  const g = normAnswer(got)
  return expected.some((a) => {
    const n = normAnswer(a)
    if (g === n) return true
    if (a.includes('/')) {
      return a
        .split('/')
        .map((p) => normAnswer(p))
        .some((p) => p === g)
    }
    return false
  })
}

function slotStyleForAnswer(answer: string): string {
  const len = Math.max(...answer.split('/').map((p) => p.trim().length))
  const minW = Math.max(72, Math.round(len * 8.5 + 36))
  return (
    'box-sizing: border-box; min-width: ' +
    minW +
    'px; max-width: 100%; min-height: 38px; flex: 0 1 auto; border: 2px dashed #cbd5e1; border-radius: 8px; background: rgba(255,255,255,0.9); display: inline-flex; flex-wrap: wrap; align-items: center; justify-content: center; transition: border-color 0.2s, background 0.2s; padding: 4px 6px; vertical-align: middle;'
  )
}

function parseConfig(root: HTMLElement): VocabGapConfig | null {
  const dataEl = root.querySelector('.vocab-series-gap-data')
  if (!dataEl?.textContent?.trim()) return null
  try {
    return JSON.parse(dataEl.textContent) as VocabGapConfig
  } catch {
    return null
  }
}

/** Word bank labels match the answer key: one card per gap, using answers[0]. */
function buildWordBank(config: VocabGapConfig): string[] {
  if (config.words?.length) return config.words

  const words: string[] = []
  const seen = new Set<string>()
  for (const sentence of config.sentences) {
    for (const part of sentence.parts) {
      if (typeof part === 'string') continue
      const label = (part.answers[0] ?? '').trim()
      if (!label) continue
      const key = norm(label)
      if (!seen.has(key)) {
        seen.add(key)
        words.push(label)
      }
    }
  }
  return words
}

export function mountVocabularySeriesGapFill(root: HTMLElement): () => void {
  const config = parseConfig(root)

  let selectedChip: HTMLElement | null = null
  let slots: { slot: HTMLElement; expected: string[] }[] = []
  let bankEl: HTMLElement | null = null
  let feedbackEl: HTMLElement | null = null

  function clearSelection() {
    if (selectedChip) {
      selectedChip.classList.remove('vsg-chip-selected')
      selectedChip.style.outline = ''
      selectedChip = null
    }
  }

  function findChipByLabel(label: string): HTMLElement | null {
    const target = norm(label)
    const all = root.querySelectorAll('.vsg-chip')
    for (let i = 0; i < all.length; i++) {
      const el = all[i] as HTMLElement
      if (norm(el.dataset.word) === target) return el
    }
    return null
  }

  function makeChip(word: string, colorIndex: number): HTMLElement {
    const color = CHIP_COLORS[colorIndex % CHIP_COLORS.length]!
    const chip = document.createElement('div')
    chip.className = 'vsg-chip'
    chip.dataset.word = word
    chip.setAttribute('aria-label', word)
    chip.setAttribute('draggable', 'true')
    chip.style.cssText = `display: inline-flex; align-items: center; gap: 4px; font: 600 13px Arial, sans-serif; padding: 8px 12px; border-radius: 8px; background: ${color}; color: #fff; cursor: grab; box-shadow: 0 2px 4px rgba(0,0,0,0.15); user-select: none; touch-action: manipulation; text-align: center; line-height: 1.25;`
    chip.textContent = word

    function onDragStart(e: DragEvent) {
      e.dataTransfer?.setData('text/plain', word)
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
      chip.style.opacity = '0.7'
    }
    function onDragEnd() {
      chip.style.opacity = '1'
    }
    chip.addEventListener('dragstart', onDragStart)
    chip.addEventListener('dragend', onDragEnd)

    chip.addEventListener('click', (e) => {
      e.preventDefault()
      if (chip.parentElement === bankEl) {
        clearSelection()
        selectedChip = chip
        chip.classList.add('vsg-chip-selected')
        chip.style.outline = '3px solid #fbbf24'
        return
      }
      if (chip.parentElement?.classList.contains('vsg-slot') && bankEl) {
        bankEl.appendChild(chip)
        chip.style.outline = ''
        clearSelection()
      }
    })

    return chip
  }

  function placeInSlot(slot: HTMLElement, chip: HTMLElement) {
    if (!bankEl) return
    while (slot.firstChild) {
      bankEl.appendChild(slot.firstChild as Node)
    }
    slot.appendChild(chip)
    chip.style.outline = ''
    clearSelection()
  }

  function slotClick(slot: HTMLElement) {
    return () => {
      if (selectedChip && selectedChip.parentElement === bankEl) {
        placeInSlot(slot, selectedChip)
        return
      }
      if (slot.firstChild && bankEl) {
        bankEl.appendChild(slot.firstChild as Node)
        clearSelection()
      }
    }
  }

  function checkAnswers() {
    let correct = 0
    slots.forEach((r) => {
      const slot = r.slot
      const chip = slot.querySelector('.vsg-chip') as HTMLElement | null
      slot.classList.remove('vsg-slot-correct', 'vsg-slot-wrong', 'vsg-shake')
      void slot.offsetWidth
      if (!chip) {
        slot.classList.add('vsg-slot-wrong', 'vsg-shake')
        return
      }
      const got = chip.dataset.word ?? ''
      if (answersMatch(got, r.expected)) {
        slot.classList.add('vsg-slot-correct')
        correct++
      } else {
        slot.classList.add('vsg-slot-wrong', 'vsg-shake')
      }
    })
    if (feedbackEl) {
      if (correct === slots.length) {
        feedbackEl.textContent = `Excellent — all ${slots.length} gaps correct!`
        feedbackEl.style.color = '#15803d'
      } else {
        feedbackEl.textContent = `${correct} / ${slots.length} correct. Fix the red gaps and try again.`
        feedbackEl.style.color = '#92400e'
      }
    }
  }

  function build() {
    root.innerHTML = ''
    selectedChip = null
    slots = []

    if (!config?.sentences?.length) {
      root.textContent = 'Gap fill activity could not be loaded.'
      return
    }

    const wordBank = buildWordBank(config)
    if (!wordBank.length) {
      root.textContent = 'Gap fill activity could not be loaded.'
      return
    }

    const layout = document.createElement('div')
    layout.className = 'vsg-layout'
    root.appendChild(layout)

    const sentencesCol = document.createElement('div')
    sentencesCol.className = 'vsg-sentences-col'
    layout.appendChild(sentencesCol)

    const ol = document.createElement('ol')
    ol.className = 'vsg-sentence-list'
    ol.style.cssText =
      'padding-left: 25px; font-size: 16px; list-style-type: decimal; margin: 0; list-style-position: outside;'
    sentencesCol.appendChild(ol)

    const slotRows: { slot: HTMLElement; expected: string[] }[] = []

    config.sentences.forEach((sentence) => {
      const li = document.createElement('li')
      li.style.cssText =
        'margin-bottom: 14px; padding: 8px; background: #f5e6e4; border-radius: 6px; border-left: 3px solid #ba3627; line-height: 1.55;'

      sentence.parts.forEach((part) => {
        if (typeof part === 'string') {
          const span = document.createElement('span')
          span.textContent = part
          li.appendChild(span)
          return
        }

        const strong = document.createElement('strong')
        const slot = document.createElement('span')
        slot.className = 'vsg-slot'
        const displayAnswer = part.answers[0] ?? ''
        const baseSlotStyle = slotStyleForAnswer(displayAnswer)
        slot.style.cssText = baseSlotStyle
        slot.dataset.slotId = part.slot
        slot.setAttribute('role', 'button')
        slot.setAttribute('tabindex', '0')
        slot.setAttribute('aria-label', 'Drop word here')
        slot.addEventListener('click', slotClick(slot))
        slot.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            slotClick(slot)()
          }
        })
        slot.addEventListener('dragover', (e) => {
          e.preventDefault()
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
          slot.style.borderColor = '#38438f'
          slot.style.background = 'rgba(56,67,143,0.08)'
        })
        slot.addEventListener('dragleave', () => {
          slot.style.cssText = baseSlotStyle
        })
        slot.addEventListener('drop', (e) => {
          e.preventDefault()
          slot.style.cssText = baseSlotStyle
          const txt = e.dataTransfer?.getData('text/plain') ?? ''
          const chip = findChipByLabel(txt)
          if (chip) placeInSlot(slot, chip)
        })

        strong.appendChild(slot)
        li.appendChild(strong)
        slotRows.push({ slot, expected: part.answers })
      })

      ol.appendChild(li)
    })

    slots = slotRows

    const bankCol = document.createElement('div')
    bankCol.className = 'vsg-bank-col'
    layout.appendChild(bankCol)

    const bankTitle = document.createElement('div')
    bankTitle.className = 'vsg-no-print'
    bankTitle.textContent = 'Word bank'
    bankTitle.style.cssText =
      'font-size: 14px; font-weight: 700; color: #38438f; margin-bottom: 6px; letter-spacing: 0.02em;'
    bankCol.appendChild(bankTitle)

    const scrollNotice = document.createElement('div')
    scrollNotice.className = 'vsg-no-print vsg-bank-scroll-notice'
    scrollNotice.innerHTML =
      '&#8597; <strong>Scroll up and down</strong> in this list to see all the word cards.'
    bankCol.appendChild(scrollNotice)

    const bankHint = document.createElement('p')
    bankHint.className = 'vsg-no-print'
    bankHint.textContent =
      'Drag a card into a gap, or click a card then click a gap. Click a placed card to return it to the bank.'
    bankHint.style.cssText = 'margin: 0 0 10px; font-size: 13px; color: #64748b; line-height: 1.4;'
    bankCol.appendChild(bankHint)

    const bankScrollWrap = document.createElement('div')
    bankScrollWrap.className = 'vsg-bank-scroll-wrap'
    bankCol.appendChild(bankScrollWrap)

    const fadeTop = document.createElement('div')
    fadeTop.className = 'vsg-bank-fade vsg-bank-fade-top vsg-no-print'
    fadeTop.setAttribute('aria-hidden', 'true')
    bankScrollWrap.appendChild(fadeTop)

    bankEl = document.createElement('div')
    bankEl.className = 'vsg-bank-grid'
    bankScrollWrap.appendChild(bankEl)

    const fadeBottom = document.createElement('div')
    fadeBottom.className = 'vsg-bank-fade vsg-bank-fade-bottom vsg-no-print'
    fadeBottom.setAttribute('aria-hidden', 'true')
    bankScrollWrap.appendChild(fadeBottom)

    shuffle(wordBank).forEach((word, i) => {
      bankEl!.appendChild(makeChip(word, i))
    })

    function updateScrollFades() {
      if (!bankEl) return
      const overflow = bankEl.scrollHeight > bankEl.clientHeight + 2
      scrollNotice.style.display = overflow ? 'block' : 'none'
      if (!overflow) {
        fadeTop.style.opacity = '0'
        fadeBottom.style.opacity = '0'
        return
      }
      fadeTop.style.opacity = bankEl.scrollTop > 6 ? '1' : '0'
      fadeBottom.style.opacity =
        bankEl.scrollTop + bankEl.clientHeight < bankEl.scrollHeight - 6 ? '1' : '0'
    }

    bankEl.addEventListener('scroll', updateScrollFades, { passive: true })
    requestAnimationFrame(updateScrollFades)

    const toolbar = document.createElement('div')
    toolbar.className = 'vsg-no-print vsg-toolbar'
    root.appendChild(toolbar)

    const btnCheck = document.createElement('button')
    btnCheck.type = 'button'
    btnCheck.textContent = 'Check answers'
    btnCheck.className = 'vsg-check-btn'
    btnCheck.style.cssText =
      'font: 600 14px Arial; padding: 10px 18px; border-radius: 8px; border: none; background: linear-gradient(135deg, #ba3627 0%, #9a2d21 100%); color: #fff; cursor: pointer; box-shadow: 0 2px 6px rgba(186,54,39,0.35);'
    btnCheck.addEventListener('click', checkAnswers)

    const btnReset = document.createElement('button')
    btnReset.type = 'button'
    btnReset.textContent = 'Shuffle & reset'
    btnReset.style.cssText =
      'font: 600 14px Arial; padding: 10px 18px; border-radius: 8px; border: 2px solid #38438f; background: #fff; color: #38438f; cursor: pointer;'
    btnReset.addEventListener('click', build)

    feedbackEl = document.createElement('p')
    feedbackEl.setAttribute('role', 'status')
    feedbackEl.style.cssText = 'margin: 0; font-size: 15px; font-weight: 600; min-height: 22px; color: #38438f; flex: 1;'

    toolbar.appendChild(btnCheck)
    toolbar.appendChild(btnReset)
    toolbar.appendChild(feedbackEl)
  }

  build()

  return () => {
    root.innerHTML = ''
  }
}
