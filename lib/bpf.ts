export type BpfPeriodSlug = '2026-04-01-to-2026-09-30' | '2026-10-01-to-2027-09-30'

export type StagiaireCategory =
  | 'salarie_employeur_prive'
  | 'personne_recherche_emploi'
  | 'particulier_propres_frais'
  | 'autres'

export type TrainingModality = 'in_person' | 'distance' | 'blended'

export type CertificationType =
  | 'none'
  | 'toeic_rs'
  | 'other_professional'

export type FundingSource =
  | 'cpf'
  | 'opco'
  | 'self_funded_individual'
  | 'b2b_enterprise'
  | 'france_travail'
  | 'other'

export interface BpfEntry {
  id: number
  period_slug: BpfPeriodSlug
  student_name: string
  stagiaire_category: StagiaireCategory
  course_name: string
  start_date: string
  end_date: string
  hours: number
  modality: TrainingModality
  in_bpf_scope: boolean
  certification_type: CertificationType
  price_ht: number
  invoice_number: string
  funding_source: FundingSource
  funding_opco_name: string | null
  contract_reference: string | null
  trainer: string
  created_at: string
  updated_at: string
}

export interface BpfPeriod {
  slug: BpfPeriodSlug
  label: string
  startDate: string
  endDate: string
}

export const BPF_PERIODS: BpfPeriod[] = [
  {
    slug: '2026-04-01-to-2026-09-30',
    label: '01 April 2026 – 30 September 2026',
    startDate: '2026-04-01',
    endDate: '2026-09-30',
  },
  {
    slug: '2026-10-01-to-2027-09-30',
    label: '01 October 2026 – 30 September 2027',
    startDate: '2026-10-01',
    endDate: '2027-09-30',
  },
]

export type BpfSelectOption<T extends string> = {
  value: T
  label: string
  hint: string
}

export const STAGIAIRE_CATEGORY_OPTIONS: BpfSelectOption<StagiaireCategory>[] = [
  {
    value: 'particulier_propres_frais',
    label: 'Particulier à ses propres frais',
    hint: 'Most adult self-funded students, CPF users, and individuals paying their own invoice.',
  },
  {
    value: 'salarie_employeur_prive',
    label: "Salarié d'employeur privé",
    hint: 'Employee whose OPCO or employer pays (OPCO, direct B2B for staff).',
  },
  {
    value: 'personne_recherche_emploi',
    label: "Personne en recherche d'emploi",
    hint: 'Job seeker — usually when France Travail (or similar) funds the training.',
  },
  {
    value: 'autres',
    label: 'Autres',
    hint: 'Non-salaried company directors, public agents, or other cases that do not fit above.',
  },
]

export const MODALITY_OPTIONS: { value: TrainingModality; label: string }[] = [
  { value: 'in_person', label: 'In-person' },
  { value: 'distance', label: 'Distance / e-learning' },
  { value: 'blended', label: 'Blended' },
]

export const CERTIFICATION_TYPE_OPTIONS: { value: CertificationType; label: string }[] = [
  { value: 'none', label: 'None / general training' },
  { value: 'toeic_rs', label: 'TOEIC prep (RS-registered certification)' },
  { value: 'other_professional', label: 'Other professional certification' },
]

export const FUNDING_SOURCE_OPTIONS: BpfSelectOption<FundingSource>[] = [
  {
    value: 'cpf',
    label: 'CPF',
    hint: 'Cadre C funding. Cadre F: usually particulier à ses propres frais.',
  },
  {
    value: 'self_funded_individual',
    label: 'Self-funded individual',
    hint: 'Cadre C funding. Cadre F: particulier à ses propres frais.',
  },
  {
    value: 'opco',
    label: 'OPCO',
    hint: "Cadre C funding. Cadre F: usually salarié d'employeur privé.",
  },
  {
    value: 'b2b_enterprise',
    label: 'Direct B2B enterprise payment',
    hint: "Cadre C funding. Cadre F: usually salarié d'employeur privé (staff); autres if a director.",
  },
  {
    value: 'france_travail',
    label: 'France Travail',
    hint: "Cadre C funding. Cadre F: usually personne en recherche d'emploi.",
  },
  {
    value: 'other',
    label: 'Other',
    hint: 'Cadre C funding. Choose cadre F based on who the trainee is.',
  },
]

/** Typical cadre F match when funding source is selected — always check the actual trainee. */
export const SUGGESTED_STAGIAIRE_FOR_FUNDING: Partial<
  Record<FundingSource, StagiaireCategory>
> = {
  cpf: 'particulier_propres_frais',
  self_funded_individual: 'particulier_propres_frais',
  opco: 'salarie_employeur_prive',
  b2b_enterprise: 'salarie_employeur_prive',
  france_travail: 'personne_recherche_emploi',
}

export function optionSelectLabel<T extends string>(option: BpfSelectOption<T>): string {
  return `${option.label} — ${option.hint}`
}

export function hintForStagiaireCategory(value: StagiaireCategory): string {
  return STAGIAIRE_CATEGORY_OPTIONS.find((option) => option.value === value)?.hint ?? ''
}

export function hintForFundingSource(value: FundingSource): string {
  return FUNDING_SOURCE_OPTIONS.find((option) => option.value === value)?.hint ?? ''
}

export const DEFAULT_TRAINER = 'Georgina Mudditt'

export function getBpfPeriod(slug: string): BpfPeriod | undefined {
  return BPF_PERIODS.find((period) => period.slug === slug)
}

/** BPF declaration period that contains today, if any. */
export function getActiveBpfPeriod(referenceDate = new Date()): BpfPeriod | undefined {
  const isoDate = referenceDate.toISOString().slice(0, 10)
  return BPF_PERIODS.find((period) => isoDate >= period.startDate && isoDate <= period.endDate)
}

/** Teacher admin page for logging NDA-covered BPF activity (current period when possible). */
export function bpfNdaActivityLogHref(referenceDate = new Date()): string {
  const active = getActiveBpfPeriod(referenceDate)
  if (active) {
    return `/teacher/admin/nda-covered-activity/${active.slug}`
  }
  return '/teacher/admin/nda-covered-activity'
}

export function isBpfPeriodSlug(slug: string): slug is BpfPeriodSlug {
  return BPF_PERIODS.some((period) => period.slug === slug)
}

export function labelForStagiaireCategory(value: StagiaireCategory): string {
  return STAGIAIRE_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ?? value
}

export function labelForModality(value: TrainingModality): string {
  return MODALITY_OPTIONS.find((option) => option.value === value)?.label ?? value
}

export function labelForCertificationType(value: CertificationType): string {
  return CERTIFICATION_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value
}

export function labelForFundingSource(value: FundingSource): string {
  return FUNDING_SOURCE_OPTIONS.find((option) => option.value === value)?.label ?? value
}

export type BpfEntryDraft = Omit<BpfEntry, 'id' | 'created_at' | 'updated_at'>

export function emptyBpfEntryDraft(periodSlug: BpfPeriodSlug): BpfEntryDraft {
  return {
    period_slug: periodSlug,
    student_name: '',
    stagiaire_category: 'particulier_propres_frais',
    course_name: '',
    start_date: '',
    end_date: '',
    hours: 0,
    modality: 'in_person',
    in_bpf_scope: true,
    certification_type: 'none',
    price_ht: 0,
    invoice_number: '',
    funding_source: 'self_funded_individual',
    funding_opco_name: null,
    contract_reference: null,
    trainer: DEFAULT_TRAINER,
  }
}

export function bpfEntryToDraft(entry: BpfEntry): BpfEntryDraft {
  const { id: _id, created_at: _created, updated_at: _updated, ...draft } = entry
  return draft
}

const STAGIAIRE_SET = new Set(STAGIAIRE_CATEGORY_OPTIONS.map((o) => o.value))
const MODALITY_SET = new Set(MODALITY_OPTIONS.map((o) => o.value))
const CERT_SET = new Set(CERTIFICATION_TYPE_OPTIONS.map((o) => o.value))
const FUNDING_SET = new Set(FUNDING_SOURCE_OPTIONS.map((o) => o.value))

export function parseBpfEntryBody(
  body: unknown,
  periodSlug: BpfPeriodSlug
): { data?: BpfEntryDraft; error?: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'Invalid request body' }
  }

  const raw = body as Record<string, unknown>
  const studentName = typeof raw.student_name === 'string' ? raw.student_name.trim() : ''
  const courseName = typeof raw.course_name === 'string' ? raw.course_name.trim() : ''
  const startDate = typeof raw.start_date === 'string' ? raw.start_date.trim() : ''
  const endDate = typeof raw.end_date === 'string' ? raw.end_date.trim() : ''
  const invoiceNumber = typeof raw.invoice_number === 'string' ? raw.invoice_number.trim() : ''
  const trainer = typeof raw.trainer === 'string' ? raw.trainer.trim() : DEFAULT_TRAINER
  const contractReference =
    typeof raw.contract_reference === 'string' && raw.contract_reference.trim()
      ? raw.contract_reference.trim()
      : null
  const fundingOpcoName =
    typeof raw.funding_opco_name === 'string' && raw.funding_opco_name.trim()
      ? raw.funding_opco_name.trim()
      : null

  if (!studentName) return { error: 'Student name is required' }
  if (!courseName) return { error: 'Course name is required' }
  if (!startDate) return { error: 'Start date is required' }
  if (!endDate) return { error: 'End date is required' }
  if (!invoiceNumber) return { error: 'Invoice number is required' }

  const hours = Number(raw.hours)
  const priceHt = Number(raw.price_ht)
  if (!Number.isFinite(hours) || hours <= 0) return { error: 'Hours must be greater than 0' }
  if (!Number.isFinite(priceHt) || priceHt < 0) return { error: 'Price (HT) must be 0 or greater' }

  const stagiaireCategory = raw.stagiaire_category
  if (typeof stagiaireCategory !== 'string' || !STAGIAIRE_SET.has(stagiaireCategory as StagiaireCategory)) {
    return { error: 'Invalid stagiaire category' }
  }

  const modality = raw.modality
  if (typeof modality !== 'string' || !MODALITY_SET.has(modality as TrainingModality)) {
    return { error: 'Invalid modality' }
  }

  const certificationType = raw.certification_type
  if (typeof certificationType !== 'string' || !CERT_SET.has(certificationType as CertificationType)) {
    return { error: 'Invalid certification type' }
  }

  const fundingSource = raw.funding_source
  if (typeof fundingSource !== 'string' || !FUNDING_SET.has(fundingSource as FundingSource)) {
    return { error: 'Invalid funding source' }
  }

  if (fundingSource === 'opco' && !fundingOpcoName) {
    return { error: 'OPCO name is required when funding source is OPCO' }
  }

  return {
    data: {
      period_slug: periodSlug,
      student_name: studentName,
      stagiaire_category: stagiaireCategory as StagiaireCategory,
      course_name: courseName,
      start_date: startDate,
      end_date: endDate,
      hours,
      modality: modality as TrainingModality,
      in_bpf_scope: true,
      certification_type: certificationType as CertificationType,
      price_ht: priceHt,
      invoice_number: invoiceNumber,
      funding_source: fundingSource as FundingSource,
      funding_opco_name: fundingOpcoName,
      contract_reference: contractReference,
      trainer: trainer || DEFAULT_TRAINER,
    },
  }
}
