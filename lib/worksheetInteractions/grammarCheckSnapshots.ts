export const GRAMMAR_CHECK_SNAPSHOT_NOTES_KEY = 'grammarCheckSnapshots'

export type GrammarCheckSnapshotMistake = {
  inputId: string
  questionNumber: number | null
  studentAnswer: string
  acceptableAnswers: string[]
}

export type GrammarCheckSnapshot = {
  checkedAt: string
  sectionLabel: string
  mistakes: GrammarCheckSnapshotMistake[]
  summary: { correct: number; incorrect: number; review: number }
}

export type GrammarCheckItemResult = {
  inputId: string
  status: 'correct' | 'incorrect' | 'review'
  studentAnswer: string
  acceptableAnswers: string[]
  questionNumber: number | null
}

export type GrammarCheckRunResult = {
  correct: number
  incorrect: number
  review: number
  items: GrammarCheckItemResult[]
}

export function parseAcceptableAnswersForDisplay(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split('|')
    .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
}

/** Answer-key wording for first-attempt snapshots (falls back to acceptable/correct). */
export function parseAnswerKeyForDisplay(inputContainer: HTMLElement): string[] {
  const answerKey = parseAcceptableAnswersForDisplay(
    inputContainer.getAttribute('data-grammar-answer-key')
  )
  if (answerKey.length) return answerKey
  return parseAcceptableAnswersForDisplay(
    inputContainer.getAttribute('data-grammar-acceptable') ||
      inputContainer.getAttribute('data-correct')
  )
}

export function getQuestionNumberForInput(inputContainer: HTMLElement): number | null {
  const listItem = inputContainer.closest('li')
  if (!listItem) return null
  const list = listItem.closest('ol, ul')
  if (!list) return null
  const items = Array.from(list.querySelectorAll(':scope > li'))
  const index = items.indexOf(listItem)
  return index >= 0 ? index + 1 : null
}

export function parseGrammarCheckSnapshotsFromNotes(
  notes: string | null | undefined
): Record<string, GrammarCheckSnapshot> {
  if (!notes) return {}
  try {
    const parsed = JSON.parse(notes) as Record<string, unknown>
    const raw = parsed[GRAMMAR_CHECK_SNAPSHOT_NOTES_KEY]
    if (!raw || typeof raw !== 'object') return {}
    return raw as Record<string, GrammarCheckSnapshot>
  } catch {
    return {}
  }
}

export function hasGrammarCheckSnapshot(notes: string | null | undefined, sectionKey: string): boolean {
  const snapshots = parseGrammarCheckSnapshotsFromNotes(notes)
  return Boolean(snapshots[sectionKey])
}

export function buildSnapshotFromCheckResult(
  section: HTMLElement,
  sectionLabel: string,
  result: GrammarCheckRunResult
): GrammarCheckSnapshot {
  const mistakes = result.items
    .filter((item) => item.status === 'incorrect')
    .map((item) => ({
      inputId: item.inputId,
      questionNumber: item.questionNumber,
      studentAnswer: item.studentAnswer,
      acceptableAnswers: item.acceptableAnswers,
    }))

  return {
    checkedAt: new Date().toISOString(),
    sectionLabel,
    mistakes,
    summary: {
      correct: result.correct,
      incorrect: result.incorrect,
      review: result.review,
    },
  }
}

/** First check only — returns null if a snapshot already exists for this section. */
export function mergeFirstCheckSnapshotIntoNotes(
  notes: string | null | undefined,
  sectionKey: string,
  snapshot: GrammarCheckSnapshot
): string | null {
  let currentData: Record<string, unknown> = {}
  try {
    if (notes) currentData = JSON.parse(notes) as Record<string, unknown>
  } catch {
    currentData = {}
  }

  const existing = currentData[GRAMMAR_CHECK_SNAPSHOT_NOTES_KEY]
  const snapshots =
    existing && typeof existing === 'object'
      ? { ...(existing as Record<string, GrammarCheckSnapshot>) }
      : {}

  if (snapshots[sectionKey]) return null

  snapshots[sectionKey] = snapshot
  currentData[GRAMMAR_CHECK_SNAPSHOT_NOTES_KEY] = snapshots
  return JSON.stringify(currentData, null, 2)
}

function formatCheckedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function getLiveAnswerForInput(section: HTMLElement, inputId: string): string {
  const container = section.querySelector(
    `[data-grammar-input="${CSS.escape(inputId)}"]`
  ) as HTMLElement | null
  if (!container) return ''

  const textarea = container.querySelector('textarea')
  const textInput = container.querySelector('input[type="text"]')
  const select = container.querySelector('select')
  const checkedRadio = container.querySelector('input[type="radio"]:checked')

  if (textarea) return textarea.value.trim()
  if (select) return (select as HTMLSelectElement).value.trim()
  if (checkedRadio) return (checkedRadio as HTMLInputElement).value.trim()
  if (textInput) return (textInput as HTMLInputElement).value.trim()
  return ''
}

function answerMatchesAcceptable(value: string, acceptable: string[]): boolean {
  const normalized = value
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[.,!?;:()[\]"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return acceptable.some((token) => {
    const t = token
      .toLowerCase()
      .replace(/['']/g, "'")
      .replace(/[.,!?;:()[\]"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return normalized === t
  })
}

function formatCorrectAnswerPhrase(acceptable: string[]): string {
  if (!acceptable.length) {
    return 'the correct answer is <span style="color:#64748b;">—</span>'
  }
  const parts = acceptable.map(
    (a) => `<strong style="color:#15803d;font-weight:700;">${escapeHtml(a)}</strong>`
  )
  if (parts.length === 1) {
    return `the correct answer is ${parts[0]}`
  }
  const last = parts.pop()!
  return `the correct answer is ${parts.join(', ')} or ${last}`
}

export function renderGrammarCheckSnapshotPanel(
  section: HTMLElement,
  sectionKey: string,
  snapshot: GrammarCheckSnapshot
): void {
  const existing = section.querySelector(
    `[data-grammar-check-snapshot-panel="${sectionKey}"]`
  ) as HTMLElement | null
  if (existing) existing.remove()

  const panel = document.createElement('div')
  panel.className = 'grammar-check-snapshot-panel screen-only'
  panel.setAttribute('data-grammar-check-snapshot-panel', sectionKey)
  panel.style.marginTop = '14px'
  panel.style.padding = '14px 16px'
  panel.style.borderRadius = '8px'
  panel.style.border = '1px solid #e2e8f0'
  panel.style.background = '#f8fafc'

  const { mistakes, summary } = snapshot
  const checkedLabel = formatCheckedDate(snapshot.checkedAt)

  let bodyHtml = ''

  if (mistakes.length === 0) {
    bodyHtml = `<p style="margin:0;font-size:14px;color:#334155;line-height:1.55;">You answered all ${summary.correct} question${summary.correct === 1 ? '' : 's'} correctly on your first check.</p>`
  } else {
    const itemsHtml = mistakes
      .map((mistake) => {
        const qLabel = mistake.questionNumber ? `Q${mistake.questionNumber}` : mistake.inputId
        const inputContainer = section.querySelector(
          `[data-grammar-input="${CSS.escape(mistake.inputId)}"]`
        ) as HTMLElement | null
        const displayAcceptable = inputContainer
          ? parseAnswerKeyForDisplay(inputContainer)
          : mistake.acceptableAnswers
        const correctPhrase = formatCorrectAnswerPhrase(
          displayAcceptable.length ? displayAcceptable : mistake.acceptableAnswers
        )
        const liveAnswer = getLiveAnswerForInput(section, mistake.inputId)
        const checkAcceptable = inputContainer
          ? parseAcceptableAnswersForDisplay(
              inputContainer.getAttribute('data-grammar-acceptable') ||
                inputContainer.getAttribute('data-correct')
            )
          : mistake.acceptableAnswers
        const nowCorrect =
          liveAnswer &&
          answerMatchesAcceptable(
            liveAnswer,
            checkAcceptable.length ? checkAcceptable : mistake.acceptableAnswers
          )
        const resolvedBadge = nowCorrect
          ? ' <span style="display:inline-block;margin-left:6px;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;background:#dcfce7;color:#15803d;">Now corrected</span>'
          : ''

        const revealId = `reveal-${sectionKey}-${mistake.inputId}`
        return `<li style="margin-bottom:10px;font-size:14px;line-height:1.55;color:#334155;">
          ${escapeHtml(qLabel)}: you wrote <strong style="color:#b91c1c;font-weight:700;">${escapeHtml(mistake.studentAnswer || '(blank)')}</strong>
          <button type="button" data-grammar-reveal-answer="${escapeHtml(revealId)}" style="margin-left:8px;padding:2px 10px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;color:#38438f;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;line-height:1.4;">Reveal correct answer</button>
          <span id="${escapeHtml(revealId)}" data-grammar-revealed-answer hidden style="margin-left:4px;"> → ${correctPhrase}</span>${resolvedBadge}
        </li>`
      })
      .join('')

    bodyHtml = `<ul style="margin:0;padding-left:20px;list-style-type:disc;">${itemsHtml}</ul>`
  }

  if (summary.review > 0) {
    bodyHtml += `<p style="margin:${mistakes.length ? '12px' : '0'} 0 0 0;font-size:13px;color:#64748b;">${summary.review} answer${summary.review === 1 ? '' : 's'} were left blank on your first check.</p>`
  }

  panel.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px;">
      <div>
        <p style="margin:0;font-size:15px;font-weight:700;color:#38438f;">Your first attempt</p>
        <p style="margin:4px 0 0 0;font-size:12px;color:#64748b;">Saved from your first Check Answers · ${escapeHtml(checkedLabel)}</p>
      </div>
      <p style="margin:0;font-size:13px;font-weight:600;color:#475569;">${summary.correct} correct · ${summary.incorrect} to retry</p>
    </div>
    ${bodyHtml}
    <p style="margin:12px 0 0 0;font-size:12px;color:#94a3b8;line-height:1.45;">This record stays here even after you correct your answers, so you can review what you got wrong.</p>
  `

  panel.querySelectorAll<HTMLButtonElement>('[data-grammar-reveal-answer]').forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-grammar-reveal-answer')
      if (!targetId) return
      const answerEl = panel.querySelector(`#${CSS.escape(targetId)}`) as HTMLElement | null
      if (!answerEl) return
      answerEl.hidden = false
      button.remove()
    })
  })

  const controls = section.querySelector('.grammar-check-controls')
  if (controls?.parentNode) {
    controls.parentNode.insertBefore(panel, controls.nextSibling)
  } else {
    section.appendChild(panel)
  }
}

export function mountGrammarCheckSnapshotPanels(root: HTMLElement, notes: string | null | undefined): () => void {
  const snapshots = parseGrammarCheckSnapshotsFromNotes(notes)
  const sections = Array.from(
    root.querySelectorAll<HTMLElement>('[data-grammar-check-snapshot]')
  )

  sections.forEach((section) => {
    const sectionKey = section.getAttribute('data-grammar-check-snapshot')
    if (!sectionKey) return
    const snapshot = snapshots[sectionKey]
    if (!snapshot) return
    renderGrammarCheckSnapshotPanel(section, sectionKey, snapshot)
  })

  return () => {
    root.querySelectorAll('.grammar-check-snapshot-panel').forEach((el) => el.remove())
  }
}
