'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  bpfEntryToDraft,
  CERTIFICATION_TYPE_OPTIONS,
  emptyBpfEntryDraft,
  FUNDING_SOURCE_OPTIONS,
  labelForCertificationType,
  labelForFundingSource,
  labelForModality,
  labelForStagiaireCategory,
  MODALITY_OPTIONS,
  STAGIAIRE_CATEGORY_OPTIONS,
  type BpfEntry,
  type BpfEntryDraft,
  type BpfPeriod,
} from '@/lib/bpf'

type Props = {
  period: BpfPeriod
}

function formatDate(value: string) {
  if (!value) return '—'
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value)
}

function FieldLabel({ children, required = false }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-sm font-medium text-gray-700">
      {children}
      {required ? <span className="text-red-600"> *</span> : null}
    </label>
  )
}

function SelectField<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </section>
  )
}

function BpfEntryForm({
  draft,
  onChange,
  onSubmit,
  submitLabel,
  saving,
}: {
  draft: BpfEntryDraft
  onChange: (next: BpfEntryDraft) => void
  onSubmit: () => void
  submitLabel: string
  saving: boolean
}) {
  const update = <K extends keyof BpfEntryDraft>(field: K, value: BpfEntryDraft[K]) => {
    onChange({ ...draft, [field]: value })
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Student / stagiaire identification">
        <div>
          <FieldLabel required>Student name</FieldLabel>
          <input
            type="text"
            value={draft.student_name}
            onChange={(e) => update('student_name', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
          />
        </div>
        <div>
          <FieldLabel required>Stagiaire status / category (cadre F)</FieldLabel>
          <SelectField
            value={draft.stagiaire_category}
            onChange={(value) => update('stagiaire_category', value)}
            options={STAGIAIRE_CATEGORY_OPTIONS}
          />
        </div>
      </SectionCard>

      <SectionCard title="Course / action details">
        <div>
          <FieldLabel required>Course name</FieldLabel>
          <input
            type="text"
            value={draft.course_name}
            onChange={(e) => update('course_name', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
          />
        </div>
        <div>
          <FieldLabel required>Start date</FieldLabel>
          <input
            type="date"
            value={draft.start_date}
            onChange={(e) => update('start_date', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
          />
        </div>
        <div>
          <FieldLabel required>End date</FieldLabel>
          <input
            type="date"
            value={draft.end_date}
            onChange={(e) => update('end_date', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
          />
        </div>
        <div>
          <FieldLabel required>Number of hours (delivered)</FieldLabel>
          <input
            type="number"
            min="0"
            step="0.5"
            value={draft.hours || ''}
            onChange={(e) => update('hours', Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
          />
        </div>
        <div>
          <FieldLabel required>Modality</FieldLabel>
          <SelectField
            value={draft.modality}
            onChange={(value) => update('modality', value)}
            options={MODALITY_OPTIONS}
          />
        </div>
        <div>
          <FieldLabel required>In BPF scope?</FieldLabel>
          <SelectField
            value={draft.in_bpf_scope ? 'yes' : 'no'}
            onChange={(value) => update('in_bpf_scope', value === 'yes')}
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
          />
        </div>
        <div className="md:col-span-2">
          <FieldLabel>Certification type</FieldLabel>
          <SelectField
            value={draft.certification_type}
            onChange={(value) => update('certification_type', value)}
            options={CERTIFICATION_TYPE_OPTIONS}
          />
        </div>
      </SectionCard>

      <SectionCard title="Financial / funding">
        <div>
          <FieldLabel required>Price (HT, €)</FieldLabel>
          <input
            type="number"
            min="0"
            step="0.01"
            value={draft.price_ht || ''}
            onChange={(e) => update('price_ht', Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
          />
        </div>
        <div>
          <FieldLabel required>Invoice number</FieldLabel>
          <input
            type="text"
            value={draft.invoice_number}
            onChange={(e) => update('invoice_number', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
          />
        </div>
        <div>
          <FieldLabel required>Funding source / device</FieldLabel>
          <SelectField
            value={draft.funding_source}
            onChange={(value) => update('funding_source', value)}
            options={FUNDING_SOURCE_OPTIONS}
          />
        </div>
        {draft.funding_source === 'opco' ? (
          <div>
            <FieldLabel required>OPCO name</FieldLabel>
            <input
              type="text"
              value={draft.funding_opco_name ?? ''}
              onChange={(e) => update('funding_opco_name', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
            />
          </div>
        ) : (
          <div />
        )}
        <div className="md:col-span-2">
          <FieldLabel>Contract / convention reference</FieldLabel>
          <input
            type="text"
            value={draft.contract_reference ?? ''}
            onChange={(e) => update('contract_reference', e.target.value || null)}
            placeholder="Contrat or convention de formation professionnelle number"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
          />
        </div>
      </SectionCard>

      <SectionCard title="Trainer / delivery">
        <div className="md:col-span-2">
          <FieldLabel required>Who delivered it</FieldLabel>
          <input
            type="text"
            value={draft.trainer}
            onChange={(e) => update('trainer', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
          />
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="rounded-md bg-[#38438f] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </div>
  )
}

export default function BpfEntryManager({ period }: Props) {
  const [entries, setEntries] = useState<BpfEntry[]>([])
  const [draft, setDraft] = useState<BpfEntryDraft>(() => emptyBpfEntryDraft(period.slug))
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<BpfEntryDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const scopedEntries = useMemo(
    () => entries.filter((entry) => entry.in_bpf_scope),
    [entries]
  )

  const loadEntries = useCallback(async () => {
    setError(null)
    const response = await fetch(`/api/bpf-entries?period=${encodeURIComponent(period.slug)}`)
    const data = await response.json().catch(() => [])

    if (!response.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Failed to load entries')
      return
    }

    setEntries(data as BpfEntry[])
  }, [period.slug])

  useEffect(() => {
    loadEntries().finally(() => setLoading(false))
  }, [loadEntries])

  const saveNewEntry = async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/bpf-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Failed to save entry')
      }
      setDraft(emptyBpfEntryDraft(period.slug))
      await loadEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (entry: BpfEntry) => {
    setEditingId(entry.id)
    setEditDraft(bpfEntryToDraft(entry))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft(null)
  }

  const saveEdit = async () => {
    if (!editingId || !editDraft) return
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/bpf-entries/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Failed to update entry')
      }
      cancelEdit()
      await loadEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entry')
    } finally {
      setSaving(false)
    }
  }

  const deleteEntry = async (id: number) => {
    if (!window.confirm('Delete this BPF entry?')) return
    setError(null)
    const response = await fetch(`/api/bpf-entries/${id}`, { method: 'DELETE' })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Failed to delete entry')
      return
    }
    if (editingId === id) cancelEdit()
    await loadEntries()
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Add training action</h2>
        <p className="mb-6 text-sm text-gray-600">
          Record NDA-covered activity delivered between {period.label}. Entries marked in BPF scope
          can be filtered for your May BPF declaration.
        </p>
        <BpfEntryForm
          draft={draft}
          onChange={setDraft}
          onSubmit={saveNewEntry}
          submitLabel="Save entry"
          saving={saving}
        />
      </div>

      <div>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Saved entries</h2>
            <p className="text-sm text-gray-600">
              {loading
                ? 'Loading…'
                : `${entries.length} total · ${scopedEntries.length} in BPF scope`}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading entries…</p>
        ) : entries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            No entries yet for this period.
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) =>
              editingId === entry.id && editDraft ? (
                <div key={entry.id} className="rounded-lg border border-[#38438f]/30 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 font-semibold text-gray-900">Edit entry — {entry.student_name}</h3>
                  <BpfEntryForm
                    draft={editDraft}
                    onChange={setEditDraft}
                    onSubmit={saveEdit}
                    submitLabel="Update entry"
                    saving={saving}
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      Cancel edit
                    </button>
                  </div>
                </div>
              ) : (
                <article
                  key={entry.id}
                  className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{entry.student_name}</h3>
                      <p className="text-sm text-gray-600">{entry.course_name}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          entry.in_bpf_scope
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {entry.in_bpf_scope ? 'In BPF scope' : 'Out of BPF scope'}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEdit(entry)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEntry(entry.id)}
                        className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <dt className="text-gray-500">Dates</dt>
                      <dd className="font-medium text-gray-900">
                        {formatDate(entry.start_date)} – {formatDate(entry.end_date)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Hours</dt>
                      <dd className="font-medium text-gray-900">{entry.hours}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Modality</dt>
                      <dd className="font-medium text-gray-900">{labelForModality(entry.modality)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Stagiaire category</dt>
                      <dd className="font-medium text-gray-900">
                        {labelForStagiaireCategory(entry.stagiaire_category)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Price (HT)</dt>
                      <dd className="font-medium text-gray-900">{formatMoney(entry.price_ht)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Invoice</dt>
                      <dd className="font-medium text-gray-900">{entry.invoice_number}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Funding</dt>
                      <dd className="font-medium text-gray-900">
                        {labelForFundingSource(entry.funding_source)}
                        {entry.funding_opco_name ? ` (${entry.funding_opco_name})` : ''}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Certification</dt>
                      <dd className="font-medium text-gray-900">
                        {labelForCertificationType(entry.certification_type)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Trainer</dt>
                      <dd className="font-medium text-gray-900">{entry.trainer}</dd>
                    </div>
                    {entry.contract_reference ? (
                      <div className="md:col-span-2 lg:col-span-3">
                        <dt className="text-gray-500">Contract / convention</dt>
                        <dd className="font-medium text-gray-900">{entry.contract_reference}</dd>
                      </div>
                    ) : null}
                  </dl>
                </article>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
