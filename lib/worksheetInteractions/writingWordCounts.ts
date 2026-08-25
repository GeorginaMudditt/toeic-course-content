/**
 * Live word-count labels for writing practice textareas.
 * Mount on elements with data-writing-word-count-for="<grammar-input-id>".
 */

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function findTextarea(root: HTMLElement, inputId: string): HTMLTextAreaElement | null {
  const container = root.querySelector(
    `[data-grammar-input="${CSS.escape(inputId)}"]`
  ) as HTMLElement | null
  if (!container) return null
  if (container instanceof HTMLTextAreaElement) return container
  return container.querySelector('textarea')
}

export function mountWritingWordCounts(root: HTMLElement): () => void {
  const hosts = Array.from(
    root.querySelectorAll('[data-writing-word-count-for]:not([data-writing-word-count-mounted])')
  ) as HTMLElement[]

  if (hosts.length === 0) {
    return () => undefined
  }

  const cleanups: (() => void)[] = []

  hosts.forEach((host) => {
    const inputId = host.getAttribute('data-writing-word-count-for') || ''
    if (!inputId) return

    host.setAttribute('data-writing-word-count-mounted', 'true')
    host.style.marginTop = host.style.marginTop || '8px'
    host.style.fontSize = host.style.fontSize || '13px'
    host.style.fontWeight = host.style.fontWeight || '600'
    host.style.color = host.style.color || '#64748b'
    host.style.fontVariantNumeric = 'tabular-nums'

    const update = () => {
      const textarea = findTextarea(root, inputId)
      const words = countWords(textarea?.value || '')
      host.textContent = words === 1 ? '1 word' : `${words} words`
    }

    update()

    const captureHandler = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (!(target instanceof HTMLTextAreaElement)) return
      const container = target.closest('[data-grammar-input]') as HTMLElement | null
      if (container?.getAttribute('data-grammar-input') === inputId) {
        update()
      }
    }

    root.addEventListener('input', captureHandler)
    root.addEventListener('change', captureHandler)

    // Poll briefly in case the textarea mounts slightly later
    const pollId = window.setInterval(() => {
      const textarea = findTextarea(root, inputId)
      if (textarea) {
        update()
        window.clearInterval(pollId)
      }
    }, 200)
    const pollTimeout = window.setTimeout(() => window.clearInterval(pollId), 4000)

    cleanups.push(() => {
      root.removeEventListener('input', captureHandler)
      root.removeEventListener('change', captureHandler)
      window.clearInterval(pollId)
      window.clearTimeout(pollTimeout)
      host.removeAttribute('data-writing-word-count-mounted')
      host.textContent = ''
    })
  })

  return () => {
    cleanups.forEach((fn) => fn())
  }
}
