export type DiffSide = 'equal' | 'changed'

export type DiffToken = {
  text: string
  side: DiffSide
}

function tokenize(text: string): string[] {
  return text.match(/\S+/g) ?? []
}

/**
 * Word-level LCS diff: marks tokens that differ between mistake and correction.
 * Short French phrases only — O(n·m) is fine.
 */
export function diffWords(mistake: string, correction: string): {
  mistakeTokens: DiffToken[]
  correctionTokens: DiffToken[]
} {
  const left = tokenize(mistake)
  const right = tokenize(correction)
  const m = left.length
  const n = right.length

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        left[i - 1] === right[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  const leftEqual = Array(m).fill(false)
  const rightEqual = Array(n).fill(false)
  let i = m
  let j = n
  while (i > 0 && j > 0) {
    if (left[i - 1] === right[j - 1]) {
      leftEqual[i - 1] = true
      rightEqual[j - 1] = true
      i--
      j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }

  return {
    mistakeTokens: left.map((text, index) => ({
      text,
      side: leftEqual[index] ? 'equal' : 'changed',
    })),
    correctionTokens: right.map((text, index) => ({
      text,
      side: rightEqual[index] ? 'equal' : 'changed',
    })),
  }
}
