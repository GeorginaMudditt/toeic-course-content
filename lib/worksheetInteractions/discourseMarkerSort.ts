/**
 * Drag-and-drop discourse markers into category columns, with Check answers.
 * Mounted from WorksheetViewer when HTML contains [data-discourse-marker-sort].
 *
 * Category columns are declared as:
 *   <div data-dm-category="Adding information" data-dm-items="Furthermore|In addition"></div>
 */

type Cleanup = () => void

type Category = {
  name: string
  items: string[]
  drop: HTMLElement
}

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

function parseItems(value: string | null): string[] {
  return (value || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
}

function expectedCategory(categories: Category[], label: string): string | null {
  const found = categories.find((cat) => cat.items.includes(label))
  return found ? found.name : null
}

export function mountDiscourseMarkerSort(root: HTMLElement): Cleanup {
  if (root.getAttribute('data-discourse-marker-sort-mounted') === 'true') {
    return () => {}
  }

  function readCategoryDefs(): { name: string; items: string[] }[] {
    const stored = root.getAttribute('data-dm-config')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { name: string; items: string[] }[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch {
        /* fall through and read templates */
      }
    }
    const templates = Array.from(root.querySelectorAll('[data-dm-category]')) as HTMLElement[]
    const defs = templates
      .map((el) => ({
        name: el.getAttribute('data-dm-category') || '',
        items: parseItems(el.getAttribute('data-dm-items')),
      }))
      .filter((def) => def.name && def.items.length > 0)
    if (defs.length > 0) {
      root.setAttribute('data-dm-config', JSON.stringify(defs))
    }
    return defs
  }

  const categoryDefs = readCategoryDefs()
  if (categoryDefs.length === 0) return () => {}
  Array.from(root.querySelectorAll('[data-dm-category]')).forEach((el) => el.remove())

  let selectedChip: HTMLElement | null = null
  let bankEl: HTMLElement | null = null
  const categories: Category[] = []

  function clearSelection() {
    if (selectedChip) {
      selectedChip.classList.remove('is-selected')
      selectedChip = null
    }
  }

  function makeChip(label: string): HTMLElement {
    const chip = document.createElement('button')
    chip.type = 'button'
    chip.className = 'mie-dm-chip'
    chip.textContent = label
    chip.dataset.marker = label
    chip.setAttribute('draggable', 'true')
    chip.setAttribute('aria-label', label)

    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer?.setData('text/plain', label)
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
      chip.classList.add('is-dragging')
      clearSelection()
    })
    chip.addEventListener('dragend', () => chip.classList.remove('is-dragging'))

    chip.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (chip.parentElement === bankEl) {
        if (selectedChip === chip) {
          clearSelection()
          return
        }
        clearSelection()
        selectedChip = chip
        chip.classList.add('is-selected')
        return
      }
      if (bankEl) {
        bankEl.appendChild(chip)
        chip.classList.remove('is-correct', 'is-wrong')
        clearSelection()
      }
    })

    return chip
  }

  function placeInDrop(drop: HTMLElement, chip: HTMLElement) {
    drop.appendChild(chip)
    chip.classList.remove('is-selected', 'is-correct', 'is-wrong')
    clearSelection()
  }

  function bindDrop(drop: HTMLElement) {
    drop.addEventListener('dragover', (e) => {
      e.preventDefault()
      drop.classList.add('is-over')
    })
    drop.addEventListener('dragleave', () => drop.classList.remove('is-over'))
    drop.addEventListener('drop', (e) => {
      e.preventDefault()
      drop.classList.remove('is-over')
      const label = e.dataTransfer?.getData('text/plain')
      if (!label || !bankEl) return
      const chips = Array.from(root.querySelectorAll('.mie-dm-chip')) as HTMLElement[]
      const chip = chips.find((c) => c.dataset.marker === label)
      if (chip) placeInDrop(drop, chip)
    })
    drop.addEventListener('click', () => {
      if (selectedChip && selectedChip.parentElement === bankEl) {
        placeInDrop(drop, selectedChip)
      }
    })
  }

  function checkAnswers() {
    let correct = 0
    let placed = 0
    const chips = Array.from(root.querySelectorAll('.mie-dm-chip')) as HTMLElement[]
    chips.forEach((chip) => {
      chip.classList.remove('is-correct', 'is-wrong')
      const label = chip.dataset.marker || ''
      const parentDrop = chip.closest('[data-dm-drop]') as HTMLElement | null
      if (!parentDrop) return
      placed++
      const catName = parentDrop.getAttribute('data-dm-drop') || ''
      if (expectedCategory(categories, label) === catName) {
        chip.classList.add('is-correct')
        correct++
      } else {
        chip.classList.add('is-wrong')
      }
    })
    const total = chips.length
    if (feedbackEl) {
      if (placed < total) {
        feedbackEl.textContent = `Place every marker first — ${placed} / ${total} placed, ${correct} correct so far.`
        feedbackEl.style.color = '#92400e'
      } else if (correct === total) {
        feedbackEl.textContent = `Excellent — all ${total} discourse markers are in the right category.`
        feedbackEl.style.color = '#15803d'
      } else {
        feedbackEl.textContent = `${correct} / ${total} correct. Green chips are right; move the red ones.`
        feedbackEl.style.color = '#92400e'
      }
    }
  }

  function reset() {
    if (!bankEl) return
    const chips = Array.from(root.querySelectorAll('.mie-dm-chip')) as HTMLElement[]
    shuffle(chips).forEach((chip) => {
      chip.classList.remove('is-correct', 'is-wrong', 'is-selected')
      bankEl!.appendChild(chip)
    })
    clearSelection()
    if (feedbackEl) {
      feedbackEl.textContent = ''
      feedbackEl.style.color = '#4338ca'
    }
  }

  const layout = document.createElement('div')
  layout.className = 'mie-dm-layout'

  const table = document.createElement('div')
  table.className = 'mie-dm-table'

  categoryDefs.forEach((def) => {
    const col = document.createElement('div')
    col.className = 'mie-dm-col'

    const heading = document.createElement('h4')
    heading.className = 'mie-dm-heading'
    heading.textContent = def.name

    const drop = document.createElement('div')
    drop.className = 'mie-dm-drop'
    drop.setAttribute('data-dm-drop', def.name)
    drop.setAttribute('aria-label', `${def.name} drop zone`)
    bindDrop(drop)

    col.appendChild(heading)
    col.appendChild(drop)
    table.appendChild(col)
    categories.push({ name: def.name, items: def.items, drop })
  })

  const bank = document.createElement('div')
  bankEl = bank
  bank.className = 'mie-dm-bank'

  const bankTitle = document.createElement('p')
  bankTitle.className = 'mie-dm-bank-title'
  bankTitle.textContent = 'Word bank — drag a marker, or tap it and then tap a column'
  bank.appendChild(bankTitle)

  const bankInner = document.createElement('div')
  bankInner.className = 'mie-dm-bank-items'
  const allLabels = shuffle(categoryDefs.flatMap((def) => def.items))
  allLabels.forEach((label) => bankInner.appendChild(makeChip(label)))
  bank.appendChild(bankInner)

  layout.appendChild(table)
  layout.appendChild(bank)

  const toolbar = document.createElement('div')
  toolbar.className = 'mie-dm-toolbar screen-only'

  const checkBtn = document.createElement('button')
  checkBtn.type = 'button'
  checkBtn.textContent = 'Check answers'
  checkBtn.className = 'mie-btn mie-btn-primary'
  checkBtn.addEventListener('click', checkAnswers)

  const resetBtn = document.createElement('button')
  resetBtn.type = 'button'
  resetBtn.textContent = 'Shuffle & reset'
  resetBtn.className = 'mie-btn mie-btn-secondary'
  resetBtn.addEventListener('click', reset)

  const feedbackEl = document.createElement('p')
  feedbackEl.setAttribute('role', 'status')
  feedbackEl.className = 'mie-dm-feedback'
  feedbackEl.style.cssText =
    'margin: 0; font-size: 14px; font-weight: 600; min-height: 22px; color: #4338ca;'

  toolbar.appendChild(checkBtn)
  toolbar.appendChild(resetBtn)
  toolbar.appendChild(feedbackEl)

  root.appendChild(layout)
  root.appendChild(toolbar)
  root.setAttribute('data-discourse-marker-sort-mounted', 'true')

  return () => {
    root.innerHTML = ''
    root.removeAttribute('data-discourse-marker-sort-mounted')
    selectedChip = null
    bankEl = null
  }
}

export function mountDiscourseMarkerSorts(host: HTMLElement): () => void {
  const roots = Array.from(host.querySelectorAll('[data-discourse-marker-sort]')) as HTMLElement[]
  const cleanups = roots
    .filter((el) => el.getAttribute('data-discourse-marker-sort-mounted') !== 'true')
    .map((el) => mountDiscourseMarkerSort(el))
  return () => cleanups.forEach((fn) => fn())
}
