/**
 * Wordy-phrase → clearer alternative matching for "Writing Clearly".
 * Mounted from WorksheetViewer (inline <script> in resource HTML does not run).
 */

const PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['Due to the fact that', 'because'],
  ['At this point in time', 'currently'],
  ['A large number of', 'several / many'],
  ['In the event that', 'if'],
  ['For the purpose of', 'to'],
  ['In the majority of cases', 'usually'],
  ['Has the ability to', 'can'],
  ['On a regular basis', 'regularly'],
  ['In spite of the fact that', 'although'],
  ['In the absence of', 'without'],
  ['Provide assistance', 'help'],
  ['Is required to', 'must'],
]

const C = {
  chipBorder: '#4338ca',
  chipBg0: '#eef2ff',
  chipBg1: '#e0e7ff',
  chipShadow: 'rgba(67, 56, 202, 0.12)',
  text: '#1e293b',
  slotDash: '#94a3b8',
  slotBg: 'rgba(255,255,255,0.75)',
  slotBgHover: 'rgba(67, 56, 202, 0.1)',
  slotBorderHover: '#4338ca',
  rowTint: 'rgba(67, 56, 202, 0.06)',
  rowBorder: '#e2e8f0',
  bank0: '#312e81',
  bank1: '#1e3a8a',
  bankTitle: '#eef2ff',
  check0: '#4338ca',
  check1: '#6366f1',
  checkShadow: 'rgba(67, 56, 202, 0.35)',
  resetBorder: '#4338ca',
  resetText: '#4338ca',
  selectedRing: '0 0 0 3px rgba(67, 56, 202, 0.35)',
  selectedBorder: '#4338ca',
  feedbackIdle: '#4338ca',
} as const

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  let i = a.length
  while (i) {
    const j = Math.floor(Math.random() * i--)
    const t = a[i]!
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

export function mountWritingClearlyPhraseMatch(root: HTMLElement): () => void {
  let selectedChip: HTMLElement | null = null
  let rows: { row: HTMLElement; slot: HTMLElement; expected: string }[] = []
  let bankEl: HTMLElement | null = null
  let feedbackEl: HTMLElement | null = null

  function clearSelection() {
    if (selectedChip) {
      selectedChip.classList.remove('wc-chip-selected')
      selectedChip.style.boxShadow = `0 2px 4px ${C.chipShadow}`
      selectedChip.style.borderColor = C.chipBorder
      selectedChip = null
    }
  }

  function wrapStyle(extra = ''): string {
    return (
      'display: inline-flex; align-items: center; gap: 6px; font: 600 13px Arial, sans-serif; padding: 6px 10px; border-radius: 8px; border: 2px solid ' +
      C.chipBorder +
      '; background: linear-gradient(180deg, ' +
      C.chipBg0 +
      ' 0%, ' +
      C.chipBg1 +
      ' 100%); color: ' +
      C.text +
      '; cursor: grab; box-shadow: 0 2px 4px ' +
      C.chipShadow +
      '; user-select: none; touch-action: manipulation; min-width: 0; width: 100%; box-sizing: border-box;' +
      extra
    )
  }

  function slotStyle(): string {
    return (
      'min-width: 110px; width: 140px; max-width: 160px; min-height: 40px; flex: 0 0 140px; border: 2px dashed ' +
      C.slotDash +
      '; border-radius: 8px; background: ' +
      C.slotBg +
      '; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; transition: border-color 0.2s, background 0.2s; padding: 4px;'
    )
  }

  function makeChip(label: string): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'wc-chip-wrap'
    wrap.dataset.word = label
    wrap.setAttribute('aria-label', label)
    wrap.style.cssText = wrapStyle()

    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'wc-chip'
    b.textContent = label
    b.style.cssText =
      'font: inherit; font-weight: 700; border: none; background: transparent; color: inherit; cursor: grab; padding: 2px 0; flex: 1; min-width: 0; text-align: center;'
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
      e.preventDefault()
      if (wrap.parentElement === bankEl) {
        clearSelection()
        selectedChip = wrap
        wrap.classList.add('wc-chip-selected')
        wrap.style.boxShadow = C.selectedRing + ', 0 2px 6px rgba(0,0,0,0.15)'
        wrap.style.borderColor = C.selectedBorder
        return
      }
      if (wrap.parentElement?.classList.contains('wc-slot') && bankEl) {
        bankEl.appendChild(wrap)
        wrap.style.boxShadow = '0 2px 4px ' + C.chipShadow
        wrap.style.borderColor = C.chipBorder
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
    chipWrap.style.boxShadow = '0 2px 4px ' + C.chipShadow
    chipWrap.style.borderColor = C.chipBorder
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
      const wrap = slot.querySelector('.wc-chip-wrap') as HTMLElement | null
      slot.classList.remove('wc-slot-correct', 'wc-slot-wrong')
      if (!wrap) {
        slot.style.borderColor = '#f87171'
        slot.style.background = '#fef2f2'
        return
      }
      if (norm(wrap.dataset.word) === norm(r.expected)) {
        slot.style.borderColor = '#22c55e'
        slot.style.background = '#f0fdf4'
        correct++
      } else {
        slot.style.borderColor = '#f87171'
        slot.style.background = '#fef2f2'
      }
    })
    if (feedbackEl) {
      if (correct === rows.length) {
        feedbackEl.textContent = `Excellent — all ${rows.length} matches correct!`
        feedbackEl.style.color = '#15803d'
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

    const layout = document.createElement('div')
    layout.style.cssText =
      'display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-start;'

    const board = document.createElement('div')
    board.style.cssText =
      'display: flex; flex-direction: column; gap: 8px; flex: 1 1 320px; min-width: 0;'

    PAIRS.forEach(([prompt, answer]) => {
      const row = document.createElement('div')
      row.style.cssText =
        'display: flex; flex-wrap: nowrap; align-items: center; gap: 10px; padding: 10px 12px; background: ' +
        C.rowTint +
        '; border: 1px solid ' +
        C.rowBorder +
        '; border-radius: 8px;'

      const label = document.createElement('div')
      label.style.cssText =
        'flex: 1 1 auto; font: 600 14px Arial, sans-serif; color: #1e3a8a; min-width: 0;'
      label.textContent = prompt

      const slot = document.createElement('div')
      slot.className = 'wc-slot'
      slot.style.cssText = slotStyle()
      slot.addEventListener('click', slotClick(slot))
      slot.addEventListener('dragover', (e) => {
        e.preventDefault()
        slot.style.borderColor = C.slotBorderHover
        slot.style.background = C.slotBgHover
      })
      slot.addEventListener('dragleave', () => {
        slot.style.borderColor = C.slotDash
        slot.style.background = C.slotBg
      })
      slot.addEventListener('drop', (e) => {
        e.preventDefault()
        slot.style.borderColor = C.slotDash
        slot.style.background = C.slotBg
        const word = e.dataTransfer?.getData('text/plain')
        if (!word || !bankEl) return
        const chips = Array.from(root.querySelectorAll('.wc-chip-wrap')) as HTMLElement[]
        const chip = chips.find((c) => c.dataset.word === word)
        if (chip) placeInSlot(slot, chip)
      })

      row.appendChild(label)
      row.appendChild(slot)
      board.appendChild(row)
      rows.push({ row, slot, expected: answer })
    })

    const bank = document.createElement('div')
    bankEl = bank
    bank.style.cssText =
      'flex: 0 0 168px; width: 168px; max-width: 100%; padding: 12px; border-radius: 10px; background: linear-gradient(135deg, ' +
      C.bank0 +
      ' 0%, ' +
      C.bank1 +
      ' 100%); position: sticky; top: 12px; box-sizing: border-box;'

    const bankTitle = document.createElement('p')
    bankTitle.style.cssText =
      'margin: 0 0 10px 0; font: 600 12px Arial, sans-serif; color: ' + C.bankTitle + '; line-height: 1.35;'
    bankTitle.textContent = 'Word bank — drag or tap, then tap a slot'
    bank.appendChild(bankTitle)

    const bankInner = document.createElement('div')
    bankInner.style.cssText = 'display: flex; flex-direction: column; gap: 8px;'
    shuffle(PAIRS.map(([, answer]) => answer)).forEach((answer) => {
      bankInner.appendChild(makeChip(answer))
    })
    bank.appendChild(bankInner)

    layout.appendChild(board)
    layout.appendChild(bank)

    const toolbar = document.createElement('div')
    toolbar.className = 'screen-only'
    toolbar.style.cssText =
      'display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 14px;'

    const btnCheck = document.createElement('button')
    btnCheck.type = 'button'
    btnCheck.textContent = 'Check answers'
    btnCheck.style.cssText =
      'font: 600 14px Arial; padding: 10px 18px; border-radius: 8px; border: none; background: linear-gradient(135deg, ' +
      C.check0 +
      ' 0%, ' +
      C.check1 +
      ' 100%); color: #fff; cursor: pointer; box-shadow: 0 2px 6px ' +
      C.checkShadow +
      ';'
    btnCheck.addEventListener('click', checkAnswers)

    const btnReset = document.createElement('button')
    btnReset.type = 'button'
    btnReset.textContent = 'Shuffle & reset'
    btnReset.style.cssText =
      'font: 600 14px Arial; padding: 10px 18px; border-radius: 8px; border: 2px solid ' +
      C.resetBorder +
      '; background: #fff; color: ' +
      C.resetText +
      '; cursor: pointer;'
    btnReset.addEventListener('click', build)

    feedbackEl = document.createElement('p')
    feedbackEl.setAttribute('role', 'status')
    feedbackEl.style.cssText =
      'margin: 0; font-size: 14px; font-weight: 600; min-height: 22px; color: ' + C.feedbackIdle + ';'

    toolbar.appendChild(btnCheck)
    toolbar.appendChild(btnReset)
    toolbar.appendChild(feedbackEl)

    root.appendChild(layout)
    root.appendChild(toolbar)
  }

  build()

  return () => {
    root.innerHTML = ''
    selectedChip = null
    rows = []
    bankEl = null
    feedbackEl = null
  }
}
