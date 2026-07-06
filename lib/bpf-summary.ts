import type {
  BpfEntry,
  CertificationType,
  FundingSource,
  StagiaireCategory,
  TrainingModality,
} from '@/lib/bpf'
import {
  CERTIFICATION_TYPE_OPTIONS,
  FUNDING_SOURCE_OPTIONS,
  labelForCertificationType,
  labelForFundingSource,
  labelForModality,
  labelForStagiaireCategory,
  MODALITY_OPTIONS,
  STAGIAIRE_CATEGORY_OPTIONS,
} from '@/lib/bpf'

export interface BpfSummaryRow {
  key: string
  label: string
  actions: number
  hours: number
  revenueHt: number
}

export interface BpfPeriodSummary {
  actions: number
  hours: number
  revenueHt: number
  byFundingSource: BpfSummaryRow[]
  byStagiaireCategory: BpfSummaryRow[]
  byModality: BpfSummaryRow[]
  byCertificationType: BpfSummaryRow[]
  byTrainer: BpfSummaryRow[]
}

function groupSummary<T extends string>(
  entries: BpfEntry[],
  keys: { value: T; label: string }[],
  getKey: (entry: BpfEntry) => T
): BpfSummaryRow[] {
  const totals = new Map<T, BpfSummaryRow>()

  for (const option of keys) {
    totals.set(option.value, {
      key: option.value,
      label: option.label,
      actions: 0,
      hours: 0,
      revenueHt: 0,
    })
  }

  for (const entry of entries) {
    const key = getKey(entry)
    const row = totals.get(key)
    if (!row) continue
    row.actions += 1
    row.hours += Number(entry.hours)
    row.revenueHt += Number(entry.price_ht)
  }

  return [...totals.values()].filter((row) => row.actions > 0)
}

function groupSummaryFreeform(
  entries: BpfEntry[],
  getKey: (entry: BpfEntry) => string,
  getLabel: (key: string) => string
): BpfSummaryRow[] {
  const totals = new Map<string, BpfSummaryRow>()

  for (const entry of entries) {
    const key = getKey(entry)
    const existing = totals.get(key) ?? {
      key,
      label: getLabel(key),
      actions: 0,
      hours: 0,
      revenueHt: 0,
    }
    existing.actions += 1
    existing.hours += Number(entry.hours)
    existing.revenueHt += Number(entry.price_ht)
    totals.set(key, existing)
  }

  return [...totals.values()].sort((a, b) => a.label.localeCompare(b.label))
}

export function computeBpfPeriodSummary(entries: BpfEntry[]): BpfPeriodSummary {
  const scoped = entries.filter((entry) => entry.in_bpf_scope)

  return {
    actions: scoped.length,
    hours: scoped.reduce((sum, entry) => sum + Number(entry.hours), 0),
    revenueHt: scoped.reduce((sum, entry) => sum + Number(entry.price_ht), 0),
    byFundingSource: groupSummary(scoped, FUNDING_SOURCE_OPTIONS, (e) => e.funding_source),
    byStagiaireCategory: groupSummary(
      scoped,
      STAGIAIRE_CATEGORY_OPTIONS,
      (e) => e.stagiaire_category
    ),
    byModality: groupSummary(scoped, MODALITY_OPTIONS, (e) => e.modality),
    byCertificationType: groupSummary(
      scoped,
      CERTIFICATION_TYPE_OPTIONS,
      (e) => e.certification_type
    ),
    byTrainer: groupSummaryFreeform(
      scoped,
      (e) => e.trainer.trim() || 'Unknown',
      (key) => key
    ),
  }
}

function csvCell(value: string | number | boolean): string {
  const text = String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function summarySection(title: string, rows: BpfSummaryRow[]): string[] {
  const lines = [title, 'Category,Actions,Hours,Revenue HT (€)']
  for (const row of rows) {
    lines.push(
      [row.label, row.actions, row.hours.toFixed(2), row.revenueHt.toFixed(2)]
        .map(csvCell)
        .join(',')
    )
  }
  return lines
}

export function buildBpfCsv(periodLabel: string, entries: BpfEntry[]): string {
  const summary = computeBpfPeriodSummary(entries)
  const lines: string[] = [
    `BPF period,${csvCell(periodLabel)}`,
    '',
    'DETAIL ROWS',
    [
      'Student name',
      'Stagiaire category (cadre F)',
      'Course name',
      'Start date',
      'End date',
      'Hours',
      'Modality',
      'Certification type',
      'Price HT (€)',
      'Invoice number',
      'Funding source (cadre C)',
      'OPCO name',
      'Contract reference',
      'Trainer',
    ].join(','),
  ]

  for (const entry of entries) {
    lines.push(
      [
        entry.student_name,
        labelForStagiaireCategory(entry.stagiaire_category),
        entry.course_name,
        entry.start_date,
        entry.end_date,
        entry.hours,
        labelForModality(entry.modality),
        labelForCertificationType(entry.certification_type),
        entry.price_ht,
        entry.invoice_number,
        labelForFundingSource(entry.funding_source),
        entry.funding_opco_name ?? '',
        entry.contract_reference ?? '',
        entry.trainer,
      ]
        .map(csvCell)
        .join(',')
    )
  }

  lines.push('')
  lines.push('BPF SUMMARY TOTALS')
  lines.push(`Total actions,${summary.actions}`)
  lines.push(`Total hours,${summary.hours.toFixed(2)}`)
  lines.push(`Total revenue HT (€),${summary.revenueHt.toFixed(2)}`)
  lines.push('')
  lines.push(...summarySection('CADRE C — BY FUNDING SOURCE', summary.byFundingSource))
  lines.push('')
  lines.push(...summarySection('CADRE F — BY STAGIAIRE CATEGORY', summary.byStagiaireCategory))
  lines.push('')
  lines.push(...summarySection('BY MODALITY', summary.byModality))
  lines.push('')
  lines.push(...summarySection('BY CERTIFICATION TYPE', summary.byCertificationType))
  lines.push('')
  lines.push(...summarySection('CADRE G — BY TRAINER', summary.byTrainer))

  return `${lines.join('\n')}\n`
}

export function downloadBpfCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
