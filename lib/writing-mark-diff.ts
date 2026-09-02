import { escapeHtml } from '@/lib/writing-submissions'

export type DiffOp = { type: 'equal' | 'insert' | 'delete'; text: string }

/** Split text into words, punctuation, whitespace runs, and newlines for diffing. */
export function tokenizeForDiff(text: string): string[] {
  const tokens: string[] = []
  const re = /\w+|[^\w\s]|\n|\s+/g
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    tokens.push(match[0])
  }
  return tokens
}

/** Word-level diff using LCS — deletions first when ambiguous (typical proofreading order). */
export function diffTokens(originalTokens: string[], revisedTokens: string[]): DiffOp[] {
  const m = originalTokens.length
  const n = revisedTokens.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (originalTokens[i - 1] === revisedTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const ops: DiffOp[] = []
  let i = m
  let j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && originalTokens[i - 1] === revisedTokens[j - 1]) {
      ops.push({ type: 'equal', text: originalTokens[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'insert', text: revisedTokens[j - 1] })
      j--
    } else {
      ops.push({ type: 'delete', text: originalTokens[i - 1] })
      i--
    }
  }

  ops.reverse()
  return mergeAdjacentOps(ops)
}

function mergeAdjacentOps(ops: DiffOp[]): DiffOp[] {
  if (ops.length === 0) return ops
  const merged: DiffOp[] = [{ ...ops[0] }]
  for (let k = 1; k < ops.length; k++) {
    const prev = merged[merged.length - 1]
    const cur = ops[k]
    if (prev.type === cur.type) {
      prev.text += cur.text
    } else {
      merged.push({ ...cur })
    }
  }
  return merged
}

export function diffPlainText(original: string, revised: string): DiffOp[] {
  return diffTokens(tokenizeForDiff(original), tokenizeForDiff(revised))
}

/** Build marked HTML paragraphs from original vs teacher's corrected plain text. */
export function diffToMarkedHtml(original: string, revised: string): string {
  const normalizedOriginal = original.replace(/\r\n/g, '\n')
  const normalizedRevised = revised.replace(/\r\n/g, '\n')

  if (normalizedOriginal === normalizedRevised) {
    return plainTextToMarkedHtml(normalizedRevised)
  }

  const ops = diffPlainText(normalizedOriginal, normalizedRevised)
  const paragraphs: string[] = []
  let current = ''

  const flushParagraph = () => {
    paragraphs.push(`<p>${current || '<br>'}</p>`)
    current = ''
  }

  for (const op of ops) {
    const parts = op.text.split('\n')
    for (let p = 0; p < parts.length; p++) {
      const chunk = parts[p]
      if (chunk) {
        const escaped = escapeHtml(chunk)
        if (op.type === 'equal') {
          current += escaped
        } else if (op.type === 'insert') {
          current += `<span class="wc-ins">${escaped}</span>`
        } else {
          current += `<span class="wc-del"><s>${escaped}</s></span>`
        }
      }
      if (p < parts.length - 1) {
        flushParagraph()
      }
    }
  }

  flushParagraph()
  return paragraphs.join('')
}

/** Plain paragraphs with no track-changes markup (unchanged text). */
export function plainTextToMarkedHtml(text: string): string {
  const normalized = text.replace(/\r\n/g, '\n')
  if (!normalized.trim()) {
    return '<p><br></p>'
  }
  return normalized
    .split('\n')
    .map((line) => `<p>${line ? escapeHtml(line) : '<br>'}</p>`)
    .join('')
}

/**
 * Recover the teacher's corrected plain text from saved marked HTML
 * (drop deletions, keep insertions and unchanged text).
 */
export function parseRevisedFromMarkedHtml(html: string): string {
  if (!html.trim()) return ''

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const blockTags = new Set(['P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'])

  const collectText = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || ''
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return ''
    }
    const el = node as Element
    const tag = el.tagName
    if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL' || el.classList.contains('wc-del')) {
      return ''
    }
    if (tag === 'BR') {
      return '\n'
    }
    let out = ''
    for (const child of Array.from(el.childNodes)) {
      out += collectText(child)
    }
    if (blockTags.has(tag)) {
      out += '\n'
    }
    return out
  }

  let text = ''
  for (const child of Array.from(doc.body.childNodes)) {
    text += collectText(child)
  }

  return text.replace(/\r\n/g, '\n').replace(/\n+$/, '')
}
