/**
 * Submit a worksheet writing task for teacher marking.
 * Mounted from WorksheetViewer on [data-writing-task-submit].
 *
 * data-writing-submit-title   — WritingSubmission title
 * data-writing-submit-input   — grammar input id (or several, comma-separated)
 * data-writing-submit-forbid  — whole words to avoid, pipe-separated (optional)
 * data-writing-submit-markers — discourse markers to count, pipe-separated (optional)
 * data-writing-submit-min-markers — minimum markers required (default 0)
 */

function readInputText(root: HTMLElement, inputId: string): string {
  const container = root.querySelector(
    `[data-grammar-input="${CSS.escape(inputId)}"]`
  ) as HTMLElement | null
  if (!container) return ''
  const textarea = (
    container instanceof HTMLTextAreaElement
      ? container
      : container.querySelector('textarea')
  ) as HTMLTextAreaElement | null
  return (textarea?.value || '').trim()
}

function parseList(value: string | null): string[] {
  return (value || '')
    .split(/[|,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function findForbiddenWords(text: string, words: string[]): string[] {
  const found = new Set<string>()
  words.forEach((word) => {
    const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (pattern.test(text)) found.add(word.toLowerCase())
  })
  return Array.from(found)
}

function findMarkers(text: string, markers: string[]): string[] {
  const lower = text.toLowerCase()
  return markers.filter((marker) => lower.includes(marker.toLowerCase()))
}

export type WritingTaskSubmitOptions = {
  preventSave?: boolean
}

export function mountWritingTaskSubmit(
  host: HTMLElement,
  options: WritingTaskSubmitOptions = {}
): () => void {
  if (host.getAttribute('data-writing-task-submit-mounted') === 'true') {
    return () => undefined
  }

  const worksheetRoot =
    (host.closest('#worksheet-content') as HTMLElement | null) ||
    (host.parentElement as HTMLElement | null) ||
    host

  const title =
    host.getAttribute('data-writing-submit-title')?.trim() || 'Writing task'
  const inputIds = parseList(host.getAttribute('data-writing-submit-input'))
  const forbid = parseList(host.getAttribute('data-writing-submit-forbid'))
  const markers = parseList(host.getAttribute('data-writing-submit-markers'))
  const minMarkers = Number.parseInt(host.getAttribute('data-writing-submit-min-markers') || '0', 10) || 0

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'grammar-action-button'
  button.textContent = 'Submit for marking'
  button.style.cssText =
    'display: inline-flex; align-items: center; width: auto; flex: 0 0 auto; white-space: nowrap; background-color: #38438f; color: #fff; border: none; border-radius: 6px; padding: 8px 16px; font-size: 14px; cursor: pointer;'
  button.style.setProperty('background-color', '#38438f', 'important')
  button.style.setProperty('background-image', 'none', 'important')
  button.style.setProperty('color', '#ffffff', 'important')
  button.style.setProperty('display', 'inline-flex', 'important')
  button.style.setProperty('width', 'auto', 'important')

  const status = document.createElement('span')
  status.setAttribute('role', 'status')
  status.style.cssText = 'font-size: 13px; font-weight: 600; color: #64748b; min-height: 20px;'

  function placeNextToSave(): boolean {
    const buttonGroup = host.querySelector('.grammar-action-button-group') as HTMLElement | null
    const saveControls = host.querySelector('.grammar-save-controls') as HTMLElement | null
    if (!buttonGroup && !saveControls) return false
    const row = buttonGroup || saveControls
    if (!row) return false
    row.style.display = 'flex'
    row.style.flexDirection = 'row'
    row.style.flexWrap = 'nowrap'
    row.style.alignItems = 'center'
    row.appendChild(button)
    if (saveControls) saveControls.appendChild(status)
    else row.appendChild(status)
    return true
  }

  if (!placeNextToSave()) {
    const row = document.createElement('div')
    row.className = 'screen-only mie-writing-submit-row'
    row.style.cssText =
      'display: flex; flex-direction: row; flex-wrap: nowrap; align-items: center; gap: 8px; margin-top: 10px;'
    row.appendChild(button)
    row.appendChild(status)
    host.appendChild(row)
    requestAnimationFrame(() => {
      if (placeNextToSave()) row.remove()
    })
  }
  host.setAttribute('data-writing-task-submit-mounted', 'true')

  const onClick = async () => {
    if (options.preventSave) {
      status.textContent = 'Submission is disabled in teacher preview.'
      status.style.color = '#64748b'
      return
    }

    const parts = inputIds.map((id) => readInputText(worksheetRoot, id))
    const text = parts.filter(Boolean).join('\n\n').trim()
    if (!text) {
      status.textContent = 'Please write your reference before submitting.'
      status.style.color = '#dc2626'
      return
    }

    const warnings: string[] = []
    const forbiddenFound = findForbiddenWords(text, forbid)
    if (forbiddenFound.length > 0) {
      warnings.push(`Avoid using: ${forbiddenFound.join(', ')}.`)
    }
    if (markers.length > 0 && minMarkers > 0) {
      const found = findMarkers(text, markers)
      if (found.length < minMarkers) {
        warnings.push(
          `Include at least ${minMarkers} discourse markers (found ${found.length}${
            found.length ? `: ${found.join(', ')}` : ''
          }).`
        )
      }
    }

    if (warnings.length > 0) {
      const ok = window.confirm(`${warnings.join('\n\n')}\n\nSubmit anyway?`)
      if (!ok) {
        status.textContent = 'Submission cancelled — you can edit your reference and try again.'
        status.style.color = '#64748b'
        return
      }
    }

    button.disabled = true
    button.textContent = 'Submitting…'
    status.textContent = ''
    status.style.color = '#64748b'

    try {
      const res = await fetch('/api/writing-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          originalText: text,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(
          typeof data.error === 'string' ? data.error : 'Failed to submit for marking'
        )
      }

      status.textContent = '✓ Submitted for marking. Your teacher has been notified.'
      status.style.color = '#059669'
      button.textContent = 'Submitted'
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      status.textContent = msg
      status.style.color = '#dc2626'
      button.disabled = false
      button.textContent = 'Submit for marking'
    }
  }

  button.addEventListener('click', onClick)

  return () => {
    button.removeEventListener('click', onClick)
    button.remove()
    status.remove()
    host.removeAttribute('data-writing-task-submit-mounted')
  }
}

export function mountWritingTaskSubmits(
  host: HTMLElement,
  options: WritingTaskSubmitOptions = {}
): () => void {
  const roots = Array.from(host.querySelectorAll('[data-writing-task-submit]')) as HTMLElement[]
  const cleanups = roots
    .filter((el) => el.getAttribute('data-writing-task-submit-mounted') !== 'true')
    .map((el) => mountWritingTaskSubmit(el, options))
  return () => cleanups.forEach((fn) => fn())
}
