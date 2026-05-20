export type WritingTaskType = 'email1' | 'email2' | 'essay'

export interface StructuralCheckItem {
  ok: boolean
  message: string
}

export interface StructuralFeedback {
  items: StructuralCheckItem[]
}

const TASK_INPUT_IDS: Record<WritingTaskType, string> = {
  email1: 'writing-response-email1',
  email2: 'writing-response-email2',
  essay: 'writing-essay',
}

export function getInputIdForTask(task: WritingTaskType): string {
  return TASK_INPUT_IDS[task]
}

export function getFeedbackNotesKey(task: WritingTaskType): string {
  return `${TASK_INPUT_IDS[task]}-ai-feedback`
}

export function isWritingTaskType(value: string): value is WritingTaskType {
  return value === 'email1' || value === 'email2' || value === 'essay'
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function hasGreeting(text: string): boolean {
  return /^(dear|hi|hello|to\s)/im.test(text.trim()) || /^[A-Z][a-z]+,?\s*$/m.test(text.trim())
}

function hasClosing(text: string): boolean {
  return /\b(regards|sincerely|faithfully|thanks|thank you|best|hope this helps)\b/i.test(text)
}

function countRequests(text: string): number {
  const questionMarks = (text.match(/\?/g) || []).length
  const requestPhrases = (
    text.match(
      /\b(could you|can you|would you|please tell|please let|please send|please recommend|please provide|i would like to know|is there)\b/gi
    ) || []
  ).length
  return Math.max(questionMarks, requestPhrases)
}

function countReasonSignals(text: string): number {
  const markers = text.match(
    /\b(first(ly)?|second(ly)?|third(ly)?|furthermore|moreover|also|another reason|in addition|for (example|instance)|because|as a result)\b/gi
  )
  return markers ? markers.length : 0
}

export function runStructuralChecks(task: WritingTaskType, text: string): StructuralFeedback {
  const trimmed = text.trim()
  const words = wordCount(trimmed)
  const items: StructuralCheckItem[] = []

  if (!trimmed) {
    return {
      items: [{ ok: false, message: 'Write your answer before requesting feedback.' }],
    }
  }

  if (task === 'email1') {
    items.push({
      ok: words >= 40,
      message:
        words >= 40
          ? `Length: about ${words} words — reasonable for an e-mail response.`
          : `Length: about ${words} words — try to write a fuller response (aim for at least 40 words).`,
    })
    items.push({
      ok: hasGreeting(trimmed),
      message: hasGreeting(trimmed)
        ? 'Opening: you include a greeting or direct address.'
        : 'Opening: add a greeting (e.g. "Dear Francine," or "Hi Francine,").',
    })
    items.push({
      ok: hasClosing(trimmed),
      message: hasClosing(trimmed)
        ? 'Closing: you include a sign-off.'
        : 'Closing: add a short closing (e.g. "Best regards," or "Hope this helps.").',
    })
    const reasons = countReasonSignals(trimmed)
    items.push({
      ok: reasons >= 2,
      message:
        reasons >= 2
          ? 'Task: your reply appears to develop several points (good for "three reasons").'
          : 'Task: make sure you give three clear reasons — use linking words (First, Furthermore, Finally).',
    })
    items.push({
      ok: /\bconference\b/i.test(trimmed),
      message: /\bconference\b/i.test(trimmed)
        ? 'Topic: you refer to the conference.'
        : 'Topic: mention the conference and your experience last year.',
    })
  }

  if (task === 'email2') {
    items.push({
      ok: words >= 50,
      message:
        words >= 50
          ? `Length: about ${words} words — reasonable for a formal e-mail.`
          : `Length: about ${words} words — try to expand your response (aim for at least 50 words).`,
    })
    items.push({
      ok: hasGreeting(trimmed),
      message: hasGreeting(trimmed)
        ? 'Opening: you use an appropriate formal opening.'
        : 'Opening: use a formal opening (e.g. "Dear Sir or Madam,").',
    })
    items.push({
      ok: hasClosing(trimmed),
      message: hasClosing(trimmed)
        ? 'Closing: you include a polite closing.'
        : 'Closing: end with a formal closing (e.g. "Yours faithfully,").',
    })
    const requests = countRequests(trimmed)
    items.push({
      ok: requests >= 2,
      message:
        requests >= 2
          ? `Task: you appear to make at least two requests (${requests} detected).`
          : 'Task: include at least two clear requests for information (use questions or "Could you please…").',
    })
    items.push({
      ok: /\b(move|moved|dale city|new (home|city))\b/i.test(trimmed),
      message: /\b(move|moved|dale city|new (home|city))\b/i.test(trimmed)
        ? 'Context: you mention having recently moved.'
        : 'Context: mention that you have recently moved to the area.',
    })
  }

  if (task === 'essay') {
    items.push({
      ok: words >= 300,
      message:
        words >= 300
          ? `Length: about ${words} words — meets the 300-word minimum.`
          : `Length: about ${words} words — aim for at least 300 words (about ${Math.max(0, 300 - words)} more needed).`,
    })
    const hasOpinion =
      /\b(in my opinion|i think|i believe|advantages|disadvantages|on the one hand|on the other hand)\b/i.test(
        trimmed
      )
    items.push({
      ok: hasOpinion,
      message: hasOpinion
        ? 'Task: you state an opinion and discuss advantages/disadvantages.'
        : 'Task: clearly state your opinion and discuss both advantages and disadvantages.',
    })
    const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
    items.push({
      ok: paragraphs.length >= 3,
      message:
        paragraphs.length >= 3
          ? `Organisation: about ${paragraphs.length} paragraph(s) — good essay structure.`
          : 'Organisation: divide your essay into clear paragraphs (introduction, body, conclusion).',
    })
    items.push({
      ok: /\b(to sum up|in conclusion|to conclude|overall|in summary)\b/i.test(trimmed),
      message: /\b(to sum up|in conclusion|to conclude|overall|in summary)\b/i.test(trimmed)
        ? 'Conclusion: you include a concluding phrase.'
        : 'Conclusion: add a concluding paragraph (e.g. "To sum up," or "In conclusion,").',
    })
  }

  return { items }
}

const TASK_PROMPTS: Record<WritingTaskType, string> = {
  email1: `Task: TOEIC Writing — Respond to an e-mail (E-mail 1).
The student must respond as Tim, who attended the Business Leadership conference last year, and give THREE reasons why the conference was not good / why Francine should not go.
Score on: task completion (three reasons), organisation, register (semi-formal e-mail to a colleague), sentence variety, vocabulary, grammar.
Do NOT rewrite their entire e-mail. Give brief encouraging feedback.`,
  email2: `Task: TOEIC Writing — Respond to an e-mail (E-mail 2).
The student must respond as a new resident of Dale City to the Welcome Committee and make at least TWO requests for information (e.g. local services, clubs, banks).
Score on: task completion (two+ requests), organisation, formal register, sentence variety, vocabulary, grammar.
Do NOT rewrite their entire e-mail. Give brief encouraging feedback.`,
  essay: `Task: TOEIC Writing — Opinion essay (minimum 300 words).
Prompt: Some people work for the same company for their entire career. What are the advantages and disadvantages of staying at one company? Give reasons and examples.
Score on: task completion, clear opinion, balanced discussion, organisation (intro/body/conclusion), sentence variety, vocabulary, grammar.
Do NOT rewrite the whole essay. Give brief encouraging feedback.`,
}

export function buildGeminiPrompt(
  task: WritingTaskType,
  studentText: string,
  structural: StructuralFeedback
): string {
  const structuralSummary = structural.items
    .map((i) => `${i.ok ? '✓' : '○'} ${i.message}`)
    .join('\n')

  return `You are a supportive TOEIC Writing tutor. This is practice feedback generated by AI — not an official TOEIC score.

${TASK_PROMPTS[task]}

Automated checks already ran:
${structuralSummary}

Student's writing:
---
${studentText.trim()}
---

Respond in English with this exact structure (use markdown headings):

## Overall
(1–2 sentences)

## Task completion
(1–2 sentences)

## Strengths
- (bullet 1)
- (bullet 2)

## Areas to improve
- (bullet 1)
- (bullet 2)
- (optional bullet 3)

## Language notes
- Quote a short phrase from their text and suggest a correction or improvement (up to 4 bullets). Do not list more than 4.`
}

export async function generateAiFeedback(
  task: WritingTaskType,
  studentText: string,
  structural: StructuralFeedback
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  // gemini-2.0-flash often has zero free-tier quota; 2.5-flash works on new API keys.
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const prompt = buildGeminiPrompt(task, studentText, structural)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      }),
    }
  )

  if (!response.ok) {
    const errText = await response.text()
    console.error('Gemini API error:', response.status, errText)
    let apiMessage = ''
    try {
      const parsed = JSON.parse(errText) as { error?: { message?: string } }
      apiMessage = parsed?.error?.message || ''
    } catch {
      apiMessage = errText.slice(0, 200)
    }
    if (response.status === 429) {
      throw new Error(
        'AI feedback quota reached. Please wait a few minutes and try again, or ask your teacher to check the Gemini API plan.'
      )
    }
    if (response.status === 404) {
      throw new Error(
        `AI model "${model}" is not available. Set GEMINI_MODEL to gemini-2.5-flash in Netlify environment variables.`
      )
    }
    throw new Error(
      apiMessage
        ? `AI feedback failed: ${apiMessage.slice(0, 180)}`
        : 'AI feedback service is temporarily unavailable. Please try again later.'
    )
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text || typeof text !== 'string') {
    throw new Error('AI returned an empty response. Please try again.')
  }
  return text.trim()
}

/** Simple markdown-ish to HTML for display in feedback panel */
export function formatFeedbackForDisplay(markdown: string): string {
  const escaped = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped
    .replace(/^## (.+)$/gm, '<h4 style="margin:14px 0 6px 0;font-size:15px;font-weight:700;color:#1e3a8a;">$1</h4>')
    .replace(/^- (.+)$/gm, '<li style="margin-bottom:4px;">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul style="margin:0 0 8px 0;padding-left:22px;">${m}</ul>`)
    .replace(/\n\n/g, '<br /><br />')
    .replace(/\n/g, '<br />')
}
