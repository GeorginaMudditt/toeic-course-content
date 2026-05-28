export type WritingTaskType = 'email1' | 'email2' | 'essay' | 'writing1'

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
  writing1: 'writing1-q1',
}

export function getInputIdForTask(task: WritingTaskType): string {
  return TASK_INPUT_IDS[task]
}

export function getFeedbackNotesKey(task: WritingTaskType): string {
  return `${TASK_INPUT_IDS[task]}-ai-feedback`
}

export function isWritingTaskType(value: string): value is WritingTaskType {
  return value === 'email1' || value === 'email2' || value === 'essay' || value === 'writing1'
}

function countTenseSignals(text: string): {
  presentSimple: boolean
  pastSimple: boolean
  presentPerfect: boolean
  presentContinuous: boolean
} {
  const t = text
  return {
    presentSimple:
      /\b(I|we|they)\s+(work|manage|lead|speciali[sz]e|focus|support|oversee)\b/i.test(t) ||
      /\b(he|she|it)\s+(works|manages|leads|speciali[sz]es|focuses|supports|oversees)\b/i.test(t) ||
      /\b(my|our)\s+(role|job|position|responsibilit)/i.test(t),
    pastSimple:
      /\b(worked|led|managed|studied|completed|joined|spent|achieved|gained|developed|started|began|moved|graduated)\b/i.test(
        t
      ) || /\b(in|since)\s+(19|20)\d{2}\b/i.test(t),
    presentPerfect:
      /\b(have|has)\s+(been|worked|led|managed|completed|achieved|gained|developed|spent|built|grown)\b/i.test(
        t
      ) || /\b(have|has)\s+\w+ed\b/i.test(t),
    presentContinuous:
      /\b(am|is|are)\s+\w+ing\b/i.test(t) || /\b(I'm|he's|she's|we're|they're)\s+\w+ing\b/i.test(t),
  }
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

function countPatternMatches(text: string, patterns: RegExp[]): number {
  let n = 0
  for (const re of patterns) {
    if (re.test(text)) n++
  }
  return n
}

/** Heuristic: does the answer address this worksheet's prompt (not just "good writing")? */
function assessTaskRelevance(
  task: WritingTaskType,
  text: string
): { ok: boolean; message: string } {
  const t = text.toLowerCase()

  if (task === 'essay') {
    const careerPatterns = [
      /\bcompan(y|ies)\b/,
      /\bcareer(s)?\b/,
      /\bemployer(s)?\b/,
      /\bemployee(s)?\b/,
      /\bworkplace\b/,
      /\bwork (for|at|with)\b/,
      /\bsame (company|employer|firm|organisation|organization)\b/,
      /\bentire career\b/,
      /\bstay(ing)? (at|with) (the )?(same )?(company|employer|firm)\b/,
      /\b(all|whole) (their |my )?(working )?life\b/,
      /\blifelong\b/,
      /\byears (at|with) (the )?same\b/,
      /\bone (company|employer|firm) (for|throughout)\b/,
    ]
    const offTopicPatterns = [
      /\b(nigeria|nigerian)\b/,
      /\bartists?\b/,
      /\bpaintings?\b/,
      /\bsculptures?\b/,
      /\bmuseums?\b/,
      /\bcultural identity\b/,
      /\bheritage\b/,
      /\bclimate change\b/,
      /\b(?:global )?warming\b/,
    ]
    const careerScore = countPatternMatches(t, careerPatterns)
    const offTopicScore = countPatternMatches(t, offTopicPatterns)
    const discussesAdvDis = /\b(advantages?|disadvantages?)\b/.test(t)

    if (offTopicScore >= 2 && careerScore < 2) {
      return {
        ok: false,
        message:
          'Topic: your writing appears to be about a different subject (not careers / staying at one company). On TOEIC, off-topic essays cannot score well — rewrite for the prompt above.',
      }
    }
    if (careerScore < 1) {
      return {
        ok: false,
        message:
          'Topic: your essay does not clearly discuss working for the same company or an entire career at one employer. Address the assigned prompt.',
      }
    }
    if (!discussesAdvDis) {
      return {
        ok: false,
        message:
          'Topic: the prompt asks for advantages and disadvantages of staying at one company — make sure you discuss both.',
      }
    }
    return {
      ok: true,
      message:
        'Topic: your essay appears to address the prompt (career / same company, advantages and disadvantages).',
    }
  }

  if (task === 'writing1') {
    const careerPatterns = [
      /\b(career|job|role|position|profession|experience|achievement|responsibilit|company|employer|team|project|industry|skill)\b/i,
      /\b(linkedin|profile|background)\b/i,
      /\b(I am|I'm)\s+(a|an|currently|now)\b/i,
    ]
    const careerScore = countPatternMatches(t, careerPatterns)
    const offTopicPatterns = [
      /\b(recipe|cooking|football match|weather today)\b/i,
      /\b(my (favourite|favorite) (film|movie|song))\b/i,
    ]
    const offTopicScore = countPatternMatches(t, offTopicPatterns)

    if (offTopicScore >= 2 && careerScore < 2) {
      return {
        ok: false,
        message:
          'Topic: your text does not look like a professional profile — write about your career, role, and achievements (LinkedIn-style).',
      }
    }
    if (careerScore < 1) {
      return {
        ok: false,
        message:
          'Topic: mention your professional background, current role, or career achievements.',
      }
    }
    return {
      ok: true,
      message: 'Topic: your profile appears to focus on professional experience and achievements.',
    }
  }

  if (task === 'email1') {
    const hasConference = /\bconference\b/.test(t)
    const hasPromptContext =
      /\b(business leadership|francine|last year|attended|didn't|did not|not good|disappointing|reasons?)\b/.test(
        t
      )
    const offTopic =
      countPatternMatches(t, [/\b(nigeria|nigerian)\b/, /\bartists?\b/, /\bmuseums?\b/, /\bcultural identity\b/]) >=
        2 && !hasConference

    if (offTopic) {
      return {
        ok: false,
        message:
          'Topic: this does not look like a reply about the Business Leadership conference. Write as Tim to Francine with three reasons not to attend.',
      }
    }
    if (!hasConference) {
      return {
        ok: false,
        message: 'Topic: mention the conference and your experience last year.',
      }
    }
    if (!hasPromptContext) {
      return {
        ok: false,
        message:
          'Topic: respond to Francine\'s e-mail — explain why the conference was not good and give three clear reasons.',
      }
    }
    return {
      ok: true,
      message: 'Topic: your e-mail appears to respond to the conference prompt.',
    }
  }

  if (task === 'email2') {
    const hasMoveContext = /\b(move|moved|dale city|new (home|city|resident|area))\b/.test(t)
    const offTopic =
      countPatternMatches(t, [/\b(nigeria|nigerian)\b/, /\bconference\b/, /\bartists?\b/]) >= 2 && !hasMoveContext

    if (offTopic) {
      return {
        ok: false,
        message:
          'Topic: this does not look like an e-mail to the Dale City Welcome Committee. Write as a new resident with requests for local information.',
      }
    }
    if (!hasMoveContext) {
      return {
        ok: false,
        message: 'Topic: mention that you have recently moved to Dale City.',
      }
    }
    return {
      ok: true,
      message: 'Topic: your e-mail appears to fit the new-resident / Dale City prompt.',
    }
  }

  return { ok: true, message: 'Topic: answer appears related to the task.' }
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

  const topicRelevance = assessTaskRelevance(task, trimmed)
  items.push(topicRelevance)

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
  }

  if (task === 'writing1') {
    items.push({
      ok: words >= 50,
      message:
        words >= 50
          ? `Length: about ${words} words — reasonable for a short professional profile.`
          : `Length: about ${words} words — try to write a fuller profile (aim for at least 50 words).`,
    })
    const tenses = countTenseSignals(trimmed)
    const tenseCount = [
      tenses.presentSimple,
      tenses.pastSimple,
      tenses.presentPerfect,
      tenses.presentContinuous,
    ].filter(Boolean).length
    items.push({
      ok: tenseCount >= 3,
      message:
        tenseCount >= 3
          ? `Tenses: you appear to use several tenses (${tenseCount} of 4 detected) — good for this task.`
          : `Tenses: try to use a wider variety — present simple, past simple, present perfect, and present continuous (about ${tenseCount} detected so far).`,
    })
    items.push({
      ok: tenses.presentPerfect,
      message: tenses.presentPerfect
        ? 'Present perfect: you use present perfect forms (good for experience and achievements).'
        : 'Present perfect: try present perfect for experience up to now (e.g. "I have worked…", "I have led…").',
    })
    items.push({
      ok: tenses.pastSimple,
      message: tenses.pastSimple
        ? 'Past simple: you describe past roles or achievements with past forms.'
        : 'Past simple: add past events or previous roles (e.g. "I worked…", "I completed…").',
    })
    items.push({
      ok: /\b(currently|at present|now|today)\b/i.test(trimmed) || tenses.presentContinuous,
      message:
        /\b(currently|at present|now|today)\b/i.test(trimmed) || tenses.presentContinuous
          ? 'Current role: you refer to your present situation or ongoing work.'
          : 'Current role: describe what you do now (present simple or present continuous).',
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
    const hasOpinionFrame =
      /\b(in my opinion|i think|i believe|on the one hand|on the other hand)\b/i.test(trimmed) ||
      (topicRelevance.ok &&
        /\b(advantages?|disadvantages?)\b/i.test(trimmed))
    items.push({
      ok: hasOpinionFrame,
      message: hasOpinionFrame
        ? 'Task: you state an opinion and discuss advantages/disadvantages.'
        : 'Task: clearly state your opinion and discuss both advantages and disadvantages of staying at one company.',
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
  email1: `ASSIGNED TASK (E-mail 1) — the student's answer MUST match this:
Francine e-mailed Tim asking about the Business Leadership conference. The student writes AS TIM, replying that they attended last year, and gives THREE reasons why the conference was not good / why Francine should not go.`,
  email2: `ASSIGNED TASK (E-mail 2) — the student's answer MUST match this:
The Welcome Committee e-mailed new Dale City residents. The student writes AS a new resident who has recently moved, and makes at least TWO polite requests for local information (e.g. clubs, services, banks).`,
  essay: `ASSIGNED TASK (Essay) — the student's answer MUST match this exact prompt:
"Some people work for the same company for their entire career. What are the advantages and disadvantages of staying at one company? Give reasons and examples."
Minimum 300 words. The essay must be about careers / staying at one employer — NOT another topic (e.g. art, history, environment) even if well written.`,
  writing1: `ASSIGNED TASK (Writing #1 — Mixed Tenses) — the student's answer MUST match this:
Write a professional LinkedIn-style "About" profile summarising their career so far. They should use a variety of tenses (past simple, present simple, present perfect, present continuous, etc.) to describe background, current role, and achievements. This is grammar practice, not a TOEIC exam task.`,
}

const AI_FEEDBACK_RULES = `CRITICAL RULES:
1. Read the ASSIGNED TASK first. Decide whether the student's text actually answers THAT task.
2. If the answer is off-topic, wrong persona, or about a different subject: say so clearly. Do NOT praise task completion, "understanding the documents", or content quality for the wrong topic.
3. Grammar and style are secondary when the task is not addressed — mention them briefly only after flagging off-topic content.
4. Automated "Topic" checks in the instant checks are hints — use your own judgment too, but trust an off-topic warning when the text is clearly unrelated.
5. Do NOT rewrite their entire answer. Be supportive but honest.`

export function buildGeminiPrompt(
  task: WritingTaskType,
  studentText: string,
  structural: StructuralFeedback
): string {
  const structuralSummary = structural.items
    .map((i) => `${i.ok ? '✓' : '○'} ${i.message}`)
    .join('\n')

  const topicCheck = structural.items.find((i) => i.message.startsWith('Topic:'))
  const topicHint = topicCheck
    ? `\nTopic check result: ${topicCheck.ok ? 'ON-TOPIC (heuristic)' : 'LIKELY OFF-TOPIC (heuristic) — ' + topicCheck.message}`
    : ''

  if (task === 'writing1') {
    return `You are a supportive English grammar tutor. This is practice feedback for a mixed-tenses writing task — not an official exam score.

${TASK_PROMPTS[task]}

${AI_FEEDBACK_RULES}

Automated checks already ran:
${structuralSummary}${topicHint}

Student's writing:
---
${studentText.trim()}
---

Respond in English with this exact structure (use markdown headings):

## Task relevance
(State clearly: ON-TOPIC / PARTIALLY ON-TOPIC / OFF-TOPIC for a professional career profile. 2–3 sentences.)

## Overall
(1–2 sentences on profile quality and tense variety)

## Task completion
(1–2 sentences: LinkedIn-style profile, career achievements, variety of tenses)

## Strengths
- (bullet 1)
- (bullet 2)

## Areas to improve
- (bullet 1)
- (bullet 2)
- (optional bullet 3)

## Language notes
- Comment on tense choice and accuracy; quote short phrases and suggest improvements (up to 4 bullets). Highlight where a different tense might work better.`
  }

  return `You are a supportive TOEIC Writing tutor. This is practice feedback generated by AI — not an official TOEIC score.

${TASK_PROMPTS[task]}

${AI_FEEDBACK_RULES}

Automated checks already ran:
${structuralSummary}${topicHint}

Student's writing:
---
${studentText.trim()}
---

Respond in English with this exact structure (use markdown headings):

## Task relevance
(State clearly: ON-TOPIC / PARTIALLY ON-TOPIC / OFF-TOPIC for the assigned task above. If off-topic, name what the text is actually about vs what was required. 2–4 sentences.)

## Overall
(1–2 sentences; if off-topic, lead with that — do not call it a "good essay" for this task)

## Task completion
(1–2 sentences about whether they fulfilled the ASSIGNED prompt, not generic writing quality)

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

export type AiFeedbackSource = 'gemini' | 'openai' | 'template'

export interface AiFeedbackResult {
  text: string
  source: AiFeedbackSource
  model?: string
  /** Shown when a backup path was used (quota, optional OpenAI, or offline tips). */
  sourceNote?: string
}

const DEFAULT_GEMINI_FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash-lite']

function getGeminiModelChain(): string[] {
  // flash-lite has higher free-tier limits; flash is tried next if lite is busy
  const primary = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
  const fromEnv = (process.env.GEMINI_FALLBACK_MODELS || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
  const fallbacks = fromEnv.length > 0 ? fromEnv : DEFAULT_GEMINI_FALLBACK_MODELS
  return [...new Set([primary, ...fallbacks])]
}

function isGeminiRetryableStatus(status: number): boolean {
  return status === 429 || status === 503 || status === 500
}

async function callGeminiModel(
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
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
    let apiMessage = ''
    try {
      const parsed = JSON.parse(errText) as { error?: { message?: string } }
      apiMessage = parsed?.error?.message || ''
    } catch {
      apiMessage = errText.slice(0, 200)
    }
    const err = new Error(apiMessage || `Gemini HTTP ${response.status}`) as Error & {
      status?: number
      retryable?: boolean
    }
    err.status = response.status
    err.retryable = isGeminiRetryableStatus(response.status)
    console.error('Gemini API error:', model, response.status, errText.slice(0, 400))
    throw err
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text || typeof text !== 'string') {
    throw new Error('AI returned an empty response')
  }
  return text.trim()
}

async function tryGeminiChain(
  prompt: string
): Promise<{ text: string; model: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const models = getGeminiModelChain()
  let lastRetryable: Error | null = null

  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    if (i > 0) {
      await new Promise((r) => setTimeout(r, 400))
    }
    try {
      const text = await callGeminiModel(apiKey, model, prompt)
      return { text, model }
    } catch (err) {
      const e = err as Error & { retryable?: boolean; status?: number }
      if (e.status === 401 || e.status === 403) {
        throw err
      }
      if (e.retryable || e.status === 404) {
        if (e.retryable) lastRetryable = e
        else console.warn(`Gemini model unavailable, skipping: ${model}`)
        continue
      }
      console.warn(`Gemini error on ${model}, trying next:`, e.message)
      continue
    }
  }

  if (lastRetryable) {
    console.warn('All Gemini models exhausted quota:', models.join(', '))
  }
  return null
}

async function tryOpenAiFeedback(prompt: string): Promise<{ text: string; model: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content:
            'You are a supportive TOEIC Writing tutor. Always judge whether the answer matches the ASSIGNED TOEIC task before praising grammar or structure. If off-topic, say so clearly in Task relevance and Overall. Use the markdown headings requested in the user message. Do not rewrite the whole answer.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('OpenAI API error:', response.status, errText.slice(0, 400))
    if (response.status === 429 || response.status === 503) return null
    throw new Error('OpenAI backup failed')
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text || typeof text !== 'string') return null
  return { text: text.trim(), model }
}

/** Offline-style feedback from instant checks when all AI providers are unavailable. */
export function generateTemplateFeedback(
  task: WritingTaskType,
  structural: StructuralFeedback
): string {
  const improve = structural.items.filter((i) => !i.ok).map((i) => i.message)
  const strengths = structural.items.filter((i) => i.ok).map((i) => i.message)

  const taskTips: Record<WritingTaskType, string[]> = {
    email1: [
      'Give **three clear reasons** why the conference was disappointing (one idea per paragraph or bullet).',
      'Use linking words: *First,* *Furthermore,* *Finally,* or *In addition,*.',
      'Keep a semi-formal tone — you are replying to a colleague (Tim → Francine).',
    ],
    email2: [
      'Make **at least two polite requests** for information (questions work well).',
      'Use formal register: *Dear Sir or Madam,* and *Yours faithfully,*.',
      'Mention that you have **recently moved** to Dale City.',
    ],
    essay: [
      'State your opinion in the introduction and discuss **both** advantages and disadvantages.',
      'Support ideas with short examples from work life.',
      'Use clear paragraphs and end with *In conclusion,* or *To sum up,*.',
    ],
    writing1: [
      'Use **past simple** for finished roles or achievements (e.g. *I worked…*, *I completed…*).',
      'Use **present perfect** for experience up to now (e.g. *I have managed…*, *I have worked in…*).',
      'Use **present simple** or **present continuous** for your current role.',
      'Keep a professional LinkedIn tone — clear, positive, and focused on achievements.',
    ],
  }

  const improveBullets =
    improve.length > 0
      ? improve.map((m) => `- ${m}`).join('\n')
      : '- Keep developing your ideas with more detail and examples.'

  const strengthBullets =
    strengths.length > 0
      ? strengths.slice(0, 4).map((m) => `- ${m}`).join('\n')
      : '- You have made a solid start on this task.'

  const tipBullets = taskTips[task].map((t) => `- ${t}`).join('\n')
  const topicItem = structural.items.find((i) => i.message.startsWith('Topic:'))
  const offTopicLead = topicItem && !topicItem.ok
    ? `**Important:** Your answer may not match the assigned task. ${topicItem.message.replace(/^Topic:\s*/i, '')} Fix the topic before polishing language.\n\n`
    : ''

  return `## Task relevance
${offTopicLead || ''}${topicItem ? (topicItem.ok ? 'Your instant checks suggest you are on the right topic. The AI tutor was busy — review the points below.' : topicItem.message.replace(/^Topic:\s*/i, '')) : 'Check that your answer matches the prompt on the worksheet.'}

## Overall
This is **practice guidance** based on your instant checks (the Google AI quota was busy). Use the points below to revise your draft.

## Task completion
${improveBullets}

## Strengths
${strengthBullets}

## Areas to improve
${tipBullets}

## Language notes
- Read your answer aloud and fix any awkward phrases.
- Check subject–verb agreement and past tenses where you describe experiences.
- Try one more complex sentence (e.g. with *although*, *because*, or *which*).`
}

export async function generateAiFeedback(
  task: WritingTaskType,
  studentText: string,
  structural: StructuralFeedback
): Promise<AiFeedbackResult> {
  const prompt = buildGeminiPrompt(task, studentText, structural)
  const useTemplateFallback = process.env.WRITING_AI_TEMPLATE_FALLBACK !== 'false'

  const gemini = await tryGeminiChain(prompt)
  if (gemini) {
    return {
      text: gemini.text,
      source: 'gemini',
      model: gemini.model,
    }
  }

  const openai = await tryOpenAiFeedback(prompt)
  if (openai) {
    return {
      text: openai.text,
      source: 'openai',
      model: openai.model,
      sourceNote:
        'Full AI feedback (backup service). Google Gemini was temporarily busy.',
    }
  }

  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  if (useTemplateFallback) {
    return {
      text: generateTemplateFeedback(task, structural),
      source: 'template',
      sourceNote:
        "Practice tips from your instant checks — the Google AI quota was reached. Wait a few minutes and click **Get AI Feedback** again for full AI comments, or ask your teacher about API limits.",
    }
  }

  throw new Error(
    'AI feedback quota reached on all configured models. Please wait a few minutes and try again, or ask your teacher to add a backup API key (OpenAI) or enable billing on Google AI Studio.'
  )
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
