/**
 * Drag-and-drop ranking for opinion activities (no right/wrong answers).
 * Mounted from WorksheetViewer when HTML contains [data-opinion-ranking].
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
  return Array.from(root.querySelectorAll('[data-rank-item]')) as HTMLElement[]
}

function renumber(root: HTMLElement) {
  getItems(root).forEach((item, index) => {
    const badge = item.querySelector('[data-rank-number]') as HTMLElement | null
    if (badge) badge.textContent = String(index + 1)
    item.setAttribute('data-rank-position', String(index + 1))
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

/**
 * Returns a cleanup function. Marks the root with data-opinion-ranking-mounted="true".
 */
export function mountOpinionRanking(root: HTMLElement): Cleanup {
  if (root.getAttribute('data-opinion-ranking-mounted') === 'true') {
    return () => {}
  }

  const list = root.querySelector('[data-rank-list]') as HTMLElement | null
  if (!list) return () => {}

  const cleanups: Cleanup[] = []
  let dragging: HTMLElement | null = null

  const items = getItems(root)
  items.forEach((item) => {
    item.setAttribute('draggable', 'true')
    item.classList.add('opinion-rank-item')

    cleanups.push(
      on(item, 'dragstart', (e) => {
        dragging = item
        item.classList.add('is-dragging')
        const dt = (e as DragEvent).dataTransfer
        if (dt) {
          dt.effectAllowed = 'move'
          dt.setData('text/plain', item.getAttribute('data-rank-id') || '')
        }
      })
    )

    cleanups.push(
      on(item, 'dragend', () => {
        item.classList.remove('is-dragging')
        getItems(root).forEach((el) => el.classList.remove('is-over'))
        dragging = null
        renumber(root)
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
        moveBefore(list, dragging, placeAfter ? item.nextElementSibling as HTMLElement | null : item)
        renumber(root)
      })
    )

    cleanups.push(
      on(item, 'dragleave', () => item.classList.remove('is-over'))
    )

    cleanups.push(
      on(item, 'drop', (e) => {
        e.preventDefault()
        item.classList.remove('is-over')
        renumber(root)
      })
    )
  })

  // Keyboard fallback: ↑ / ↓ when focused
  items.forEach((item) => {
    if (!item.hasAttribute('tabindex')) item.setAttribute('tabindex', '0')
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
        renumber(root)
        item.focus()
      })
    )
  })

  renumber(root)
  root.setAttribute('data-opinion-ranking-mounted', 'true')

  return () => {
    cleanups.forEach((fn) => fn())
    root.removeAttribute('data-opinion-ranking-mounted')
    getItems(root).forEach((item) => {
      item.removeAttribute('draggable')
      item.classList.remove('opinion-rank-item', 'is-dragging', 'is-over')
    })
  }
}

/** Mount all unmounted opinion-ranking roots under host. */
export function mountOpinionRankings(host: HTMLElement): Cleanup {
  const roots = Array.from(host.querySelectorAll('[data-opinion-ranking]')) as HTMLElement[]
  const cleanups = roots
    .filter((el) => el.getAttribute('data-opinion-ranking-mounted') !== 'true')
    .map((el) => mountOpinionRanking(el))
  return () => cleanups.forEach((fn) => fn())
}
