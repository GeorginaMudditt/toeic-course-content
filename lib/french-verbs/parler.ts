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
      { pronoun: "je / j'", form: 'parle' },
      { pronoun: 'tu', form: 'parles' },
      { pronoun: 'il / elle / on', form: 'parle' },
      { pronoun: 'nous', form: 'parlons' },
      { pronoun: 'vous', form: 'parlez' },
      { pronoun: 'ils / elles', form: 'parlent' },
    ],
    exampleFr:
      'Nous parlons régulièrement avec les parties prenantes pour anticiper les frictions du projet.',
    exampleEn:
      'We speak regularly with stakeholders to anticipate friction points in the project.',
  },
  {
    title: 'Futur simple',
    theme: T.future,
    forms: [
      { pronoun: "je / j'", form: 'parlerai' },
      { pronoun: 'tu', form: 'parleras' },
      { pronoun: 'il / elle / on', form: 'parlera' },
      { pronoun: 'nous', form: 'parlerons' },
      { pronoun: 'vous', form: 'parlerez' },
      { pronoun: 'ils / elles', form: 'parleront' },
    ],
    exampleFr:
      'La directrice parlera de la feuille de route lors de la prochaine assemblée générale.',
    exampleEn:
      'The director will speak about the roadmap at the next general assembly.',
  },
  {
    title: 'Passé composé',
    theme: T.passeCompose,
    forms: [
      { pronoun: "j'", form: 'ai parlé' },
      { pronoun: 'tu', form: 'as parlé' },
      { pronoun: 'il / elle / on', form: 'a parlé' },
      { pronoun: 'nous', form: 'avons parlé' },
      { pronoun: 'vous', form: 'avez parlé' },
      { pronoun: 'ils / elles', form: 'ont parlé' },
    ],
    note: 'Auxiliaire avoir + participe passé parlé (invariable ici).',
    exampleFr:
      'Le comité a parlé franchement des risques liés à ce partenariat stratégique.',
    exampleEn:
      'The committee spoke frankly about the risks linked to this strategic partnership.',
  },
  {
    title: 'Imparfait',
    theme: T.imparfait,
    forms: [
      { pronoun: "je / j'", form: 'parlais' },
      { pronoun: 'tu', form: 'parlais' },
      { pronoun: 'il / elle / on', form: 'parlait' },
      { pronoun: 'nous', form: 'parlions' },
      { pronoun: 'vous', form: 'parliez' },
      { pronoun: 'ils / elles', form: 'parlaient' },
    ],
    exampleFr:
      'À l’époque, on parlait encore peu de responsabilité sociale dans les conseils d’administration.',
    exampleEn:
      'At the time, people still spoke very little about social responsibility in boardrooms.',
  },
  {
    title: 'Subjonctif présent',
    theme: T.subjonctif,
    forms: [
      { pronoun: "que je / j'", form: 'parle' },
      { pronoun: 'que tu', form: 'parles' },
      { pronoun: "qu'il/elle", form: 'parle' },
      { pronoun: 'que nous', form: 'parlions' },
      { pronoun: 'que vous', form: 'parliez' },
      { pronoun: "qu'ils/elles", form: 'parlent' },
    ],
    exampleFr:
      'Il est important que le porte-parole parle d’une seule voix devant la presse.',
    exampleEn:
      'It is important that the spokesperson speak with one voice in front of the press.',
  },
  {
    title: 'Conditionnel présent',
    theme: T.conditionnel,
    forms: [
      { pronoun: "je / j'", form: 'parlerais' },
      { pronoun: 'tu', form: 'parlerais' },
      { pronoun: 'il / elle / on', form: 'parlerait' },
      { pronoun: 'nous', form: 'parlerions' },
      { pronoun: 'vous', form: 'parleriez' },
      { pronoun: 'ils / elles', form: 'parleraient' },
    ],
    exampleFr:
      'Je parlerais volontiers de nos résultats, à condition que les chiffres soient consolidés.',
    exampleEn:
      'I would gladly speak about our results, provided the figures have been consolidated.',
  },
  {
    title: 'Impératif présent',
    theme: T.imperatif,
    forms: [
      { pronoun: '(tu)', form: 'parle' },
      { pronoun: '(nous)', form: 'parlons' },
      { pronoun: '(vous)', form: 'parlez' },
    ],
    exampleFr: 'Parlez clairement des délais pour éviter toute ambiguïté contractuelle.',
    exampleEn: 'Speak clearly about the deadlines to avoid any contractual ambiguity.',
  },
  {
    title: 'Gérondif présent',
    theme: T.gerondif,
    forms: [{ pronoun: '', form: 'en parlant' }],
    exampleFr:
      'C’est en parlant directement aux utilisateurs qu’ils ont identifié le vrai besoin.',
    exampleEn:
      'It was by speaking directly to users that they identified the real need.',
  },
]

export const PARLER_VERB: FrenchVerbPageData = {
  infinitive: 'parler',
  summary: '1er groupe · régulier · -er',
  radicalChips: [
    { label: 'parl-', className: 'bg-emerald-100 text-emerald-900' },
    { label: '-er → -é', className: 'bg-sky-100 text-sky-900' },
  ],
  rows: pairSections(sections),
}
