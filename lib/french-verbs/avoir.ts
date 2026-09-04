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
      { pronoun: "j'", form: 'ai' },
      { pronoun: 'tu', form: 'as' },
      { pronoun: 'il / elle / on', form: 'a' },
      { pronoun: 'nous', form: 'avons' },
      { pronoun: 'vous', form: 'avez' },
      { pronoun: 'ils / elles', form: 'ont' },
    ],
    exampleFr:
      'Nous avons désormais une vision claire des priorités budgétaires pour le prochain trimestre.',
    exampleEn:
      'We now have a clear view of the budget priorities for the next quarter.',
  },
  {
    title: 'Futur simple',
    theme: T.future,
    forms: [
      { pronoun: "j'", form: 'aurai' },
      { pronoun: 'tu', form: 'auras' },
      { pronoun: 'il / elle / on', form: 'aura' },
      { pronoun: 'nous', form: 'aurons' },
      { pronoun: 'vous', form: 'aurez' },
      { pronoun: 'ils / elles', form: 'auront' },
    ],
    exampleFr:
      'D’ici la fin de l’année, l’équipe aura un tableau de bord partagé pour suivre chaque indicateur clé.',
    exampleEn:
      'By the end of the year, the team will have a shared dashboard to track every key indicator.',
  },
  {
    title: 'Passé composé',
    theme: T.passeCompose,
    forms: [
      { pronoun: "j'", form: 'ai eu' },
      { pronoun: 'tu', form: 'as eu' },
      { pronoun: 'il / elle / on', form: 'a eu' },
      { pronoun: 'nous', form: 'avons eu' },
      { pronoun: 'vous', form: 'avez eu' },
      { pronoun: 'ils / elles', form: 'ont eu' },
    ],
    note: 'Auxiliaire avoir + participe passé eu (invariable ici).',
    exampleFr:
      'La direction a eu du mal à convaincre les actionnaires du bien-fondé de cette acquisition.',
    exampleEn:
      'Leadership struggled to convince shareholders of the merits of this acquisition.',
  },
  {
    title: 'Imparfait',
    theme: T.imparfait,
    forms: [
      { pronoun: "j'", form: 'avais' },
      { pronoun: 'tu', form: 'avais' },
      { pronoun: 'il / elle / on', form: 'avait' },
      { pronoun: 'nous', form: 'avions' },
      { pronoun: 'vous', form: 'aviez' },
      { pronoun: 'ils / elles', form: 'avaient' },
    ],
    exampleFr:
      'À l’époque, nous avions encore peu de données fiables pour mesurer l’impact de la campagne.',
    exampleEn:
      'At the time, we still had little reliable data to measure the campaign’s impact.',
  },
  {
    title: 'Subjonctif présent',
    theme: T.subjonctif,
    forms: [
      { pronoun: "que j'", form: 'aie' },
      { pronoun: 'que tu', form: 'aies' },
      { pronoun: "qu'il/elle", form: 'ait' },
      { pronoun: 'que nous', form: 'ayons' },
      { pronoun: 'que vous', form: 'ayez' },
      { pronoun: "qu'ils/elles", form: 'aient' },
    ],
    exampleFr:
      'Il est essentiel que chaque responsable ait une lecture précise des risques avant de signer.',
    exampleEn:
      'It is essential that every manager have a precise reading of the risks before signing.',
  },
  {
    title: 'Conditionnel présent',
    theme: T.conditionnel,
    forms: [
      { pronoun: "j'", form: 'aurais' },
      { pronoun: 'tu', form: 'aurais' },
      { pronoun: 'il / elle / on', form: 'aurait' },
      { pronoun: 'nous', form: 'aurions' },
      { pronoun: 'vous', form: 'auriez' },
      { pronoun: 'ils / elles', form: 'auraient' },
    ],
    exampleFr:
      'Sans ce partenariat, nous n’aurions guère de chance d’accéder à ce marché aussi rapidement.',
    exampleEn:
      'Without this partnership, we would scarcely have a chance of entering that market so quickly.',
  },
  {
    title: 'Impératif présent',
    theme: T.imperatif,
    forms: [
      { pronoun: '(tu)', form: 'aie' },
      { pronoun: '(nous)', form: 'ayons' },
      { pronoun: '(vous)', form: 'ayez' },
    ],
    note: 'Formes courantes : aie confiance · ayons le courage · ayez l’obligeance de…',
    exampleFr: 'Ayez l’honnêteté de reconnaître les limites actuelles du dispositif.',
    exampleEn: 'Have the honesty to acknowledge the current limits of the system.',
  },
  {
    title: 'Gérondif présent',
    theme: T.gerondif,
    forms: [{ pronoun: '', form: 'en ayant' }],
    exampleFr:
      'C’est en ayant une vision à long terme qu’elle a su transformer une contrainte en avantage concurrentiel.',
    exampleEn:
      'It was by having a long-term vision that she managed to turn a constraint into a competitive advantage.',
  },
]

export const AVOIR_VERB: FrenchVerbPageData = {
  infinitive: 'avoir',
  summary: 'verbe auxiliaire · irrégulier · participe passé : eu',
  radicalChips: [
    { label: 'ai / a / ont', className: 'bg-sky-100 text-sky-900' },
    { label: 'aur-', className: 'bg-indigo-100 text-indigo-900' },
    { label: 'av-', className: 'bg-violet-100 text-violet-900' },
  ],
  rows: pairSections(sections),
}
