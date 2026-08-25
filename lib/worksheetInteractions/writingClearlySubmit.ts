/**
 * Gather Writing Challenges #1–#3 and submit as one WritingSubmission for teacher marking.
 * Mounted from WorksheetViewer on [data-writing-clearly-submit].
 */

const CHALLENGE_INPUT_IDS = [
  { id: 'writing-clearly-challenge1', label: 'Writing Challenge #1' },
  { id: 'writing-clearly-challenge2', label: 'Writing Challenge #2' },
  { id: 'writing-clearly-challenge3', label: 'Writing Challenge #3' },
] as const

export const WRITING_CLEARLY_SUBMISSION_TITLE = 'Writing Clearly'

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

function buildCombinedText(root: HTMLElement): {
  text: string
  missing: string[]
  filledCount: number
} {
  const parts: string[] = []
  const missing: string[] = []
  let filledCount = 0

  for (const challenge of CHALLENGE_INPUT_IDS) {
    const body = readInputText(root, challenge.id)
    if (!body) {
      missing.push(challenge.label)
    } else {
      filledCount++
    }
    parts.push(`${challenge.label}\n\n${body || '(No response)'}`)
  }

  return {
    text: parts.join('\n\n————————————\n\n'),
    missing,
    filledCount,
  }
}

export type WritingClearlySubmitOptions = {
  /** When true (teacher preview), disable real submission. */
  preventSave?: boolean
}

export function mountWritingClearlySubmit(
  host: HTMLElement,
  options: WritingClearlySubmitOptions = {}
): () => void {
  if (host.getAttribute('data-writing-clearly-submit-mounted') === 'true') {
    return () => undefined
  }

  const worksheetRoot =
    (host.closest('#worksheet-content') as HTMLElement | null) ||
    (host.parentElement as HTMLElement | null) ||
    host

  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = 'Submit Challenges #1–#3 for marking'
  button.style.cssText =
    'font: 600 14px Arial, sans-serif; padding: 12px 18px; border: none; border-radius: 8px; color: #ffffff; background: linear-gradient(135deg, #1e3a8a 0%, #4338ca 100%); cursor: pointer; box-shadow: 0 2px 6px rgba(30, 58, 138, 0.35);'

  const status = document.createElement('p')
  status.setAttribute('role', 'status')
  status.style.cssText =
    'margin: 12px 0 0 0; font-size: 13px; font-weight: 600; color: #64748b; min-height: 20px;'

  const note = document.createElement('p')
  note.style.cssText = 'margin: 10px 0 0 0; font-size: 12px; color: #94a3b8;'
  note.textContent =
    'Your teacher will receive an email notification. You can track the submission under Writing.'

  host.appendChild(button)
  host.appendChild(status)
  host.appendChild(note)
  host.setAttribute('data-writing-clearly-submit-mounted', 'true')

  const onClick = async () => {
    if (options.preventSave) {
      status.textContent = 'Submission is disabled in teacher preview.'
      status.style.color = '#64748b'
      return
    }

    const { text, missing, filledCount } = buildCombinedText(worksheetRoot)
    if (filledCount === 0) {
      status.textContent = 'Please complete at least one writing challenge before submitting.'
      status.style.color = '#dc2626'
      return
    }

    if (missing.length > 0) {
      const ok = window.confirm(
        `You have not filled in: ${missing.join(', ')}.\n\nSubmit anyway with the responses you have written?`
      )
      if (!ok) {
        status.textContent = 'Submission cancelled.'
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
          title: WRITING_CLEARLY_SUBMISSION_TITLE,
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
      button.textContent = 'Submit Challenges #1–#3 for marking'
    }
  }

  button.addEventListener('click', onClick)

  return () => {
    button.removeEventListener('click', onClick)
    button.remove()
    status.remove()
    note.remove()
    host.removeAttribute('data-writing-clearly-submit-mounted')
  }
}
