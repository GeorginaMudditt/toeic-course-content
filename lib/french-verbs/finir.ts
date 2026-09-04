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
      { pronoun: "je / j'", form: 'finis' },
      { pronoun: 'tu', form: 'finis' },
      { pronoun: 'il / elle / on', form: 'finit' },
      { pronoun: 'nous', form: 'finissons' },
      { pronoun: 'vous', form: 'finissez' },
      { pronoun: 'ils / elles', form: 'finissent' },
    ],
    exampleFr:
      'Nous finissons actuellement la phase de cadrage avant de lancer le prototype.',
    exampleEn:
      'We are currently finishing the scoping phase before launching the prototype.',
  },
  {
    title: 'Futur simple',
    theme: T.future,
    forms: [
      { pronoun: "je / j'", form: 'finirai' },
      { pronoun: 'tu', form: 'finiras' },
      { pronoun: 'il / elle / on', form: 'finira' },
      { pronoun: 'nous', form: 'finirons' },
      { pronoun: 'vous', form: 'finirez' },
      { pronoun: 'ils / elles', form: 'finiront' },
    ],
    exampleFr:
      'L’équipe finira l’audit interne avant la visite des certificateurs.',
    exampleEn:
      'The team will finish the internal audit before the certifiers’ visit.',
  },
  {
    title: 'Passé composé',
    theme: T.passeCompose,
    forms: [
      { pronoun: "j'", form: 'ai fini' },
      { pronoun: 'tu', form: 'as fini' },
      { pronoun: 'il / elle / on', form: 'a fini' },
      { pronoun: 'nous', form: 'avons fini' },
      { pronoun: 'vous', form: 'avez fini' },
      { pronoun: 'ils / elles', form: 'ont fini' },
    ],
    note: 'Auxiliaire avoir + participe passé fini (invariable ici).',
    exampleFr:
      'Le département a fini d’intégrer les retours clients dans la nouvelle version du produit.',
    exampleEn:
      'The department has finished integrating customer feedback into the new product version.',
  },
  {
    title: 'Imparfait',
    theme: T.imparfait,
    forms: [
      { pronoun: "je / j'", form: 'finissais' },
      { pronoun: 'tu', form: 'finissais' },
      { pronoun: 'il / elle / on', form: 'finissait' },
      { pronoun: 'nous', form: 'finissions' },
      { pronoun: 'vous', form: 'finissiez' },
      { pronoun: 'ils / elles', form: 'finissaient' },
    ],
    exampleFr:
      'Chaque trimestre, elle finissait ses bilans avec une journée d’avance sur le calendrier.',
    exampleEn:
      'Each quarter, she used to finish her reports a day ahead of schedule.',
  },
  {
    title: 'Subjonctif présent',
    theme: T.subjonctif,
    forms: [
      { pronoun: "que je / j'", form: 'finisse' },
      { pronoun: 'que tu', form: 'finisses' },
      { pronoun: "qu'il/elle", form: 'finisse' },
      { pronoun: 'que nous', form: 'finissions' },
      { pronoun: 'que vous', form: 'finissiez' },
      { pronoun: "qu'ils/elles", form: 'finissent' },
    ],
    exampleFr:
      'Il faut que nous finissions cette négociation avant l’ouverture de la session parlementaire.',
    exampleEn:
      'We need to finish this negotiation before the parliamentary session opens.',
  },
  {
    title: 'Conditionnel présent',
    theme: T.conditionnel,
    forms: [
      { pronoun: "je / j'", form: 'finirais' },
      { pronoun: 'tu', form: 'finirais' },
      { pronoun: 'il / elle / on', form: 'finirait' },
      { pronoun: 'nous', form: 'finirions' },
      { pronoun: 'vous', form: 'finiriez' },
      { pronoun: 'ils / elles', form: 'finiraient' },
    ],
    exampleFr:
      'Sans ces retards fournisseurs, nous finirions le chantier dans les délais annoncés.',
    exampleEn:
      'Without these supplier delays, we would finish the project within the announced deadlines.',
  },
  {
    title: 'Impératif présent',
    theme: T.imperatif,
    forms: [
      { pronoun: '(tu)', form: 'finis' },
      { pronoun: '(nous)', form: 'finissons' },
      { pronoun: '(vous)', form: 'finissez' },
    ],
    exampleFr: 'Finissez d’abord le diagnostic avant de proposer des solutions.',
    exampleEn: 'Finish the diagnosis first before proposing solutions.',
  },
  {
    title: 'Gérondif présent',
    theme: T.gerondif,
    forms: [{ pronoun: '', form: 'en finissant' }],
    exampleFr:
      'C’est en finissant chaque étape proprement qu’ils ont évité une dette technique coûteuse.',
    exampleEn:
      'It was by finishing each stage properly that they avoided costly technical debt.',
  },
]

export const FINIR_VERB: FrenchVerbPageData = {
  infinitive: 'finir',
  summary: '2e groupe · régulier · -ir (type finir)',
  radicalChips: [
    { label: 'fini- / finiss-', className: 'bg-amber-100 text-amber-950' },
    { label: '-ir → -i', className: 'bg-sky-100 text-sky-900' },
  ],
  rows: pairSections(sections),
}
