export type ConjugationCell = {
  pronoun: string
  form: string
}

export type ConjugationTheme = {
  card: string
  title: string
  tableBorder: string
  tableDivide: string
  quoteBorder: string
}

export type ConjugationSection = {
  title: string
  forms: ConjugationCell[]
  note?: string
  exampleFr: string
  exampleEn: string
  theme: ConjugationTheme
}

export type FrenchVerbPageData = {
  infinitive: string
  summary: string
  radicalChips: { label: string; className: string }[]
  rows: [ConjugationSection, ConjugationSection][]
}

export const CONJUGATION_THEMES = {
  present: {
    card: 'border-sky-200 bg-sky-50',
    title: 'text-sky-900',
    tableBorder: 'border-sky-100',
    tableDivide: 'divide-sky-100',
    quoteBorder: 'border-sky-300',
  },
  future: {
    card: 'border-indigo-200 bg-indigo-50',
    title: 'text-indigo-900',
    tableBorder: 'border-indigo-100',
    tableDivide: 'divide-indigo-100',
    quoteBorder: 'border-indigo-300',
  },
  passeCompose: {
    card: 'border-violet-200 bg-violet-50',
    title: 'text-violet-900',
    tableBorder: 'border-violet-100',
    tableDivide: 'divide-violet-100',
    quoteBorder: 'border-violet-300',
  },
  imparfait: {
    card: 'border-fuchsia-200 bg-fuchsia-50',
    title: 'text-fuchsia-900',
    tableBorder: 'border-fuchsia-100',
    tableDivide: 'divide-fuchsia-100',
    quoteBorder: 'border-fuchsia-300',
  },
  subjonctif: {
    card: 'border-amber-200 bg-amber-50',
    title: 'text-amber-950',
    tableBorder: 'border-amber-100',
    tableDivide: 'divide-amber-100',
    quoteBorder: 'border-amber-300',
  },
  conditionnel: {
    card: 'border-orange-200 bg-orange-50',
    title: 'text-orange-950',
    tableBorder: 'border-orange-100',
    tableDivide: 'divide-orange-100',
    quoteBorder: 'border-orange-300',
  },
  imperatif: {
    card: 'border-emerald-200 bg-emerald-50',
    title: 'text-emerald-900',
    tableBorder: 'border-emerald-100',
    tableDivide: 'divide-emerald-100',
    quoteBorder: 'border-emerald-300',
  },
  gerondif: {
    card: 'border-teal-200 bg-teal-50',
    title: 'text-teal-900',
    tableBorder: 'border-teal-100',
    tableDivide: 'divide-teal-100',
    quoteBorder: 'border-teal-300',
  },
} as const

export function pairSections(
  sections: ConjugationSection[]
): [ConjugationSection, ConjugationSection][] {
  const rows: [ConjugationSection, ConjugationSection][] = []
  for (let i = 0; i < sections.length; i += 2) {
    rows.push([sections[i], sections[i + 1]])
  }
  return rows
}
