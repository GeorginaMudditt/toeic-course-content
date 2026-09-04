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
      { pronoun: "je / j'", form: 'vends' },
      { pronoun: 'tu', form: 'vends' },
      { pronoun: 'il / elle / on', form: 'vend' },
      { pronoun: 'nous', form: 'vendons' },
      { pronoun: 'vous', form: 'vendez' },
      { pronoun: 'ils / elles', form: 'vendent' },
    ],
    exampleFr:
      'Nous vendons aujourd’hui une offre packagée plutôt que des prestations isolées.',
    exampleEn:
      'Today we sell a packaged offer rather than isolated services.',
  },
  {
    title: 'Futur simple',
    theme: T.future,
    forms: [
      { pronoun: "je / j'", form: 'vendrai' },
      { pronoun: 'tu', form: 'vendras' },
      { pronoun: 'il / elle / on', form: 'vendra' },
      { pronoun: 'nous', form: 'vendrons' },
      { pronoun: 'vous', form: 'vendrez' },
      { pronoun: 'ils / elles', form: 'vendront' },
    ],
    exampleFr:
      'L’entreprise vendra sa filiale européenne dès que les conditions de marché seront favorables.',
    exampleEn:
      'The company will sell its European subsidiary as soon as market conditions are favourable.',
  },
  {
    title: 'Passé composé',
    theme: T.passeCompose,
    forms: [
      { pronoun: "j'", form: 'ai vendu' },
      { pronoun: 'tu', form: 'as vendu' },
      { pronoun: 'il / elle / on', form: 'a vendu' },
      { pronoun: 'nous', form: 'avons vendu' },
      { pronoun: 'vous', form: 'avez vendu' },
      { pronoun: 'ils / elles', form: 'ont vendu' },
    ],
    note: 'Auxiliaire avoir + participe passé vendu (invariable ici).',
    exampleFr:
      'Le groupe a vendu une partie de son portefeuille immobilier pour renforcer sa trésorerie.',
    exampleEn:
      'The group sold part of its property portfolio to strengthen its cash position.',
  },
  {
    title: 'Imparfait',
    theme: T.imparfait,
    forms: [
      { pronoun: "je / j'", form: 'vendais' },
      { pronoun: 'tu', form: 'vendais' },
      { pronoun: 'il / elle / on', form: 'vendait' },
      { pronoun: 'nous', form: 'vendions' },
      { pronoun: 'vous', form: 'vendiez' },
      { pronoun: 'ils / elles', form: 'vendaient' },
    ],
    exampleFr:
      'Avant le recentrage stratégique, la marque vendait encore sur plusieurs canaux peu rentables.',
    exampleEn:
      'Before the strategic refocus, the brand was still selling through several unprofitable channels.',
  },
  {
    title: 'Subjonctif présent',
    theme: T.subjonctif,
    forms: [
      { pronoun: "que je / j'", form: 'vende' },
      { pronoun: 'que tu', form: 'vendes' },
      { pronoun: "qu'il/elle", form: 'vende' },
      { pronoun: 'que nous', form: 'vendions' },
      { pronoun: 'que vous', form: 'vendiez' },
      { pronoun: "qu'ils/elles", form: 'vendent' },
    ],
    exampleFr:
      'Il est peu probable que nous vendions à ce prix sans une clause de non-concurrence solide.',
    exampleEn:
      'It is unlikely that we would sell at that price without a solid non-compete clause.',
  },
  {
    title: 'Conditionnel présent',
    theme: T.conditionnel,
    forms: [
      { pronoun: "je / j'", form: 'vendrais' },
      { pronoun: 'tu', form: 'vendrais' },
      { pronoun: 'il / elle / on', form: 'vendrait' },
      { pronoun: 'nous', form: 'vendrions' },
      { pronoun: 'vous', form: 'vendriez' },
      { pronoun: 'ils / elles', form: 'vendraient' },
    ],
    exampleFr:
      'Dans un scénario plus agressif, nous vendrions aussi la licence technologique à l’international.',
    exampleEn:
      'In a more aggressive scenario, we would also sell the technology licence internationally.',
  },
  {
    title: 'Impératif présent',
    theme: T.imperatif,
    forms: [
      { pronoun: '(tu)', form: 'vends' },
      { pronoun: '(nous)', form: 'vendons' },
      { pronoun: '(vous)', form: 'vendez' },
    ],
    exampleFr: 'Vendez la valeur du service, pas seulement le tarif.',
    exampleEn: 'Sell the value of the service, not just the price.',
  },
  {
    title: 'Gérondif présent',
    theme: T.gerondif,
    forms: [{ pronoun: '', form: 'en vendant' }],
    exampleFr:
      'C’est en vendant une solution complète qu’ils ont augmenté leur panier moyen.',
    exampleEn:
      'It was by selling a complete solution that they increased their average basket size.',
  },
]

export const VENDRE_VERB: FrenchVerbPageData = {
  infinitive: 'vendre',
  summary: 'régulier · -re (type vendre)',
  radicalChips: [
    { label: 'vend-', className: 'bg-rose-100 text-rose-900' },
    { label: '-re → -u', className: 'bg-sky-100 text-sky-900' },
  ],
  rows: pairSections(sections),
}
