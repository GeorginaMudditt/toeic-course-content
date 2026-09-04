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
      { pronoun: "je / j'", form: 'suis' },
      { pronoun: 'tu', form: 'es' },
      { pronoun: 'il / elle / on', form: 'est' },
      { pronoun: 'nous', form: 'sommes' },
      { pronoun: 'vous', form: 'êtes' },
      { pronoun: 'ils / elles', form: 'sont' },
    ],
    exampleFr:
      'Notre priorité est de garantir une expérience client cohérente à chaque point de contact.',
    exampleEn:
      'Our priority is to guarantee a consistent customer experience at every touchpoint.',
  },
  {
    title: 'Futur simple',
    theme: T.future,
    forms: [
      { pronoun: "je / j'", form: 'serai' },
      { pronoun: 'tu', form: 'seras' },
      { pronoun: 'il / elle / on', form: 'sera' },
      { pronoun: 'nous', form: 'serons' },
      { pronoun: 'vous', form: 'serez' },
      { pronoun: 'ils / elles', form: 'seront' },
    ],
    exampleFr:
      'Dès que le protocole sera validé, nous pourrons déployer la solution à l’échelle nationale.',
    exampleEn:
      'As soon as the protocol is approved, we will be able to roll the solution out nationwide.',
  },
  {
    title: 'Passé composé',
    theme: T.passeCompose,
    forms: [
      { pronoun: "j'", form: 'ai été' },
      { pronoun: 'tu', form: 'as été' },
      { pronoun: 'il / elle / on', form: 'a été' },
      { pronoun: 'nous', form: 'avons été' },
      { pronoun: 'vous', form: 'avez été' },
      { pronoun: 'ils / elles', form: 'ont été' },
    ],
    note: 'Auxiliaire avoir + participe passé été (invariable).',
    exampleFr:
      'Le comité a été particulièrement attentif aux arguments présentés par les partenaires locaux.',
    exampleEn:
      'The committee was particularly attentive to the arguments put forward by the local partners.',
  },
  {
    title: 'Imparfait',
    theme: T.imparfait,
    forms: [
      { pronoun: "j'", form: 'étais' },
      { pronoun: 'tu', form: 'étais' },
      { pronoun: 'il / elle / on', form: 'était' },
      { pronoun: 'nous', form: 'étions' },
      { pronoun: 'vous', form: 'étiez' },
      { pronoun: 'ils / elles', form: 'étaient' },
    ],
    exampleFr:
      'Avant la réorganisation, le service était encore trop cloisonné pour collaborer efficacement.',
    exampleEn:
      'Before the reorganisation, the department was still too siloed to collaborate effectively.',
  },
  {
    title: 'Subjonctif présent',
    theme: T.subjonctif,
    forms: [
      { pronoun: "que je / j'", form: 'sois' },
      { pronoun: 'que tu', form: 'sois' },
      { pronoun: "qu'il/elle", form: 'soit' },
      { pronoun: 'que nous', form: 'soyons' },
      { pronoun: 'que vous', form: 'soyez' },
      { pronoun: "qu'ils/elles", form: 'soient' },
    ],
    exampleFr:
      'Il faut que la proposition soit à la fois ambitieuse et réaliste pour convaincre le conseil.',
    exampleEn:
      'The proposal needs to be both ambitious and realistic in order to convince the board.',
  },
  {
    title: 'Conditionnel présent',
    theme: T.conditionnel,
    forms: [
      { pronoun: "je / j'", form: 'serais' },
      { pronoun: 'tu', form: 'serais' },
      { pronoun: 'il / elle / on', form: 'serait' },
      { pronoun: 'nous', form: 'serions' },
      { pronoun: 'vous', form: 'seriez' },
      { pronoun: 'ils / elles', form: 'seraient' },
    ],
    exampleFr:
      'Dans un scénario plus prudent, nous serions prêts à étaler le déploiement sur deux exercices.',
    exampleEn:
      'In a more cautious scenario, we would be ready to spread the rollout over two financial years.',
  },
  {
    title: 'Impératif présent',
    theme: T.imperatif,
    forms: [
      { pronoun: '(tu)', form: 'sois' },
      { pronoun: '(nous)', form: 'soyons' },
      { pronoun: '(vous)', form: 'soyez' },
    ],
    note: 'Formes courantes : sois précis · soyons clairs · soyez prêts…',
    exampleFr: 'Soyez prêts à défendre vos chiffres face à un audit externe.',
    exampleEn: 'Be ready to defend your figures in the face of an external audit.',
  },
  {
    title: 'Gérondif présent',
    theme: T.gerondif,
    forms: [{ pronoun: '', form: 'en étant' }],
    exampleFr:
      'C’est en étant transparent sur les délais qu’il a rétabli la confiance avec le client.',
    exampleEn:
      'It was by being transparent about the timelines that he restored the client’s trust.',
  },
]

export const ETRE_VERB: FrenchVerbPageData = {
  infinitive: 'être',
  summary: 'verbe auxiliaire · irrégulier · participe passé : été',
  radicalChips: [
    { label: 'suis / est / sont', className: 'bg-sky-100 text-sky-900' },
    { label: 'ser-', className: 'bg-indigo-100 text-indigo-900' },
    { label: 'ét- / soi-', className: 'bg-violet-100 text-violet-900' },
  ],
  rows: pairSections(sections),
}
