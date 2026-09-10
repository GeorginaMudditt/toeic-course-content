/**
 * Drag-and-drop paragraph reordering with Check answers.
 * Mounted from WorksheetViewer when HTML contains [data-paragraph-reorder].
 */

type Cleanup = () => void

function on<K extends keyof HTMLElementEventMap>(
  el: HTMLElement,
  type: K,
  handler: (e: HTMLElementEventMap[K]) => void
): Cleanup {
  el.addEventListener(type, handler)
  return () => el.removeEventListener(type, handler)
}

function getItems(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll('[data-paragraph-id]')) as HTMLElement[]
}

function parseCorrectOrder(root: HTMLElement): string[] {
  return (root.getAttribute('data-correct-order') || '')
    .split('|')
    .map((id) => id.trim())
    .filter(Boolean)
}

function currentOrder(root: HTMLElement): string[] {
  return getItems(root).map((item) => item.getAttribute('data-paragraph-id') || '')
}

function clearMarks(root: HTMLElement) {
  getItems(root).forEach((item) => {
    item.classList.remove('is-correct', 'is-wrong')
  })
}

function moveBefore(list: HTMLElement, moving: HTMLElement, target: HTMLElement | null) {
  if (moving === target) return
  if (target) {
    list.insertBefore(moving, target)
  } else {
    list.appendChild(moving)
  }
}

function clearSelection(root: HTMLElement) {
  getItems(root).forEach((item) => item.classList.remove('is-selected'))
}

export function mountParagraphReorder(root: HTMLElement): Cleanup {
  if (root.getAttribute('data-paragraph-reorder-mounted') === 'true') {
    return () => {}
  }

  const list = root.querySelector('[data-paragraph-list]') as HTMLElement | null
  if (!list) return () => {}

  const correct = parseCorrectOrder(root)
  if (correct.length === 0) return () => {}

  const initialOrder = currentOrder(root)
  const cleanups: Cleanup[] = []
  let dragging: HTMLElement | null = null
  let selected: HTMLElement | null = null

  const feedback = document.createElement('p')
  feedback.setAttribute('role', 'status')
  feedback.className = 'mie-reorder-feedback screen-only'
  feedback.style.cssText =
    'margin: 12px 0 0 0; font-size: 14px; font-weight: 600; min-height: 22px; color: #4338ca;'

  function resetHighlights() {
    getItems(root).forEach((item) => item.classList.remove('is-correct', 'is-wrong'))
    feedback.textContent = ''
    feedback.style.color = '#4338ca'
  }

  function checkAnswers() {
    const order = currentOrder(root)
    let correctCount = 0
    getItems(root).forEach((item, index) => {
      const id = item.getAttribute('data-paragraph-id') || ''
      const ok = id === correct[index]
      item.classList.toggle('is-correct', ok)
      item.classList.toggle('is-wrong', !ok)
      if (ok) correctCount++
    })
    if (correctCount === correct.length) {
      feedback.textContent = `Excellent — all ${correct.length} paragraphs are in the correct order.`
      feedback.style.color = '#15803d'
    } else {
      feedback.textContent = `${correctCount} / ${correct.length} paragraphs are in the right position. Green is correct; try moving the red ones.`
      feedback.style.color = '#92400e'
    }
  }

  function restoreInitialOrder() {
    initialOrder.forEach((id) => {
      const item = getItems(root).find((el) => el.getAttribute('data-paragraph-id') === id)
      if (item) list.appendChild(item)
    })
    selected = null
    clearSelection(root)
    clearMarks(root)
    resetHighlights()
  }

  const items = getItems(root)
  items.forEach((item) => {
    item.setAttribute('draggable', 'true')
    if (!item.hasAttribute('tabindex')) item.setAttribute('tabindex', '0')

    cleanups.push(
      on(item, 'dragstart', (e) => {
        dragging = item
        selected = null
        clearSelection(root)
        item.classList.add('is-dragging')
        const dt = (e as DragEvent).dataTransfer
        if (dt) {
          dt.effectAllowed = 'move'
          dt.setData('text/plain', item.getAttribute('data-paragraph-id') || '')
        }
      })
    )

    cleanups.push(
      on(item, 'dragend', () => {
        item.classList.remove('is-dragging')
        getItems(root).forEach((el) => el.classList.remove('is-over'))
        dragging = null
        clearMarks(root)
        resetHighlights()
      })
    )

    cleanups.push(
      on(item, 'dragover', (e) => {
        e.preventDefault()
        if (!dragging || dragging === item) return
        item.classList.add('is-over')
        const rect = item.getBoundingClientRect()
        const mid = rect.top + rect.height / 2
        const placeAfter = (e as DragEvent).clientY > mid
        moveBefore(list, dragging, placeAfter ? (item.nextElementSibling as HTMLElement | null) : item)
        clearMarks(root)
      })
    )

    cleanups.push(on(item, 'dragleave', () => item.classList.remove('is-over')))

    cleanups.push(
      on(item, 'drop', (e) => {
        e.preventDefault()
        item.classList.remove('is-over')
        clearMarks(root)
        resetHighlights()
      })
    )

    cleanups.push(
      on(item, 'click', () => {
        if (dragging) return
        if (!selected) {
          selected = item
          clearSelection(root)
          item.classList.add('is-selected')
          return
        }
        if (selected === item) {
          selected.classList.remove('is-selected')
          selected = null
          return
        }
        moveBefore(list, selected, item)
        selected.classList.remove('is-selected')
        selected = null
        clearMarks(root)
        resetHighlights()
      })
    )

    cleanups.push(
      on(item, 'keydown', (e) => {
        const key = (e as KeyboardEvent).key
        if (key !== 'ArrowUp' && key !== 'ArrowDown') return
        e.preventDefault()
        const all = getItems(root)
        const index = all.indexOf(item)
        if (index < 0) return
        if (key === 'ArrowUp' && index > 0) {
          list.insertBefore(item, all[index - 1])
        } else if (key === 'ArrowDown' && index < all.length - 1) {
          const next = all[index + 1]
          list.insertBefore(next, item)
        }
        selected = null
        clearSelection(root)
        clearMarks(root)
        resetHighlights()
        item.focus()
      })
    )
  })

  const toolbar = document.createElement('div')
  toolbar.className = 'mie-reorder-toolbar screen-only'

  const checkBtn = document.createElement('button')
  checkBtn.type = 'button'
  checkBtn.textContent = 'Check answers'
  checkBtn.className = 'mie-btn mie-btn-primary'
  checkBtn.addEventListener('click', checkAnswers)
  cleanups.push(() => checkBtn.removeEventListener('click', checkAnswers))

  const resetBtn = document.createElement('button')
  resetBtn.type = 'button'
  resetBtn.textContent = 'Reset order'
  resetBtn.className = 'mie-btn mie-btn-secondary'
  resetBtn.addEventListener('click', restoreInitialOrder)
  cleanups.push(() => resetBtn.removeEventListener('click', restoreInitialOrder))

  toolbar.appendChild(checkBtn)
  toolbar.appendChild(resetBtn)
  toolbar.appendChild(feedback)
  root.appendChild(toolbar)

  root.setAttribute('data-paragraph-reorder-mounted', 'true')

  return () => {
    cleanups.forEach((fn) => fn())
    toolbar.remove()
    root.removeAttribute('data-paragraph-reorder-mounted')
    getItems(root).forEach((item) => {
      item.removeAttribute('draggable')
      item.classList.remove('is-dragging', 'is-over', 'is-selected', 'is-correct', 'is-wrong')
    })
  }
}

export function mountParagraphReorders(host: HTMLElement): Cleanup {
  const roots = Array.from(host.querySelectorAll('[data-paragraph-reorder]')) as HTMLElement[]
  const cleanups = roots
    .filter((el) => el.getAttribute('data-paragraph-reorder-mounted') !== 'true')
    .map((el) => mountParagraphReorder(el))
  return () => cleanups.forEach((fn) => fn())
}
