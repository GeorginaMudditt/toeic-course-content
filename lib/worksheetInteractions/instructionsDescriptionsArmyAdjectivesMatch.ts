/**
 * Opposite-adjective matching for "Instructions and Descriptions (Army)" vocabulary.
 * Mounted from WorksheetViewer / ResourcePreview because inline <script> in resource HTML
 * is not executed by React (dangerouslySetInnerHTML).
 */

const PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['Strong', 'Weak'],
  ['Fast', 'Slow'],
  ['Brave', 'Scared'],
  ['Calm', 'Nervous'],
  ['Fit', 'Unhealthy'],
  ['Careful', 'Careless'],
  ['Heavy', 'Light'],
  ['Wide', 'Narrow'],
  ['Empty', 'Full'],
  ['Dangerous', 'Safe'],
  ['Wet', 'Dry'],
  ['Clean', 'Dirty'],
  ['Simple', 'Complicated'],
  ['Loud', 'Quiet'],
]

const AUDIO_DIR = '/vocab-audio/instructions-descriptions-army/'

/** Subtle blue UI for Vocabulary #1 so green “correct” feedback stands out clearly */
const ADJ = {
  chipBorder: '#5c7cab',
  chipBg0: '#f0f6fc',
  chipBg1: '#dceaf5',
  chipShadow: 'rgba(30, 70, 120, 0.12)',
  text: '#1a2a3d',
  slotDash: '#94aecc',
  slotBg: 'rgba(255,255,255,0.75)',
  slotBgHover: 'rgba(55, 110, 170, 0.12)',
  slotBorderHover: '#3d6ea8',
  rowTint0: 'rgba(65, 115, 175, 0.12)',
  rowBorder: '#cfdce8',
  bank0: '#2a4058',
  bank1: '#3d5d7a',
  bankTitle: '#e4eef8',
  check0: '#3b6fa8',
  check1: '#234969',
  checkShadow: 'rgba(30, 70, 120, 0.35)',
  resetBorder: '#5c7cab',
  resetText: '#1e3a5a',
  selectedRing: '0 0 0 3px rgba(59, 130, 200, 0.45)',
  selectedBorder: '#2563b8',
  feedbackIdle: '#1e3a5a',
} as const

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
}

function slug(w: string): string {
  return norm(w).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function mountInstructionsDescriptionsArmyAdjectiveMatch(root: HTMLElement): () => void {
  let selectedChip: HTMLElement | null = null
  let rows: { row: HTMLElement; slot: HTMLElement; expected: string }[] = []
  let bankEl: HTMLElement | null = null
  let feedbackEl: HTMLElement | null = null

  function clearSelection() {
    if (selectedChip) {
      selectedChip.classList.remove('ida-chip-selected')
      selectedChip.style.boxShadow = `0 2px 4px ${ADJ.chipShadow}`
      selectedChip.style.borderColor = ADJ.chipBorder
      selectedChip = null
    }
  }

  function makeListenBtn(word: string): HTMLElement {
    const id = `ida-audio-${slug(word)}`
    const holder = document.createElement('span')
    holder.className = 'ida-no-print'
    holder.style.cssText = 'display: inline-flex; align-items: center; flex-shrink: 0;'

    const hit = document.createElement('button')
    hit.type = 'button'
    hit.className = 'ida-audio-hit'
    hit.setAttribute('aria-label', `Listen: ${word}`)
    hit.textContent = '🔊'
    hit.title = 'Listen'
    hit.style.cssText =
      'width: 28px; height: 28px; padding: 0; border: none; border-radius: 50%; font-size: 13px; line-height: 1; cursor: pointer; background: #eef4fb; box-shadow: 0 1px 3px rgba(0,0,0,0.2); flex-shrink: 0;'
    hit.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const a = root.querySelector(`#${CSS.escape(id)}`) as HTMLAudioElement | null
      void a?.play()
    })

    const audio = document.createElement('audio')
    audio.id = id
    audio.preload = 'auto'
    const source = document.createElement('source')
    source.src = `${AUDIO_DIR}${slug(word)}.mp3`
    source.type = 'audio/mpeg'
    audio.appendChild(source)

    holder.appendChild(hit)
    holder.appendChild(audio)
    return holder
  }

  function findChipByLabel(label: string): HTMLElement | null {
    const all = root.querySelectorAll('.ida-chip-wrap')
    for (let i = 0; i < all.length; i++) {
      const el = all[i] as HTMLElement
      if (el.dataset.word === label) return el
    }
    return null
  }

  function wrapStyle(extra = ''): string {
    return (
      'display: inline-flex; align-items: center; gap: 6px; font: 600 14px Arial, sans-serif; padding: 6px 10px; border-radius: 8px; border: 2px solid ' +
      ADJ.chipBorder +
      '; background: linear-gradient(180deg, ' +
      ADJ.chipBg0 +
      ' 0%, ' +
      ADJ.chipBg1 +
      ' 100%); color: ' +
      ADJ.text +
      '; cursor: grab; box-shadow: 0 2px 4px ' +
      ADJ.chipShadow +
      '; user-select: none; touch-action: manipulation; min-width: 0; width: 100%; box-sizing: border-box;' +
      extra
    )
  }

  function slotStyle(): string {
    return 'min-width: 0; min-height: 40px; flex: 1; border: 2px dashed ' + ADJ.slotDash + '; border-radius: 8px; background: ' + ADJ.slotBg + '; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; transition: border-color 0.2s, background 0.2s; padding: 4px;'
  }

  function makeChip(label: string): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'ida-chip-wrap'
    wrap.dataset.word = label
    wrap.setAttribute('aria-label', label)
    wrap.style.cssText = wrapStyle()

    wrap.appendChild(makeListenBtn(label))

    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'ida-chip'
    b.textContent = label
    b.style.cssText =
      'font: inherit; font-weight: 700; border: none; background: transparent; color: inherit; cursor: grab; padding: 2px 0; flex: 1; min-width: 0; text-align: left;'
    wrap.appendChild(b)

    wrap.setAttribute('draggable', 'true')
    b.setAttribute('draggable', 'true')

    function onDragStart(e: DragEvent) {
      e.dataTransfer?.setData('text/plain', label)
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
      wrap.style.opacity = '0.65'
    }
    function onDragEnd() {
      wrap.style.opacity = '1'
    }
    wrap.addEventListener('dragstart', onDragStart)
    wrap.addEventListener('dragend', onDragEnd)
    b.addEventListener('dragstart', onDragStart)
    b.addEventListener('dragend', onDragEnd)

    wrap.addEventListener('click', (e) => {
      if ((e.target as Element).closest('.ida-audio-hit')) return
      e.preventDefault()
      if (wrap.parentElement === bankEl) {
        clearSelection()
        selectedChip = wrap
        wrap.classList.add('ida-chip-selected')
        wrap.style.boxShadow = ADJ.selectedRing + ', 0 2px 6px rgba(0,0,0,0.15)'
        wrap.style.borderColor = ADJ.selectedBorder
        return
      }
      if (wrap.parentElement?.classList.contains('ida-slot') && bankEl) {
        bankEl.appendChild(wrap)
        wrap.style.boxShadow = '0 2px 4px ' + ADJ.chipShadow
        wrap.style.borderColor = ADJ.chipBorder
        clearSelection()
      }
    })

    return wrap
  }

  function placeInSlot(slot: HTMLElement, chipWrap: HTMLElement) {
    if (!bankEl) return
    while (slot.firstChild) {
      bankEl.appendChild(slot.firstChild as Node)
    }
    slot.appendChild(chipWrap)
    chipWrap.style.boxShadow = '0 2px 4px ' + ADJ.chipShadow
    chipWrap.style.borderColor = ADJ.chipBorder
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
    rows.forEach((r) => {
      const slot = r.slot
      const wrap = slot.querySelector('.ida-chip-wrap') as HTMLElement | null
      const exp = norm(r.expected)
      slot.classList.remove('ida-slot-correct', 'ida-slot-wrong', 'ida-shake')
      void slot.offsetWidth
      if (!wrap) {
        slot.classList.add('ida-slot-wrong', 'ida-shake')
        return
      }
      const got = norm(wrap.dataset.word)
      if (got === norm(exp)) {
        slot.classList.add('ida-slot-correct')
        correct++
      } else {
        slot.classList.add('ida-slot-wrong', 'ida-shake')
      }
    })
    if (feedbackEl) {
      if (correct === rows.length) {
        feedbackEl.textContent = `Excellent — all ${rows.length} pairs correct!`
        feedbackEl.style.color = '#2d5a27'
      } else {
        feedbackEl.textContent = `${correct} / ${rows.length} correct. Adjust the red slots and try again.`
        feedbackEl.style.color = '#92400e'
      }
    }
  }

  function build() {
    root.innerHTML = ''
    selectedChip = null
    rows = []

    const toolbar = document.createElement('div')
    toolbar.className = 'ida-no-print'
    toolbar.style.cssText =
      'display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 18px;'

    const btnCheck = document.createElement('button')
    btnCheck.type = 'button'
    btnCheck.textContent = 'Check answers'
    btnCheck.className = 'ida-check-answers-btn'
    btnCheck.style.cssText =
      'font: 600 14px Arial; padding: 10px 18px; border-radius: 8px; border: none; background: linear-gradient(135deg, ' +
      ADJ.check0 +
      ' 0%, ' +
      ADJ.check1 +
      ' 100%); color: #f7fafc; cursor: pointer; box-shadow: 0 2px 6px ' +
      ADJ.checkShadow +
      ';'
    btnCheck.addEventListener('click', checkAnswers)

    const btnReset = document.createElement('button')
    btnReset.type = 'button'
    btnReset.textContent = 'Shuffle & reset'
    btnReset.style.cssText =
      'font: 600 14px Arial; padding: 10px 18px; border-radius: 8px; border: 2px solid ' +
      ADJ.resetBorder +
      '; background: #fff; color: ' +
      ADJ.resetText +
      '; cursor: pointer;'
    btnReset.addEventListener('click', build)

    toolbar.appendChild(btnCheck)
    toolbar.appendChild(btnReset)

    feedbackEl = document.createElement('p')
    feedbackEl.setAttribute('role', 'status')
    feedbackEl.style.cssText = 'margin: 0; font-size: 15px; font-weight: 600; min-height: 22px; color: ' + ADJ.feedbackIdle + ';'
    toolbar.appendChild(feedbackEl)

    const board = document.createElement('div')
    board.className = 'ida-match-grid'
    root.appendChild(board)

    const pairOrder = shuffle(PAIRS.map((_, i) => i))
    const rowData: { row: HTMLElement; slot: HTMLElement; expected: string }[] = []

    pairOrder.forEach((pi) => {
      const pair = PAIRS[pi]!
      const swap = Math.random() < 0.5
      const cue = swap ? pair[1]! : pair[0]!
      const answer = swap ? pair[0]! : pair[1]!

      const row = document.createElement('div')
      row.className = 'ida-row'
      row.style.cssText =
        'display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; padding: 6px 10px; background: linear-gradient(90deg, ' +
        ADJ.rowTint0 +
        ' 0%, rgba(255,255,255,0.55) 100%); border-radius: 8px; border: 1px solid ' +
        ADJ.rowBorder +
        '; min-width: 0;'
      row.dataset.expected = answer
      row.dataset.cue = cue

      const cueEl = document.createElement('div')
      cueEl.style.cssText =
        'font-weight: 700; font-size: 15px; color: ' + ADJ.text + '; flex: 0 1 auto; min-width: 0; display: flex; align-items: center; gap: 6px;'
      cueEl.appendChild(makeListenBtn(cue))
      const wordSpan = document.createElement('span')
      wordSpan.textContent = cue
      wordSpan.style.cssText = 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'
      cueEl.appendChild(wordSpan)

      const slot = document.createElement('div')
      slot.className = 'ida-slot'
      slot.style.cssText = slotStyle()
      slot.dataset.expected = answer
      slot.setAttribute('role', 'group')
      slot.setAttribute('aria-label', `Opposite of ${cue}`)

      slot.addEventListener('click', slotClick(slot))

      slot.addEventListener('dragover', (e) => {
        e.preventDefault()
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
        slot.style.borderColor = ADJ.slotBorderHover
        slot.style.background = ADJ.slotBgHover
      })
      slot.addEventListener('dragleave', () => {
        slot.style.border = '2px dashed ' + ADJ.slotDash
        slot.style.background = ADJ.slotBg
      })
      slot.addEventListener('drop', (e) => {
        e.preventDefault()
        slot.style.border = '2px dashed ' + ADJ.slotDash
        slot.style.background = ADJ.slotBg
        const txt = e.dataTransfer?.getData('text/plain') ?? ''
        const chip = findChipByLabel(txt)
        if (chip) placeInSlot(slot, chip)
      })

      row.appendChild(cueEl)
      row.appendChild(slot)
      board.appendChild(row)
      rowData.push({ row, slot, expected: answer })
    })

    rows = rowData

    const bankWrap = document.createElement('div')
    bankWrap.style.cssText =
      'padding: 16px; border-radius: 10px; background: linear-gradient(135deg, ' +
      ADJ.bank0 +
      ' 0%, ' +
      ADJ.bank1 +
      ' 100%); box-shadow: inset 0 2px 8px rgba(0,0,0,0.2);'
    root.appendChild(bankWrap)

    const bankTitle = document.createElement('div')
    bankTitle.textContent = 'Word bank — drag or tap a word, then tap a slot'
    bankTitle.className = 'ida-no-print'
    bankTitle.style.cssText =
      'font-size: 13px; font-weight: 700; color: ' + ADJ.bankTitle + '; margin-bottom: 10px; letter-spacing: 0.03em;'
    bankWrap.appendChild(bankTitle)

    bankEl = document.createElement('div')
    bankEl.className = 'ida-bank-grid'
    bankWrap.appendChild(bankEl)

    const bankWords = shuffle(PAIRS.flatMap((p) => [p[0], p[1]]))
    const cuesUsed: Record<string, boolean> = {}
    rowData.forEach((r) => {
      const c = r.row.dataset.cue
      if (c) cuesUsed[c] = true
    })
    const inBank = bankWords.filter((w) => !cuesUsed[w])
    shuffle(inBank).forEach((w) => {
      bankEl!.appendChild(makeChip(w))
    })

    root.appendChild(toolbar)
  }

  build()

  return () => {
    root.innerHTML = ''
  }
}
