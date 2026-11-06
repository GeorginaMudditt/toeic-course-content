/**
 * English → French word matching.
 * HTML:
 *   <div data-en-fr-match>
 *     <div data-en-fr-pairs hidden>
 *       <span data-en="hiking" data-fr="la randonnée"></span>
 *     </div>
 *     <div data-en-fr-board></div>
 *   </div>
 * Mounted from WorksheetViewer. Inline scripts in resource HTML do not run.
 */

type Pair = { en: string; fr: string }
type Cleanup = () => void

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
    .replace(/\s+/g, ' ')
}

function readPairs(host: HTMLElement): Pair[] {
  return Array.from(host.querySelectorAll('[data-en-fr-pairs] [data-en]'))
    .map((el) => ({
      en: el.getAttribute('data-en')?.trim() || '',
      fr: el.getAttribute('data-fr')?.trim() || '',
    }))
    .filter((pair) => pair.en && pair.fr)
}

function mountOne(host: HTMLElement): Cleanup {
  if (host.getAttribute('data-en-fr-mounted') === 'true') return () => {}

  const board = host.querySelector('[data-en-fr-board]') as HTMLElement | null
  const pairs = readPairs(host)
  if (!board || pairs.length === 0) return () => {}

  host.setAttribute('data-en-fr-mounted', 'true')

  let selected: HTMLButtonElement | null = null
  let suppressClick = false
  const rows: { slot: HTMLElement; expected: string }[] = []

  function clearSelection() {
    if (!selected) return
    selected.classList.remove('is-selected')
    selected = null
  }

  function clearMarks() {
    rows.forEach(({ slot }) => {
      slot.classList.remove('is-correct', 'is-wrong')
    })
    const feedback = board!.querySelector('[data-en-fr-feedback]')
    if (feedback) feedback.textContent = ''
  }

  function makeChip(label: string): HTMLButtonElement {
    const chip = document.createElement('button')
    chip.type = 'button'
    chip.className = 'hb-fr-chip'
    chip.textContent = label
    chip.dataset.word = label
    chip.setAttribute('draggable', 'true')

    chip.addEventListener('dragstart', (e) => {
      suppressClick = true
      e.dataTransfer?.setData('text/plain', label)
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
      chip.style.opacity = '0.65'
    })
    chip.addEventListener('dragend', () => {
      chip.style.opacity = '1'
      window.setTimeout(() => {
        suppressClick = false
      }, 0)
    })
    chip.addEventListener('click', (e) => {
      e.preventDefault()
      if (suppressClick) return
      clearMarks()
      if (chip.parentElement === bank) {
        if (selected === chip) {
          clearSelection()
          return
        }
        clearSelection()
        selected = chip
        chip.classList.add('is-selected')
        return
      }
      if (chip.parentElement?.classList.contains('hb-fr-slot')) {
        bank.appendChild(chip)
        clearSelection()
      }
    })
    return chip
  }

  function placeInSlot(slot: HTMLElement, chip: HTMLButtonElement) {
    clearMarks()
    const existing = slot.querySelector('.hb-fr-chip') as HTMLButtonElement | null
    if (existing && existing !== chip) bank.appendChild(existing)
    slot.appendChild(chip)
    chip.classList.remove('is-selected')
    if (selected === chip) selected = null
  }

  const bank = document.createElement('div')
  bank.className = 'hb-fr-bank'
  bank.addEventListener('dragover', (e) => {
    e.preventDefault()
  })
  bank.addEventListener('drop', (e) => {
    e.preventDefault()
    const word = e.dataTransfer?.getData('text/plain')
    if (!word) return
    const chips = Array.from(board.querySelectorAll('.hb-fr-chip')) as HTMLButtonElement[]
    const chip = chips.find((item) => item.dataset.word === word)
    if (!chip || chip.parentElement === bank) return
    clearMarks()
    bank.appendChild(chip)
    clearSelection()
  })

  function slotHandlers(slot: HTMLElement) {
    slot.addEventListener('click', () => {
      if (selected && selected.parentElement === bank) {
        placeInSlot(slot, selected)
        return
      }
      const sitting = slot.querySelector('.hb-fr-chip') as HTMLButtonElement | null
      if (sitting) {
        bank.appendChild(sitting)
        clearMarks()
        clearSelection()
      }
    })
    slot.addEventListener('dragover', (e) => {
      e.preventDefault()
      slot.classList.add('is-over')
    })
    slot.addEventListener('dragleave', () => {
      slot.classList.remove('is-over')
    })
    slot.addEventListener('drop', (e) => {
      e.preventDefault()
      slot.classList.remove('is-over')
      const word = e.dataTransfer?.getData('text/plain')
      if (!word) return
      const chips = Array.from(board!.querySelectorAll('.hb-fr-chip')) as HTMLButtonElement[]
      const chip = chips.find((item) => item.dataset.word === word)
      if (chip) placeInSlot(slot, chip)
    })
  }

  function checkAnswers() {
    let correct = 0
    rows.forEach(({ slot, expected }) => {
      slot.classList.remove('is-correct', 'is-wrong', 'is-over')
      const chip = slot.querySelector('.hb-fr-chip') as HTMLButtonElement | null
      if (chip && norm(chip.dataset.word) === norm(expected)) {
        slot.classList.add('is-correct')
        correct += 1
      } else {
        slot.classList.add('is-wrong')
      }
    })
    const feedback = board!.querySelector('[data-en-fr-feedback]')
    if (!feedback) return
    if (correct === rows.length) {
      feedback.textContent = `Excellent — ${correct} / ${rows.length} correct.`
      feedback.className = 'hb-fr-feedback is-ok'
    } else {
      feedback.textContent = `${correct} / ${rows.length} correct. Change the red boxes and try again.`
      feedback.className = 'hb-fr-feedback is-miss'
    }
  }

  function build() {
    if (bank.parentElement) bank.remove()
    board.innerHTML = ''
    selected = null
    rows.length = 0
    bank.innerHTML = ''

    const list = document.createElement('div')
    list.className = 'hb-fr-list'

    pairs.forEach((pair, index) => {
      const row = document.createElement('div')
      row.className = 'hb-fr-row'

      const label = document.createElement('div')
      label.className = 'hb-fr-label'
      label.textContent = `${index + 1}. ${pair.en}`

      const slot = document.createElement('div')
      slot.className = 'hb-fr-slot'
      slot.dataset.expected = pair.fr
      slot.setAttribute('role', 'button')
      slot.setAttribute('tabindex', '0')
      slot.setAttribute('aria-label', `French word for ${pair.en}`)
      slotHandlers(slot)
      slot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          slot.click()
        }
      })

      row.appendChild(label)
      row.appendChild(slot)
      list.appendChild(row)
      rows.push({ slot, expected: pair.fr })
    })

    const bankTitle = document.createElement('p')
    bankTitle.className = 'hb-fr-bank-title'
    bankTitle.textContent = 'French words'

    shuffle(pairs.map((pair) => pair.fr)).forEach((fr) => {
      bank.appendChild(makeChip(fr))
    })

    const toolbar = document.createElement('div')
    toolbar.className = 'hb-fr-toolbar screen-only'

    const btnCheck = document.createElement('button')
    btnCheck.type = 'button'
    btnCheck.className = 'hb-fr-check'
    btnCheck.textContent = 'Check answers'
    btnCheck.addEventListener('click', checkAnswers)

    const btnReset = document.createElement('button')
    btnReset.type = 'button'
    btnReset.className = 'hb-fr-reset'
    btnReset.textContent = 'Shuffle & reset'
    btnReset.addEventListener('click', build)

    const feedback = document.createElement('p')
    feedback.className = 'hb-fr-feedback'
    feedback.dataset.enFrFeedback = 'true'
    feedback.setAttribute('role', 'status')

    toolbar.appendChild(btnCheck)
    toolbar.appendChild(btnReset)
    toolbar.appendChild(feedback)

    const bankWrap = document.createElement('div')
    bankWrap.className = 'hb-fr-bank-wrap'
    bankWrap.appendChild(bankTitle)
    bankWrap.appendChild(bank)

    board!.appendChild(list)
    board!.appendChild(bankWrap)
    board!.appendChild(toolbar)
  }

  build()

  return () => {
    host.removeAttribute('data-en-fr-mounted')
    board.innerHTML = ''
    selected = null
    rows.length = 0
  }
}

export function mountEnglishFrenchMatches(root: HTMLElement): Cleanup {
  const hosts = Array.from(root.querySelectorAll('[data-en-fr-match]')) as HTMLElement[]
  const cleanups = hosts.map((host) => mountOne(host))
  return () => cleanups.forEach((fn) => fn())
}
