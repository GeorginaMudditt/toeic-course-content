/**
 * Reveal panels for "Everyday English: A Typical Day".
 * Mounted from WorksheetViewer (inline scripts in resource HTML do not run).
 *
 * [data-dd-reveal="questions|answers"] shows matching [data-dd-panel].
 * Reveal questions waits until every [data-dd-question] box has text.
 * Teacher preview sets data-teacher-key on #worksheet-content; CSS then shows .dd-teacher-only.
 */

export function mountDailyRoutineReveal(root: HTMLElement): () => void {
  const wrap = root.querySelector('.dd-wrap') as HTMLElement | null
  if (!wrap || wrap.getAttribute('data-dd-mounted') === 'true') {
    return () => undefined
  }

  const teacher = root.getAttribute('data-teacher-key') === 'true'
  const cleanups: Array<() => void> = []

  wrap.querySelectorAll<HTMLButtonElement>('[data-dd-reveal]').forEach((button) => {
    const panelName = button.getAttribute('data-dd-reveal') || ''
    const onClick = () => {
      if (panelName === 'questions') {
        const boxes = Array.from(wrap.querySelectorAll<HTMLElement>('[data-dd-question]'))
        const missing = boxes.some((box) => {
          const textarea = box.querySelector('textarea')
          return !(textarea?.value || '').trim()
        })
        const status = wrap.querySelector('[data-dd-reveal-status="questions"]')
        if (missing) {
          if (status) {
            status.textContent = 'Write a question for every gap, then try again.'
          }
          return
        }
        if (status) status.textContent = ''
      }

      wrap.querySelectorAll<HTMLElement>(`[data-dd-panel="${CSS.escape(panelName)}"]`).forEach((panel) => {
        panel.hidden = false
      })
      button.setAttribute('aria-expanded', 'true')
      button.disabled = true
      button.textContent = panelName === 'questions' ? 'Questions revealed' : 'Answers revealed'
    }
    button.addEventListener('click', onClick)
    cleanups.push(() => button.removeEventListener('click', onClick))
  })

  wrap.setAttribute('data-dd-mounted', 'true')

  return () => {
    cleanups.forEach((fn) => fn())
    wrap.removeAttribute('data-dd-mounted')
    if (!teacher) {
      wrap.querySelectorAll<HTMLElement>('[data-dd-panel]').forEach((panel) => {
        panel.hidden = true
      })
    }
  }
}
