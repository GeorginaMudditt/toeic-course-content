/**
 * Drag-and-drop discourse markers into category columns, with Check answers.
 * Enhances existing HTML ([data-dm-drop] + .mie-dm-chip). Falls back to
 * building from [data-dm-category] templates if the table is not in the markup.
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

function on<K extends keyof HTMLElementEventMap>(
  el: HTMLElement,
  type: K,
  handler: (e: HTMLElementEventMap[K]) => void
): Cleanup {
  el.addEventListener(type, handler)
  return () => el.removeEventListener(type, handler)
}

export function mountDiscourseMarkerSort(root: HTMLElement): Cleanup {
  if (root.getAttribute('data-discourse-marker-sort-mounted') === 'true') {
    return () => {}
  }

  const cleanups: Cleanup[] = []
  let selectedChip: HTMLElement | null = null
  const bankEl =
    (root.querySelector('[data-dm-bank]') as HTMLElement | null) ||
    (root.querySelector('.mie-dm-bank-items') as HTMLElement | null)

  const dropEls = Array.from(root.querySelectorAll('[data-dm-drop]')) as HTMLElement[]
  const categories: Category[] = dropEls.map((drop) => ({
    name: drop.getAttribute('data-dm-drop') || '',
    items: parseItems(drop.getAttribute('data-dm-accept')),
    drop,
  })).filter((cat) => cat.name)

  if (categories.length === 0) return () => {}

  function clearSelection() {
    if (selectedChip) {
      selectedChip.classList.remove('is-selected')
      selectedChip = null
    }
  }

  function placeInDrop(drop: HTMLElement, chip: HTMLElement) {
    drop.appendChild(chip)
    chip.classList.remove('is-selected', 'is-correct', 'is-wrong')
    clearSelection()
  }

  function returnToBank(chip: HTMLElement) {
    if (!bankEl) return
    bankEl.appendChild(chip)
    chip.classList.remove('is-correct', 'is-wrong', 'is-selected')
    clearSelection()
  }

  function bindChip(chip: HTMLElement) {
    const label = chip.dataset.marker || chip.textContent?.trim() || ''
    chip.dataset.marker = label
    chip.setAttribute('draggable', 'true')
    if (!chip.getAttribute('type') && chip.tagName === 'BUTTON') {
      chip.setAttribute('type', 'button')
    }

    cleanups.push(
      on(chip, 'dragstart', (e) => {
        e.dataTransfer?.setData('text/plain', label)
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
        chip.classList.add('is-dragging')
        clearSelection()
      })
    )
    cleanups.push(on(chip, 'dragend', () => chip.classList.remove('is-dragging')))

    cleanups.push(
      on(chip, 'click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (bankEl && chip.parentElement === bankEl) {
          if (selectedChip === chip) {
            clearSelection()
            return
          }
          clearSelection()
          selectedChip = chip
          chip.classList.add('is-selected')
          return
        }
        returnToBank(chip)
      })
    )
  }

  function bindDrop(drop: HTMLElement) {
    cleanups.push(
      on(drop, 'dragover', (e) => {
        e.preventDefault()
        drop.classList.add('is-over')
      })
    )
    cleanups.push(on(drop, 'dragleave', () => drop.classList.remove('is-over')))
    cleanups.push(
      on(drop, 'drop', (e) => {
        e.preventDefault()
        drop.classList.remove('is-over')
        const word = e.dataTransfer?.getData('text/plain')
        if (!word) return
        const chips = Array.from(root.querySelectorAll('.mie-dm-chip')) as HTMLElement[]
        const chip = chips.find((c) => c.dataset.marker === word)
        if (chip) placeInDrop(drop, chip)
      })
    )
    cleanups.push(
      on(drop, 'click', () => {
        if (selectedChip && bankEl && selectedChip.parentElement === bankEl) {
          placeInDrop(drop, selectedChip)
        }
      })
    )
  }

  const chips = Array.from(root.querySelectorAll('.mie-dm-chip')) as HTMLElement[]
  chips.forEach(bindChip)
  categories.forEach((cat) => bindDrop(cat.drop))

  if (bankEl && chips.length > 0) {
    shuffle(chips).forEach((chip) => {
      if (!chip.closest('[data-dm-drop]')) bankEl.appendChild(chip)
    })
  }

  const feedbackEl =
    (root.querySelector('[data-dm-feedback]') as HTMLElement | null) ||
    (() => {
      const el = document.createElement('p')
      el.setAttribute('data-dm-feedback', '')
      el.setAttribute('role', 'status')
      el.style.cssText =
        'margin: 0; font-size: 14px; font-weight: 600; min-height: 22px; color: #4338ca;'
      const toolbar = root.querySelector('.mie-dm-toolbar')
      if (toolbar) toolbar.appendChild(el)
      else root.appendChild(el)
      return el
    })()

  function checkAnswers() {
    let correct = 0
    let placed = 0
    const allChips = Array.from(root.querySelectorAll('.mie-dm-chip')) as HTMLElement[]
    allChips.forEach((chip) => {
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
    const total = allChips.length
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

  function reset() {
    if (!bankEl) return
    const allChips = Array.from(root.querySelectorAll('.mie-dm-chip')) as HTMLElement[]
    shuffle(allChips).forEach((chip) => {
      chip.classList.remove('is-correct', 'is-wrong', 'is-selected')
      bankEl.appendChild(chip)
    })
    clearSelection()
    feedbackEl.textContent = ''
    feedbackEl.style.color = '#4338ca'
  }

  const checkBtn = root.querySelector('[data-dm-check]') as HTMLButtonElement | null
  const resetBtn = root.querySelector('[data-dm-reset]') as HTMLButtonElement | null
  if (checkBtn) {
    cleanups.push(on(checkBtn, 'click', checkAnswers))
  }
  if (resetBtn) {
    cleanups.push(on(resetBtn, 'click', reset))
  }

  root.setAttribute('data-discourse-marker-sort-mounted', 'true')

  return () => {
    cleanups.forEach((fn) => fn())
    root.removeAttribute('data-discourse-marker-sort-mounted')
    selectedChip = null
    Array.from(root.querySelectorAll('.mie-dm-chip')).forEach((chip) => {
      chip.classList.remove('is-dragging', 'is-selected', 'is-correct', 'is-wrong')
    })
    categories.forEach((cat) => cat.drop.classList.remove('is-over'))
  }
}

export function mountDiscourseMarkerSorts(host: HTMLElement): () => void {
  const roots = Array.from(host.querySelectorAll('[data-discourse-marker-sort]')) as HTMLElement[]
  const cleanups = roots
    .filter((el) => el.getAttribute('data-discourse-marker-sort-mounted') !== 'true')
    .map((el) => mountDiscourseMarkerSort(el))
  return () => cleanups.forEach((fn) => fn())
}
