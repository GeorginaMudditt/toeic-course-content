import {
  CONJUGATION_THEMES as T,
  pairSections,
  type FrenchVerbPageData,
} from '@/lib/french-verb-types'

const sections = [
  {
    title: 'Présent',
    theme: T.present,
    forms: [
      { pronoun: "je / j'", form: 'vais' },
      { pronoun: 'tu', form: 'vas' },
      { pronoun: 'il / elle / on', form: 'va' },
      { pronoun: 'nous', form: 'allons' },
      { pronoun: 'vous', form: 'allez' },
      { pronoun: 'ils / elles', form: 'vont' },
    ],
    exampleFr:
      'Le projet ne va pas sans poser quelques difficultés juridiques que nous devrons trancher avant le lancement.',
    exampleEn:
      "The project doesn't come without a few legal difficulties that we'll need to settle before the launch.",
  },
  {
    title: 'Futur simple',
    theme: T.future,
    forms: [
      { pronoun: "je / j'", form: 'irai' },
      { pronoun: 'tu', form: 'iras' },
      { pronoun: 'il / elle / on', form: 'ira' },
      { pronoun: 'nous', form: 'irons' },
      { pronoun: 'vous', form: 'irez' },
      { pronoun: 'ils / elles', form: 'iront' },
    ],
    exampleFr: "Si les tensions persistent, la situation ira en s'aggravant.",
    exampleEn: 'If tensions persist, the situation will keep getting worse.',
  },
  {
    title: 'Passé composé',
    theme: T.passeCompose,
    forms: [
      { pronoun: "je / j'", form: 'suis allé(e)' },
      { pronoun: 'tu', form: 'es allé(e)' },
      { pronoun: 'il / elle / on', form: 'est allé(e)' },
      { pronoun: 'nous', form: 'sommes allé(e)s' },
      { pronoun: 'vous', form: 'êtes allé(e)(s)' },
      { pronoun: 'ils / elles', form: 'sont allé(e)s' },
    ],
    note: 'Accord du participe passé avec le sujet (auxiliaire être).',
    exampleFr:
      "Après des mois de négociations tendues, les deux parties sont enfin allées à l'essentiel.",
    exampleEn:
      'After months of tense negotiations, the two parties finally got to the point.',
  },
  {
    title: 'Imparfait',
    theme: T.imparfait,
    forms: [
      { pronoun: "je / j'", form: 'allais' },
      { pronoun: 'tu', form: 'allais' },
      { pronoun: 'il / elle / on', form: 'allait' },
      { pronoun: 'nous', form: 'allions' },
      { pronoun: 'vous', form: 'alliez' },
      { pronoun: 'ils / elles', form: 'allaient' },
    ],
    exampleFr:
      "À l'époque, elle allait jusqu'à remettre en question les décisions de sa hiérarchie, ce qui ne manquait pas de surprendre.",
    exampleEn:
      'At the time, she would go as far as to question her superiors’ decisions, which never failed to surprise.',
  },
  {
    title: 'Subjonctif présent',
    theme: T.subjonctif,
    forms: [
      { pronoun: "je / j'", form: "que j'aille" },
      { pronoun: 'tu', form: 'que tu ailles' },
      { pronoun: 'il / elle / on', form: "qu'il/elle aille" },
      { pronoun: 'nous', form: 'que nous allions' },
      { pronoun: 'vous', form: 'que vous alliez' },
      { pronoun: 'ils / elles', form: "qu'ils/elles aillent" },
    ],
    exampleFr:
      "Il est indispensable que chacun aille au bout de ses idées avant de les abandonner.",
    exampleEn:
      "It's essential that everyone see their ideas through before giving up on them.",
  },
  {
    title: 'Conditionnel présent',
    theme: T.conditionnel,
    forms: [
      { pronoun: "je / j'", form: 'irais' },
      { pronoun: 'tu', form: 'irais' },
      { pronoun: 'il / elle / on', form: 'irait' },
      { pronoun: 'nous', form: 'irions' },
      { pronoun: 'vous', form: 'iriez' },
      { pronoun: 'ils / elles', form: 'iraient' },
    ],
    exampleFr:
      "À sa place, j'irais droit au but plutôt que de tourner autour du pot.",
    exampleEn:
      "In her position, I'd get straight to the point rather than beat around the bush.",
  },
  {
    title: 'Impératif présent',
    theme: T.imperatif,
    forms: [
      { pronoun: '(tu)', form: 'va' },
      { pronoun: '(nous)', form: 'allons' },
      { pronoun: '(vous)', form: 'allez' },
    ],
    note: 'Notez : vas-y (avec un -s) devant le pronom adverbial « y » non suivi d’un infinitif.',
    exampleFr: 'Allez au fond des choses avant de tirer des conclusions hâtives.',
    exampleEn: 'Get to the bottom of things before jumping to conclusions.',
  },
  {
    title: 'Gérondif présent',
    theme: T.gerondif,
    forms: [{ pronoun: '', form: 'en allant' }],
    exampleFr:
      "C'est en allant à l'encontre des conventions qu'elle a fini par s'imposer dans son domaine.",
    exampleEn:
      'It was by going against convention that she eventually made her mark in her field.',
  },
]

export const ALLER_VERB: FrenchVerbPageData = {
  infinitive: 'aller',
  summary: '3e groupe · auxiliaire être · irrégulier',
  radicalChips: [
    { label: 'va-', className: 'bg-sky-100 text-sky-900' },
    { label: 'ir-', className: 'bg-indigo-100 text-indigo-900' },
    { label: 'all-', className: 'bg-violet-100 text-violet-900' },
  ],
  rows: pairSections(sections),
}
