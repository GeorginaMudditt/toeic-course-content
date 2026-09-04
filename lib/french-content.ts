export type FrenchCorrectionSeed = {
  mistake: string
  correction: string
}

/** Initial error-correction rows from Talkpal.ai notes (French_Corrections.pdf). */
export const FRENCH_CORRECTION_SEEDS: FrenchCorrectionSeed[] = [
  {
    mistake: 'ça prend le plupart de de mon temps',
    correction: 'ça prend la plupart de mon temps',
  },
  {
    mistake: 'passer le temps avec eux',
    correction: 'passer du temps avec eux',
  },
  {
    mistake: 'je travaille en plein temps',
    correction: 'je travaille à plein temps',
  },
  {
    mistake: 'mon propre entreprise',
    correction: 'ma propre entreprise',
  },
  {
    mistake: "l'entraînement d'un marathon",
    correction: "l'entraînement pour un marathon",
  },
  {
    mistake: 'de passer tous les étapes',
    correction: 'de passer toutes les étapes',
  },
  {
    mistake: 'ça prend de la plupart de mon temps à ce moment',
    correction: 'cela prend la majeure partie de mon temps à ce moment',
  },
  {
    mistake: "c'est un peu frustrante",
    correction: "c'est un peu frustrant",
  },
  {
    mistake: 'il y avait beaucoup de délais avec les choses administratives',
    correction: 'il y avait beaucoup de retards avec les démarches administratives',
  },
  {
    mistake: "J'habitais en Australie pendant 11 ans",
    correction: "J'ai habité en Australie pendant 11 ans",
  },
  {
    mistake: 'aller aux montagnes',
    correction: 'aller à la montagne',
  },
  {
    mistake: 'passer le temps',
    correction: 'passer du temps',
  },
  {
    mistake: 'toute ma famille sont',
    correction: 'toute ma famille est',
  },
  {
    mistake: 'on va à Noël',
    correction: 'on ira à Noël',
  },
  {
    mistake: 'ils viennent aussi ici pour nous visiter',
    correction: 'ils viennent aussi nous rendre visite ici',
  },
  {
    mistake: 'je peux revoir tous les erreurs',
    correction: 'je pourrai revoir toutes les erreurs',
  },
  {
    mistake: 'je peux améliorer comme ça',
    correction: "je pourrai m'améliorer ainsi",
  },
]

export type FrenchVerbCard = {
  slug: string
  title: string
  subtitle: string
  href: string
}

export type FrenchVerbGroup = {
  id: string
  title: string
  description: string
  cardClassName: string
  headingClassName: string
  verbs: FrenchVerbCard[]
}

/**
 * Pedagogical order for French verbs:
 * 1. Auxiliaries (avoir / être) — needed for compound tenses
 * 2. Irregular / 3e groupe high-frequency verbs
 * 3. Regular patterns by ending (-er, -ir like finir, then -re like vendre)
 */
export const FRENCH_VERB_GROUPS: FrenchVerbGroup[] = [
  {
    id: 'auxiliaries',
    title: 'Auxiliary verbs',
    description: 'Building blocks for compound tenses (passé composé, plus-que-parfait…).',
    cardClassName: 'border-violet-200 bg-violet-50 hover:border-violet-300',
    headingClassName: 'text-violet-900',
    verbs: [
      {
        slug: 'avoir',
        title: 'avoir',
        subtitle: 'auxiliaire · participe : eu',
        href: '/teacher/french/verbs/avoir',
      },
      {
        slug: 'etre',
        title: 'être',
        subtitle: 'auxiliaire · participe : été',
        href: '/teacher/french/verbs/etre',
      },
    ],
  },
  {
    id: 'irregular',
    title: 'Irregular verbs',
    description: 'High-frequency 3e groupe verbs with irregular stems.',
    cardClassName: 'border-sky-200 bg-sky-50 hover:border-sky-300',
    headingClassName: 'text-sky-900',
    verbs: [
      {
        slug: 'aller',
        title: 'aller',
        subtitle: '3e groupe · auxiliaire être',
        href: '/teacher/french/verbs/aller',
      },
      {
        slug: 'faire',
        title: 'faire',
        subtitle: '3e groupe · participe : fait',
        href: '/teacher/french/verbs/faire',
      },
    ],
  },
  {
    id: 'regular-er',
    title: 'Regular verbs · -er',
    description: '1er groupe — the largest pattern (parler, travailler…).',
    cardClassName: 'border-emerald-200 bg-emerald-50 hover:border-emerald-300',
    headingClassName: 'text-emerald-900',
    verbs: [
      {
        slug: 'parler',
        title: 'parler',
        subtitle: '1er groupe · -er',
        href: '/teacher/french/verbs/parler',
      },
    ],
  },
  {
    id: 'regular-ir',
    title: 'Regular verbs · -ir',
    description: '2e groupe — finir-type verbs (nous finissons…).',
    cardClassName: 'border-amber-200 bg-amber-50 hover:border-amber-300',
    headingClassName: 'text-amber-950',
    verbs: [
      {
        slug: 'finir',
        title: 'finir',
        subtitle: '2e groupe · -ir',
        href: '/teacher/french/verbs/finir',
      },
    ],
  },
  {
    id: 'regular-re',
    title: 'Regular verbs · -re',
    description: 'Regular -re pattern — vendre, attendre, répondre…',
    cardClassName: 'border-rose-200 bg-rose-50 hover:border-rose-300',
    headingClassName: 'text-rose-900',
    verbs: [
      {
        slug: 'vendre',
        title: 'vendre',
        subtitle: 'régulier · -re',
        href: '/teacher/french/verbs/vendre',
      },
    ],
  },
]

/** Flat list kept for convenience / older imports. */
export const FRENCH_VERBS: FrenchVerbCard[] = FRENCH_VERB_GROUPS.flatMap(
  (group) => group.verbs
)

export type FrenchXavierResource = {
  title: string
  description: string
  href: string
}

export const FRENCH_XAVIER_RESOURCES: FrenchXavierResource[] = [
  {
    title: 'La concordance des temps',
    description: 'Temps du passé de l’indicatif et emploi du subjonctif — fiche C1/C2.',
    href: '/french/xavier/concordance-des-temps.pdf',
  },
  {
    title: 'Un data center géant en Alsace',
    description: 'Compréhension écrite et grammaire : la concordance des temps.',
    href: '/french/xavier/data-center-fiche.pdf',
  },
  {
    title: 'Présenter son entreprise à l’oral',
    description: 'Expression orale C1-C2 — pitch, récit et situations professionnelles.',
    href: '/french/xavier/presenter-entreprise-oral.pdf',
  },
  {
    title: 'Se présenter aux parents d’élèves',
    description: 'Expression orale C1-C2 — confiance, méthodologie et offre.',
    href: '/french/xavier/presenter-parents-oral.pdf',
  },
]
