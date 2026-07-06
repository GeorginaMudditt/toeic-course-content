'use client'

import {
  computeBpfPeriodSummary,
  downloadBpfCsv,
  buildBpfCsv,
  type BpfSummaryRow,
} from '@/lib/bpf-summary'
import type { BpfEntry, BpfPeriod } from '@/lib/bpf'

type Props = {
  period: BpfPeriod
  entries: BpfEntry[]
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value)
}

function SummaryTable({
  title,
  subtitle,
  rows,
}: {
  title: string
  subtitle?: string
  rows: BpfSummaryRow[]
}) {
  if (rows.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="py-2 pr-4 font-medium">Category</th>
              <th className="py-2 pr-4 font-medium">Actions</th>
              <th className="py-2 pr-4 font-medium">Hours</th>
              <th className="py-2 font-medium">Revenue HT</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-gray-100 last:border-0">
                <td className="py-2 pr-4 text-gray-900">{row.label}</td>
                <td className="py-2 pr-4 text-gray-700">{row.actions}</td>
                <td className="py-2 pr-4 text-gray-700">{row.hours.toFixed(1)}</td>
                <td className="py-2 text-gray-700">{formatMoney(row.revenueHt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function BpfSummaryPanel({ period, entries }: Props) {
  const summary = computeBpfPeriodSummary(entries)

  const exportCsv = () => {
    const csv = buildBpfCsv(period.label, entries)
    const safeSlug = period.slug.replace(/[^a-z0-9-]+/gi, '-')
    downloadBpfCsv(`bpf-${safeSlug}.csv`, csv)
  }

  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-emerald-900">BPF summary totals</h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Roll-ups for your May BPF declaration. Enter NDA-covered actions below during the year;
            use these totals when completing cadres C, F, and G.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={entries.length === 0}
          className="rounded-md border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-emerald-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Actions</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary.actions}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total hours</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary.hours.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Revenue HT</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatMoney(summary.revenueHt)}</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-600">Add entries below to see BPF roll-up totals here.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SummaryTable
            title="Cadre C — funding source"
            subtitle="Revenue HT by how the training was funded"
            rows={summary.byFundingSource}
          />
          <SummaryTable
            title="Cadre F — stagiaire category"
            subtitle="Actions and hours by trainee status"
            rows={summary.byStagiaireCategory}
          />
          <SummaryTable
            title="Modality"
            subtitle="Hours by in-person, distance, or blended"
            rows={summary.byModality}
          />
          <SummaryTable
            title="Certification type"
            subtitle="Separate RS / certification prep from general training"
            rows={summary.byCertificationType}
          />
          <SummaryTable
            title="Cadre G — trainer"
            subtitle="Hours delivered by each trainer"
            rows={summary.byTrainer}
          />
        </div>
      )}
    </section>
  )
}
