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
      { pronoun: "je / j'", form: 'fais' },
      { pronoun: 'tu', form: 'fais' },
      { pronoun: 'il / elle / on', form: 'fait' },
      { pronoun: 'nous', form: 'faisons' },
      { pronoun: 'vous', form: 'faites' },
      { pronoun: 'ils / elles', form: 'font' },
    ],
    exampleFr:
      'Nous faisons le point chaque lundi pour aligner les priorités commerciales et opérationnelles.',
    exampleEn:
      'We review progress every Monday to align commercial and operational priorities.',
  },
  {
    title: 'Futur simple',
    theme: T.future,
    forms: [
      { pronoun: "je / j'", form: 'ferai' },
      { pronoun: 'tu', form: 'feras' },
      { pronoun: 'il / elle / on', form: 'fera' },
      { pronoun: 'nous', form: 'ferons' },
      { pronoun: 'vous', form: 'ferez' },
      { pronoun: 'ils / elles', form: 'feront' },
    ],
    exampleFr:
      'Le cabinet fera une présentation détaillée des options juridiques avant toute décision.',
    exampleEn:
      'The firm will give a detailed presentation of the legal options before any decision is taken.',
  },
  {
    title: 'Passé composé',
    theme: T.passeCompose,
    forms: [
      { pronoun: "j'", form: 'ai fait' },
      { pronoun: 'tu', form: 'as fait' },
      { pronoun: 'il / elle / on', form: 'a fait' },
      { pronoun: 'nous', form: 'avons fait' },
      { pronoun: 'vous', form: 'avez fait' },
      { pronoun: 'ils / elles', form: 'ont fait' },
    ],
    note: 'Auxiliaire avoir + participe passé fait (invariable ici).',
    exampleFr:
      'L’équipe a fait preuve d’une grande agilité face aux contraintes imposées par le client.',
    exampleEn:
      'The team showed great agility in the face of the constraints imposed by the client.',
  },
  {
    title: 'Imparfait',
    theme: T.imparfait,
    forms: [
      { pronoun: "je / j'", form: 'faisais' },
      { pronoun: 'tu', form: 'faisais' },
      { pronoun: 'il / elle / on', form: 'faisait' },
      { pronoun: 'nous', form: 'faisions' },
      { pronoun: 'vous', form: 'faisiez' },
      { pronoun: 'ils / elles', form: 'faisaient' },
    ],
    exampleFr:
      'Avant la digitalisation, le service faisait encore toutes ses validations sur papier.',
    exampleEn:
      'Before digitisation, the department was still doing all its approvals on paper.',
  },
  {
    title: 'Subjonctif présent',
    theme: T.subjonctif,
    forms: [
      { pronoun: "que je / j'", form: 'fasse' },
      { pronoun: 'que tu', form: 'fasses' },
      { pronoun: "qu'il/elle", form: 'fasse' },
      { pronoun: 'que nous', form: 'fassions' },
      { pronoun: 'que vous', form: 'fassiez' },
      { pronoun: "qu'ils/elles", form: 'fassent' },
    ],
    exampleFr:
      'Il est préférable que le comité fasse une recommandation écrite avant le vote.',
    exampleEn:
      'It is preferable that the committee make a written recommendation before the vote.',
  },
  {
    title: 'Conditionnel présent',
    theme: T.conditionnel,
    forms: [
      { pronoun: "je / j'", form: 'ferais' },
      { pronoun: 'tu', form: 'ferais' },
      { pronoun: 'il / elle / on', form: 'ferait' },
      { pronoun: 'nous', form: 'ferions' },
      { pronoun: 'vous', form: 'feriez' },
      { pronoun: 'ils / elles', form: 'feraient' },
    ],
    exampleFr:
      'À votre place, je ferais valoir ces arguments dès la première réunion avec les financeurs.',
    exampleEn:
      'In your position, I would put these arguments forward from the very first meeting with the funders.',
  },
  {
    title: 'Impératif présent',
    theme: T.imperatif,
    forms: [
      { pronoun: '(tu)', form: 'fais' },
      { pronoun: '(nous)', form: 'faisons' },
      { pronoun: '(vous)', form: 'faites' },
    ],
    note: 'Formes courantes : fais attention · faisons le nécessaire · faites-moi savoir…',
    exampleFr: 'Faites-nous parvenir le dossier complet avant mercredi soir.',
    exampleEn: 'Please send us the complete file before Wednesday evening.',
  },
  {
    title: 'Gérondif présent',
    theme: T.gerondif,
    forms: [{ pronoun: '', form: 'en faisant' }],
    exampleFr:
      'C’est en faisant preuve de pédagogie qu’elle a obtenu l’adhésion de toute l’équipe.',
    exampleEn:
      'It was by showing real pedagogical skill that she won the whole team’s buy-in.',
  },
]

export const FAIRE_VERB: FrenchVerbPageData = {
  infinitive: 'faire',
  summary: '3e groupe · irrégulier · participe passé : fait',
  radicalChips: [
    { label: 'fais- / fait / font', className: 'bg-sky-100 text-sky-900' },
    { label: 'fer-', className: 'bg-indigo-100 text-indigo-900' },
    { label: 'fass-', className: 'bg-violet-100 text-violet-900' },
  ],
  rows: pairSections(sections),
}
