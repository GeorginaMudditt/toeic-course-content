/**
 * Past Simple -ed pronunciation sort (/t/, /d/, /ɪd/) for "Past Simple Practice (Army)".
 */

type Sound = 't' | 'd' | 'id'

const VERBS: ReadonlyArray<{ word: string; sound: Sound }> = [
  { word: 'prepared', sound: 'd' },
  { word: 'cleaned', sound: 'd' },
  { word: 'marched', sound: 't' },
  { word: 'saluted', sound: 'id' },
  { word: 'listened', sound: 'd' },
  { word: 'carried', sound: 'd' },
  { word: 'jumped', sound: 't' },
  { word: 'learned', sound: 'd' },
  { word: 'protected', sound: 'id' },
  { word: 'rested', sound: 'id' },
]

const COLS: ReadonlyArray<{ sound: Sound; label: string }> = [
  { sound: 't', label: '/t/' },
  { sound: 'd', label: '/d/' },
  { sound: 'id', label: '/ɪd/' },
]

const UI = {
  chipBorder: '#5c6f4e',
  chipBg0: '#f4f6f0',
  chipBg1: '#e2e8d8',
  chipShadow: 'rgba(45, 61, 40, 0.12)',
  text: '#1a2416',
  colDash: '#9aa88a',
  colBg: 'rgba(255,255,255,0.8)',
  colHover: 'rgba(92, 111, 78, 0.12)',
  bank0: '#2d3d28',
  bank1: '#3d5236',
  bankTitle: '#e8ebe3',
  check0: '#4a6740',
  check1: '#2d3d28',
  checkShadow: 'rgba(45, 61, 40, 0.35)',
  resetBorder: '#5c6f4e',
  resetText: '#2d3d28',
  selectedRing: '0 0 0 3px rgba(74, 103, 64, 0.45)',
  selectedBorder: '#3d5236',
  feedbackIdle: '#2d3d28',
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

export function mountPastSimpleArmyEdPronunciation(root: HTMLElement): () => void {
  let selectedChip: HTMLElement | null = null
  let columns: { el: HTMLElement; sound: Sound }[] = []
  let bankEl: HTMLElement | null = null
  let feedbackEl: HTMLElement | null = null

  function clearSelection() {
    if (selectedChip) {
      selectedChip.classList.remove('pspa-chip-selected')
      selectedChip.style.boxShadow = `0 2px 4px ${UI.chipShadow}`
      selectedChip.style.borderColor = UI.chipBorder
      selectedChip = null
    }
  }

  function findChip(word: string): HTMLElement | null {
    const all = root.querySelectorAll('.pspa-chip-wrap')
    for (let i = 0; i < all.length; i++) {
      const el = all[i] as HTMLElement
      if (el.dataset.word === word) return el
    }
    return null
  }

  function chipStyle(extra = ''): string {
    return (
      'display: inline-flex; align-items: center; font: 600 14px Arial, sans-serif; padding: 8px 12px; border-radius: 8px; border: 2px solid ' +
      UI.chipBorder +
      '; background: linear-gradient(180deg, ' +
      UI.chipBg0 +
      ' 0%, ' +
      UI.chipBg1 +
      ' 100%); color: ' +
      UI.text +
      '; cursor: grab; box-shadow: 0 2px 4px ' +
      UI.chipShadow +
      '; user-select: none; touch-action: manipulation; box-sizing: border-box;' +
      extra
    )
  }

  function makeChip(word: string): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'pspa-chip-wrap'
    wrap.dataset.word = word
    wrap.setAttribute('aria-label', word)
    wrap.style.cssText = chipStyle()

    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'pspa-chip'
    b.textContent = word
    b.style.cssText =
      'font: inherit; font-weight: 700; border: none; background: transparent; color: inherit; cursor: grab; padding: 0;'
    wrap.appendChild(b)

    wrap.setAttribute('draggable', 'true')
    b.setAttribute('draggable', 'true')

    function onDragStart(e: DragEvent) {
      e.dataTransfer?.setData('text/plain', word)
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
        wrap.classList.add('pspa-chip-selected')
        wrap.style.boxShadow = UI.selectedRing + ', 0 2px 6px rgba(0,0,0,0.15)'
        wrap.style.borderColor = UI.selectedBorder
        return
      }
      if (wrap.parentElement?.classList.contains('pspa-ed-col') && bankEl) {
        bankEl.appendChild(wrap)
        wrap.style.boxShadow = '0 2px 4px ' + UI.chipShadow
        wrap.style.borderColor = UI.chipBorder
        clearSelection()
      }
    })

    return wrap
  }

  function placeInColumn(col: HTMLElement, chip: HTMLElement) {
    if (!bankEl) return
    col.appendChild(chip)
    chip.style.boxShadow = '0 2px 4px ' + UI.chipShadow
    chip.style.borderColor = UI.chipBorder
    clearSelection()
  }

  function colClick(col: HTMLElement) {
    return () => {
      if (selectedChip && selectedChip.parentElement === bankEl) {
        placeInColumn(col, selectedChip)
      }
    }
  }

  function wireColumn(col: HTMLElement) {
    col.addEventListener('dragover', (e) => {
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
      col.style.borderColor = UI.selectedBorder
      col.style.background = UI.colHover
    })
    col.addEventListener('dragleave', () => {
      col.style.border = '2px dashed ' + UI.colDash
      col.style.background = UI.colBg
    })
    col.addEventListener('drop', (e) => {
      e.preventDefault()
      col.style.border = '2px dashed ' + UI.colDash
      col.style.background = UI.colBg
      const txt = e.dataTransfer?.getData('text/plain') ?? ''
      const chip = findChip(txt)
      if (chip) placeInColumn(col, chip)
    })
    col.addEventListener('click', colClick(col))
  }

  function checkAnswers() {
    const expectedByWord = new Map(VERBS.map((v) => [v.word, v.sound]))
    let correct = 0
    const total = VERBS.length

    columns.forEach(({ el, sound }) => {
      el.classList.remove('pspa-slot-correct', 'pspa-slot-wrong', 'pspa-shake')
      const chips = el.querySelectorAll('.pspa-chip-wrap')
      chips.forEach((chipEl) => {
        const word = (chipEl as HTMLElement).dataset.word ?? ''
        const exp = expectedByWord.get(word)
        if (exp === sound) {
          correct++
          chipEl.classList.add('pspa-slot-correct')
        } else {
          chipEl.classList.add('pspa-slot-wrong', 'pspa-shake')
        }
      })
    })

    const placed = root.querySelectorAll('.pspa-ed-col .pspa-chip-wrap').length
    const missing = total - placed

    if (feedbackEl) {
      if (correct === total && missing === 0) {
        feedbackEl.textContent = `Excellent — all ${total} verbs in the correct columns!`
        feedbackEl.style.color = '#2d5a27'
      } else if (missing > 0) {
        feedbackEl.textContent = `${correct} / ${total} correct. Place all verbs in a column, then check again.`
        feedbackEl.style.color = '#92400e'
      } else {
        feedbackEl.textContent = `${correct} / ${total} correct. Move the red verbs to the right column.`
        feedbackEl.style.color = '#92400e'
      }
    }
  }

  function build() {
    root.innerHTML = ''
    selectedChip = null
    columns = []

    const board = document.createElement('div')
    board.className = 'pspa-ed-board'
    root.appendChild(board)

    COLS.forEach(({ sound, label }) => {
      const wrap = document.createElement('div')
      wrap.style.cssText = 'display: flex; flex-direction: column; gap: 8px; min-width: 0;'

      const title = document.createElement('div')
      title.textContent = label
      title.style.cssText =
        'font: 700 18px Arial, sans-serif; text-align: center; color: ' + UI.text + '; padding: 6px; background: #e8ebe3; border-radius: 8px; border: 1px solid #c5c9ba;'
      wrap.appendChild(title)

      const col = document.createElement('div')
      col.className = 'pspa-ed-col'
      col.dataset.sound = sound
      col.style.cssText =
        'min-height: 120px; flex: 1; border: 2px dashed ' +
        UI.colDash +
        '; border-radius: 10px; background: ' +
        UI.colBg +
        '; display: flex; flex-direction: column; flex-wrap: wrap; align-content: flex-start; gap: 6px; padding: 10px; transition: border-color 0.2s, background 0.2s;'
      col.setAttribute('role', 'group')
      col.setAttribute('aria-label', `Verbs with ${label} sound`)
      wireColumn(col)
      wrap.appendChild(col)
      board.appendChild(wrap)
      columns.push({ el: col, sound })
    })

    const bankWrap = document.createElement('div')
    bankWrap.style.cssText =
      'padding: 16px; border-radius: 10px; background: linear-gradient(135deg, ' +
      UI.bank0 +
      ' 0%, ' +
      UI.bank1 +
      ' 100%); box-shadow: inset 0 2px 8px rgba(0,0,0,0.2); margin-bottom: 14px;'
    root.insertBefore(bankWrap, board)

    const bankTitle = document.createElement('div')
    bankTitle.textContent = 'Word bank — drag or tap a verb, then tap a column'
    bankTitle.className = 'pspa-no-print'
    bankTitle.style.cssText =
      'font-size: 13px; font-weight: 700; color: ' + UI.bankTitle + '; margin-bottom: 10px; letter-spacing: 0.03em;'
    bankWrap.appendChild(bankTitle)

    bankEl = document.createElement('div')
    bankEl.className = 'pspa-ed-bank-grid'
    bankWrap.appendChild(bankEl)

    shuffle(VERBS.map((v) => v.word)).forEach((w) => {
      bankEl!.appendChild(makeChip(w))
    })

    const toolbar = document.createElement('div')
    toolbar.className = 'pspa-no-print'
    toolbar.style.cssText =
      'display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 4px;'

    const btnCheck = document.createElement('button')
    btnCheck.type = 'button'
    btnCheck.textContent = 'Check answers'
    btnCheck.style.cssText =
      'font: 600 14px Arial; padding: 10px 18px; border-radius: 8px; border: none; background: linear-gradient(135deg, ' +
      UI.check0 +
      ' 0%, ' +
      UI.check1 +
      ' 100%); color: #f7fafc; cursor: pointer; box-shadow: 0 2px 6px ' +
      UI.checkShadow +
      ';'
    btnCheck.addEventListener('click', checkAnswers)

    const btnReset = document.createElement('button')
    btnReset.type = 'button'
    btnReset.textContent = 'Shuffle & reset'
    btnReset.style.cssText =
      'font: 600 14px Arial; padding: 10px 18px; border-radius: 8px; border: 2px solid ' +
      UI.resetBorder +
      '; background: #fff; color: ' +
      UI.resetText +
      '; cursor: pointer;'
    btnReset.addEventListener('click', build)

    feedbackEl = document.createElement('p')
    feedbackEl.setAttribute('role', 'status')
    feedbackEl.style.cssText =
      'margin: 0; font-size: 15px; font-weight: 600; min-height: 22px; color: ' + UI.feedbackIdle + ';'
    toolbar.appendChild(btnCheck)
    toolbar.appendChild(btnReset)
    toolbar.appendChild(feedbackEl)
    root.appendChild(toolbar)
  }

  build()

  return () => {
    root.innerHTML = ''
  }
}
