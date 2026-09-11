/**
 * Drag compact paragraphs into numbered drop zones, with Check answers.
 * Mounted from WorksheetViewer when HTML contains [data-paragraph-reorder].
 */

type Cleanup = () => void

const DRAG_THRESHOLD = 8

function on<K extends keyof HTMLElementEventMap>(
  el: HTMLElement,
  type: K,
  handler: (e: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions
): Cleanup {
  el.addEventListener(type, handler, options)
  return () => el.removeEventListener(type, handler, options)
}

function getCards(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll('[data-paragraph-id]')) as HTMLElement[]
}

function getDrops(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll('[data-paragraph-drop]')) as HTMLElement[]
}

function parseCorrectOrder(root: HTMLElement): string[] {
  return (root.getAttribute('data-correct-order') || '')
    .split('|')
    .map((id) => id.trim())
    .filter(Boolean)
}

function cardInDrop(drop: HTMLElement): HTMLElement | null {
  return (drop.querySelector('[data-paragraph-id]') as HTMLElement | null)
}

function currentOrder(root: HTMLElement): string[] {
  return getDrops(root).map((drop) => cardInDrop(drop)?.getAttribute('data-paragraph-id') || '')
}

function clearMarks(root: HTMLElement) {
  getCards(root).forEach((item) => {
    item.classList.remove('is-correct', 'is-wrong')
  })
  getDrops(root).forEach((drop) => {
    drop.classList.remove('is-correct', 'is-wrong')
  })
}

function clearSelection(root: HTMLElement) {
  getCards(root).forEach((item) => item.classList.remove('is-selected'))
}

function hitTest(clientX: number, clientY: number, ignore: HTMLElement): HTMLElement | null {
  const prev = ignore.style.pointerEvents
  ignore.style.pointerEvents = 'none'
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null
  ignore.style.pointerEvents = prev
  return el
}

export function mountParagraphReorder(root: HTMLElement): Cleanup {
  if (root.getAttribute('data-paragraph-reorder-mounted') === 'true') {
    return () => {}
  }

  const bankEl =
    (root.querySelector('[data-paragraph-bank]') as HTMLElement | null) ||
    (root.querySelector('[data-paragraph-list]') as HTMLElement | null)
  const drops = getDrops(root)
  if (!bankEl || drops.length === 0) return () => {}
  const bank: HTMLElement = bankEl

  const correct = parseCorrectOrder(root)
  if (correct.length === 0) return () => {}

  const initialOrder = getCards(root).map((item) => item.getAttribute('data-paragraph-id') || '')
  const cleanups: Cleanup[] = []
  let selected: HTMLElement | null = null

  const feedback =
    (root.querySelector('[data-reorder-feedback]') as HTMLElement | null) ||
    (() => {
      const el = document.createElement('p')
      el.setAttribute('data-reorder-feedback', '')
      el.setAttribute('role', 'status')
      el.style.cssText =
        'margin: 0; font-size: 14px; font-weight: 600; min-height: 22px; color: #4338ca;'
      const toolbar = root.querySelector('.mie-reorder-toolbar')
      if (toolbar) toolbar.appendChild(el)
      else root.appendChild(el)
      return el
    })()

  function resetHighlights() {
    clearMarks(root)
    feedback.textContent = ''
    feedback.style.color = '#4338ca'
  }

  function placeInDrop(drop: HTMLElement, card: HTMLElement) {
    const existing = cardInDrop(drop)
    const fromDrop = card.closest('[data-paragraph-drop]') as HTMLElement | null
    if (existing && existing !== card) {
      if (fromDrop) fromDrop.appendChild(existing)
      else bank.appendChild(existing)
    }
    drop.appendChild(card)
    selected = null
    clearSelection(root)
    resetHighlights()
  }

  function returnToBank(card: HTMLElement) {
    bank.appendChild(card)
    selected = null
    clearSelection(root)
    resetHighlights()
  }

  function checkAnswers() {
    const order = currentOrder(root)
    const placed = order.filter(Boolean).length
    const total = correct.length
    let correctCount = 0

    getDrops(root).forEach((drop, index) => {
      const card = cardInDrop(drop)
      drop.classList.remove('is-correct', 'is-wrong')
      if (!card) return
      const id = card.getAttribute('data-paragraph-id') || ''
      const ok = id === correct[index]
      card.classList.toggle('is-correct', ok)
      card.classList.toggle('is-wrong', !ok)
      drop.classList.toggle('is-correct', ok)
      drop.classList.toggle('is-wrong', !ok)
      if (ok) correctCount++
    })

    getCards(root).forEach((card) => {
      if (!card.closest('[data-paragraph-drop]')) {
        card.classList.remove('is-correct', 'is-wrong')
      }
    })

    if (placed < total) {
      feedback.textContent = `Place every paragraph first — ${placed} / ${total} placed, ${correctCount} in the right position so far.`
      feedback.style.color = '#92400e'
    } else if (correctCount === total) {
      feedback.textContent = `Excellent — all ${total} paragraphs are in the correct order.`
      feedback.style.color = '#15803d'
    } else {
      feedback.textContent = `${correctCount} / ${total} paragraphs are in the right position. Green is correct; try moving the red ones.`
      feedback.style.color = '#92400e'
    }
  }

  function restoreInitialOrder() {
    initialOrder.forEach((id) => {
      const item = getCards(root).find((el) => el.getAttribute('data-paragraph-id') === id)
      if (item) bank.appendChild(item)
    })
    selected = null
    clearSelection(root)
    resetHighlights()
  }

  function bindCard(card: HTMLElement) {
    card.setAttribute('tabindex', '0')
    card.setAttribute('draggable', 'false')

    const expandBtn = card.querySelector('[data-paragraph-expand]') as HTMLButtonElement | null
    if (expandBtn) {
      const toggleExpand = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        const open = card.classList.toggle('is-expanded')
        expandBtn.setAttribute('aria-expanded', open ? 'true' : 'false')
        expandBtn.textContent = open ? 'Hide' : 'Read'
      }
      cleanups.push(on(expandBtn, 'click', toggleExpand))
      cleanups.push(
        on(expandBtn, 'pointerdown', (e) => {
          e.stopPropagation()
        })
      )
    }

    let pointerId: number | null = null
    let startX = 0
    let startY = 0
    let dragging = false

    function clearDropOver() {
      drops.forEach((drop) => drop.classList.remove('is-over'))
      bank.classList.remove('is-over')
    }

    cleanups.push(
      on(card, 'pointerdown', (e) => {
        if (e.button !== 0) return
        const target = e.target as HTMLElement | null
        if (target?.closest('button')) return
        pointerId = e.pointerId
        startX = e.clientX
        startY = e.clientY
        dragging = false
        try {
          card.setPointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
      })
    )

    cleanups.push(
      on(card, 'pointermove', (e) => {
        if (pointerId !== e.pointerId) return
        const dx = e.clientX - startX
        const dy = e.clientY - startY
        if (!dragging && dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
          dragging = true
          selected = null
          clearSelection(root)
          card.classList.add('is-dragging')
        }
        if (!dragging) return
        const hit = hitTest(e.clientX, e.clientY, card)
        const drop = hit?.closest('[data-paragraph-drop]') as HTMLElement | null
        drops.forEach((el) => el.classList.toggle('is-over', el === drop))
        bank.classList.toggle('is-over', Boolean(hit?.closest('[data-paragraph-bank], [data-paragraph-list]')) && !drop)
      })
    )

    function endPointer(e: PointerEvent) {
      if (pointerId !== e.pointerId) return
      pointerId = null
      try {
        card.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      card.classList.remove('is-dragging')
      const wasDragging = dragging
      dragging = false
      clearDropOver()

      if (wasDragging) {
        const hit = hitTest(e.clientX, e.clientY, card)
        const drop = hit?.closest('[data-paragraph-drop]') as HTMLElement | null
        const overBank = hit?.closest('[data-paragraph-bank], [data-paragraph-list]') as HTMLElement | null
        if (drop) placeInDrop(drop, card)
        else if (overBank) returnToBank(card)
        return
      }

      const inDrop = card.closest('[data-paragraph-drop]') as HTMLElement | null
      if (inDrop) {
        if (selected && selected !== card) {
          placeInDrop(inDrop, selected)
          return
        }
        returnToBank(card)
        return
      }

      if (selected === card) {
        selected = null
        card.classList.remove('is-selected')
        return
      }
      selected = card
      clearSelection(root)
      card.classList.add('is-selected')
    }

    cleanups.push(on(card, 'pointerup', endPointer))
    cleanups.push(on(card, 'pointercancel', endPointer))
  }

  getCards(root).forEach(bindCard)

  drops.forEach((drop) => {
    cleanups.push(
      on(drop, 'click', () => {
        if (selected) placeInDrop(drop, selected)
      })
    )
  })

  const checkBtn = root.querySelector('[data-reorder-check]') as HTMLButtonElement | null
  const resetBtn = root.querySelector('[data-reorder-reset]') as HTMLButtonElement | null
  if (checkBtn) cleanups.push(on(checkBtn, 'click', checkAnswers))
  if (resetBtn) cleanups.push(on(resetBtn, 'click', restoreInitialOrder))

  root.setAttribute('data-paragraph-reorder-mounted', 'true')

  return () => {
    cleanups.forEach((fn) => fn())
    root.removeAttribute('data-paragraph-reorder-mounted')
    selected = null
    getCards(root).forEach((item) => {
      item.classList.remove('is-dragging', 'is-selected', 'is-correct', 'is-wrong')
    })
    drops.forEach((drop) => drop.classList.remove('is-over', 'is-correct', 'is-wrong'))
    bank.classList.remove('is-over')
  }
}

export function mountParagraphReorders(host: HTMLElement): Cleanup {
  const roots = Array.from(host.querySelectorAll('[data-paragraph-reorder]')) as HTMLElement[]
  const cleanups = roots
    .filter((el) => el.getAttribute('data-paragraph-reorder-mounted') !== 'true')
    .map((el) => mountParagraphReorder(el))
  return () => cleanups.forEach((fn) => fn())
}
