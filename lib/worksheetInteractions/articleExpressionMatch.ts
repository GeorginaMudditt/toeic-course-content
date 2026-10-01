/**
 * Drag expressions into sentence gaps for "Articles in Common Expressions".
 * Mounted from WorksheetViewer when HTML contains [data-article-expression-match].
 */

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

function on<K extends keyof HTMLElementEventMap>(
  el: HTMLElement,
  type: K,
  handler: (e: HTMLElementEventMap[K]) => void
): Cleanup {
  el.addEventListener(type, handler)
  return () => el.removeEventListener(type, handler)
}

function chipsIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll('.ace-chip')) as HTMLElement[]
}

function dropsIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll('[data-ace-drop]')) as HTMLElement[]
}

export function mountArticleExpressionMatch(root: HTMLElement): Cleanup {
  if (root.getAttribute('data-article-expression-match-mounted') === 'true') {
    return () => {}
  }

  const bank = root.querySelector('[data-ace-bank]') as HTMLElement | null
  const feedback = root.querySelector('[data-ace-feedback]') as HTMLElement | null
  const drops = dropsIn(root)
  if (!bank || drops.length === 0) return () => {}

  const cleanups: Cleanup[] = []
  let selected: HTMLElement | null = null
  let suppressClick = false

  function clearSelection() {
    if (selected) {
      selected.classList.remove('is-selected')
      selected = null
    }
  }

  function clearMarks() {
    chipsIn(root).forEach((chip) => chip.classList.remove('is-correct', 'is-wrong'))
    drops.forEach((drop) => drop.classList.remove('is-correct', 'is-wrong'))
    if (feedback) feedback.textContent = ''
  }

  function setDropInteractive(drop: HTMLElement, interactive: boolean) {
    if (interactive) {
      drop.setAttribute('role', 'button')
      drop.setAttribute('tabindex', '0')
    } else {
      drop.removeAttribute('role')
      drop.removeAttribute('tabindex')
    }
  }

  function ensurePlaceholder(drop: HTMLElement) {
    setDropInteractive(drop, true)
    if (drop.querySelector('.ace-chip')) return
    if (drop.querySelector('.ace-placeholder')) return
    const placeholder = document.createElement('span')
    placeholder.className = 'ace-placeholder'
    placeholder.textContent = 'drop here'
    drop.appendChild(placeholder)
  }

  function placeInDrop(drop: HTMLElement, chip: HTMLElement) {
    clearMarks()
    const fromDrop = chip.closest('[data-ace-drop]') as HTMLElement | null
    const existing = drop.querySelector('.ace-chip') as HTMLElement | null
    if (existing && existing !== chip) {
      bank!.appendChild(existing)
      existing.classList.remove('is-correct', 'is-wrong', 'is-selected')
    }
    drop.querySelector('.ace-placeholder')?.remove()
    setDropInteractive(drop, false)
    drop.appendChild(chip)
    chip.classList.remove('is-selected', 'is-correct', 'is-wrong')
    drop.classList.remove('is-correct', 'is-wrong', 'is-over')
    if (fromDrop && fromDrop !== drop) ensurePlaceholder(fromDrop)
    clearSelection()
    if (feedback) feedback.textContent = ''
  }

  function returnToBank(chip: HTMLElement) {
    clearMarks()
    const fromDrop = chip.closest('[data-ace-drop]') as HTMLElement | null
    bank!.appendChild(chip)
    chip.classList.remove('is-correct', 'is-wrong', 'is-selected')
    if (fromDrop) {
      fromDrop.classList.remove('is-correct', 'is-wrong', 'is-over')
      ensurePlaceholder(fromDrop)
    }
    clearSelection()
    if (feedback) feedback.textContent = ''
  }

  function findChip(id: string): HTMLElement | null {
    return chipsIn(root).find((chip) => chip.dataset.aceId === id) || null
  }

  chipsIn(root).forEach((chip) => {
    chip.setAttribute('draggable', 'true')
    if (!chip.getAttribute('type') && chip.tagName === 'BUTTON') {
      chip.setAttribute('type', 'button')
    }

    cleanups.push(
      on(chip, 'dragstart', (e) => {
        const id = chip.dataset.aceId || ''
        e.dataTransfer?.setData('text/plain', id)
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
        chip.classList.add('is-dragging')
        clearSelection()
      })
    )
    cleanups.push(
      on(chip, 'dragend', () => {
        chip.classList.remove('is-dragging')
        suppressClick = true
      })
    )
    cleanups.push(
      on(chip, 'click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (suppressClick) {
          suppressClick = false
          return
        }
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
        returnToBank(chip)
      })
    )
  })

  drops.forEach((drop) => {
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
        const id = e.dataTransfer?.getData('text/plain') || ''
        const chip = id ? findChip(id) : null
        if (chip) placeInDrop(drop, chip)
      })
    )
    cleanups.push(
      on(drop, 'click', () => {
        if (selected && selected.parentElement === bank) {
          placeInDrop(drop, selected)
        }
      })
    )
  })

  cleanups.push(
    on(bank, 'dragover', (e) => {
      e.preventDefault()
      bank.classList.add('is-over')
    })
  )
  cleanups.push(on(bank, 'dragleave', () => bank.classList.remove('is-over')))
  cleanups.push(
    on(bank, 'drop', (e) => {
      e.preventDefault()
      bank.classList.remove('is-over')
      const id = e.dataTransfer?.getData('text/plain') || ''
      const chip = id ? findChip(id) : null
      if (chip) returnToBank(chip)
    })
  )
  cleanups.push(
    on(bank, 'click', () => {
      if (selected && selected.parentElement !== bank) return
      clearSelection()
    })
  )

  function checkAnswers() {
    let correct = 0
    let placed = 0
    drops.forEach((drop) => {
      drop.classList.remove('is-correct', 'is-wrong')
      const chip = drop.querySelector('.ace-chip') as HTMLElement | null
      if (!chip) return
      placed++
      chip.classList.remove('is-correct', 'is-wrong')
      const ok = chip.dataset.aceId === drop.dataset.aceAnswer
      chip.classList.add(ok ? 'is-correct' : 'is-wrong')
      drop.classList.add(ok ? 'is-correct' : 'is-wrong')
      if (ok) correct++
    })
    const total = drops.length
    if (!feedback) return
    if (placed < total) {
      feedback.textContent = `Place every expression first — ${placed} / ${total} placed, ${correct} correct so far.`
      feedback.style.color = '#92400e'
    } else if (correct === total) {
      feedback.textContent = `Excellent — all ${total} expressions are correct.`
      feedback.style.color = '#15803d'
    } else {
      feedback.textContent = `${correct} / ${total} correct. Green is right; move the red ones.`
      feedback.style.color = '#92400e'
    }
  }

  function reset() {
    clearMarks()
    shuffle(chipsIn(root)).forEach((chip) => {
      chip.classList.remove('is-correct', 'is-wrong', 'is-selected', 'is-dragging')
      bank.appendChild(chip)
    })
    drops.forEach((drop) => {
      drop.classList.remove('is-over', 'is-correct', 'is-wrong')
      drop.querySelector('.ace-placeholder')?.remove()
      ensurePlaceholder(drop)
    })
    clearSelection()
  }

  function showAnswers() {
    clearMarks()
    drops.forEach((drop) => {
      const chip = findChip(drop.dataset.aceAnswer || '')
      if (chip) placeInDrop(drop, chip)
    })
    checkAnswers()
  }

  const checkBtn = root.querySelector('[data-ace-check]')
  const resetBtn = root.querySelector('[data-ace-reset]')
  const showBtn = root.querySelector('[data-ace-show]')
  if (checkBtn) cleanups.push(on(checkBtn as HTMLElement, 'click', checkAnswers))
  if (resetBtn) cleanups.push(on(resetBtn as HTMLElement, 'click', reset))
  if (showBtn) cleanups.push(on(showBtn as HTMLElement, 'click', showAnswers))

  shuffle(chipsIn(root)).forEach((chip) => {
    if (!chip.closest('[data-ace-drop]')) bank.appendChild(chip)
  })

  root.setAttribute('data-article-expression-match-mounted', 'true')

  return () => {
    cleanups.forEach((fn) => fn())
    root.removeAttribute('data-article-expression-match-mounted')
    clearSelection()
    clearMarks()
  }
}

export function mountArticleExpressionMatches(host: HTMLElement): () => void {
  const roots = Array.from(host.querySelectorAll('[data-article-expression-match]')) as HTMLElement[]
  const cleanups = roots
    .filter((el) => el.getAttribute('data-article-expression-match-mounted') !== 'true')
    .map((el) => mountArticleExpressionMatch(el))
  return () => cleanups.forEach((fn) => fn())
}
