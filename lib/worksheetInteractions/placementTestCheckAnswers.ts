type PlacementQuestionType = 'radio' | 'text'

interface PlacementCheckQuestion {
  path: string
  expected: string
  type: PlacementQuestionType
}

const PLACEMENT_CHECK_SECTIONS: Record<string, PlacementCheckQuestion[]> = {
  listening: [
    { path: 'listening.conversations.q35', expected: 'C', type: 'radio' },
    { path: 'listening.conversations.q36', expected: 'A', type: 'radio' },
    { path: 'listening.conversations.q37', expected: 'B', type: 'radio' },
    { path: 'listening.conversations.q59', expected: 'D', type: 'radio' },
    { path: 'listening.conversations.q60', expected: 'C', type: 'radio' },
    { path: 'listening.conversations.q61', expected: 'B', type: 'radio' },
  ],
  'reading-incomplete': [
    { path: 'reading.incompleteSentences.q1', expected: 'looking', type: 'text' },
    { path: 'reading.incompleteSentences.q2', expected: 'previous', type: 'text' },
    { path: 'reading.incompleteSentences.q3', expected: 'recovered', type: 'text' },
    { path: 'reading.incompleteSentences.q4', expected: 'held', type: 'text' },
    { path: 'reading.incompleteSentences.q5', expected: 'increasingly', type: 'text' },
    { path: 'reading.incompleteSentences.q6', expected: 'address', type: 'text' },
  ],
  'reading-comprehension': [
    { path: 'reading.readingComprehension.q1', expected: 'C', type: 'radio' },
    { path: 'reading.readingComprehension.q2', expected: 'D', type: 'radio' },
    { path: 'reading.readingComprehension.q3', expected: 'B', type: 'radio' },
  ],
}

const CHECK_ICON_TICK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 20 20' fill='none'%3E%3Ccircle cx='10' cy='10' r='9' fill='%2316a34a'/%3E%3Cpath d='M6 10.5L8.6 13L14 7.5' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`
const CHECK_ICON_CROSS = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 20 20' fill='none'%3E%3Ccircle cx='10' cy='10' r='9' fill='%23dc2626'/%3E%3Cpath d='M6.5 6.5L13.5 13.5M13.5 6.5L6.5 13.5' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`

const normalizeTextAnswer = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[.,!?;:()[\]"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const normalizeChoiceAnswer = (value: string): string => value.trim().toUpperCase()

const answersMatch = (got: string, expected: string, type: PlacementQuestionType): boolean => {
  if (!got.trim()) return false
  if (type === 'text') {
    return normalizeTextAnswer(got) === normalizeTextAnswer(expected)
  }
  return normalizeChoiceAnswer(got) === normalizeChoiceAnswer(expected)
}

const applyTextFieldResult = (field: HTMLInputElement, correct: boolean) => {
  field.style.backgroundImage = correct ? CHECK_ICON_TICK : CHECK_ICON_CROSS
  field.style.backgroundRepeat = 'no-repeat'
  field.style.backgroundSize = '14px 14px'
  field.style.backgroundPosition = 'calc(100% - 6px) center'
  field.style.paddingRight = '24px'
  field.style.borderColor = correct ? '#16a34a' : '#dc2626'
  field.style.backgroundColor = correct ? '#f0fdf4' : '#fef2f2'
}

const applyRadioGroupResult = (container: HTMLElement, correct: boolean, answered: boolean) => {
  container.style.borderRadius = '6px'
  container.style.padding = '4px 6px'
  if (!answered) {
    container.style.border = '2px solid #d1d5db'
    container.style.backgroundColor = 'transparent'
    return
  }
  container.style.border = correct ? '2px solid #16a34a' : '2px solid #dc2626'
  container.style.backgroundColor = correct ? '#f0fdf4' : '#fef2f2'
}

const readAnswerFromDom = (container: HTMLElement, type: PlacementQuestionType): string => {
  if (type === 'text') {
    const input = container.querySelector('input[type="text"]') as HTMLInputElement | null
    return input?.value ?? ''
  }
  const checked = container.querySelector('input[type="radio"]:checked') as HTMLInputElement | null
  return checked?.value ?? ''
}

const runSectionCheck = (
  host: HTMLElement,
  sectionKey: string,
  questions: PlacementCheckQuestion[],
  getAnswer: (path: string) => string,
  summaryEl: HTMLElement,
) => {
  let correct = 0
  let answered = 0

  questions.forEach(({ path, expected, type }) => {
    const container = host.querySelector(`[data-answer-input="${path}"]`) as HTMLElement | null
    if (!container) return

    const domValue = readAnswerFromDom(container, type)
    const storedValue = getAnswer(path)
    const got = (domValue || storedValue || '').trim()
    if (!got) {
      if (type === 'radio') {
        applyRadioGroupResult(container, false, false)
      } else {
        const input = container.querySelector('input[type="text"]') as HTMLInputElement | null
        if (input) {
          input.style.borderColor = '#d1d5db'
          input.style.backgroundColor = '#fff'
          input.style.backgroundImage = 'none'
        }
      }
      return
    }

    answered += 1
    const isCorrect = answersMatch(got, expected, type)
    if (isCorrect) correct += 1

    if (type === 'text') {
      const input = container.querySelector('input[type="text"]') as HTMLInputElement | null
      if (input) applyTextFieldResult(input, isCorrect)
    } else {
      applyRadioGroupResult(container, isCorrect, true)
    }
  })

  if (answered === 0) {
    summaryEl.textContent = 'Answer the questions first, then check.'
    summaryEl.style.color = '#6b7280'
    return
  }

  summaryEl.textContent = `Checked: ${correct} correct, ${answered - correct} to retry out of ${questions.length}.`
  summaryEl.style.color = '#1f2937'
}

export function mountPlacementTestCheckAnswers(
  host: HTMLElement,
  getAnswer: (path: string) => string,
): () => void {
  const cleanupFns: Array<() => void> = []

  Object.entries(PLACEMENT_CHECK_SECTIONS).forEach(([sectionKey, questions]) => {
    const mount = host.querySelector(`[data-placement-check="${sectionKey}"]`) as HTMLElement | null
    if (!mount || mount.querySelector('.placement-check-controls')) return

    const controls = document.createElement('div')
    controls.className = 'placement-check-controls screen-only'
    controls.style.display = 'flex'
    controls.style.flexWrap = 'wrap'
    controls.style.alignItems = 'center'
    controls.style.gap = '10px'
    controls.style.marginTop = '12px'

    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = 'Check Answers'
    Object.assign(button.style, {
      backgroundColor: '#38438f',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      padding: '8px 16px',
      fontSize: '14px',
      cursor: 'pointer',
    })

    const summary = document.createElement('div')
    summary.className = 'placement-check-summary'
    summary.style.fontSize = '13px'
    summary.style.fontWeight = '600'

    const clickHandler = () => runSectionCheck(host, sectionKey, questions, getAnswer, summary)
    button.addEventListener('click', clickHandler)
    cleanupFns.push(() => button.removeEventListener('click', clickHandler))

    controls.appendChild(button)
    controls.appendChild(summary)
    mount.appendChild(controls)
  })

  return () => {
    cleanupFns.forEach((fn) => fn())
    host.querySelectorAll('.placement-check-controls').forEach((el) => el.remove())
  }
}
