'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CONTACT_CATEGORIES,
  contactCategoryMeta,
  contactsToCsv,
  labelForContactCategory,
  type Contact,
  type ContactCategory,
  type ContactInput,
} from '@/lib/contacts'

type Draft = {
  name: string
  email: string
  phone: string
  category: ContactCategory | ''
  notes: string
}

const EMPTY_DRAFT: Draft = {
  name: '',
  email: '',
  phone: '',
  category: '',
  notes: '',
}

function draftFromContact(contact: Contact): Draft {
  return {
    name: contact.name,
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    category: contact.category,
    notes: contact.notes ?? '',
  }
}

function draftToPayload(draft: Draft): ContactInput {
  return {
    name: draft.name.trim(),
    email: draft.email.trim() || null,
    phone: draft.phone.trim() || null,
    category: draft.category as ContactCategory,
    notes: draft.notes.trim() || null,
  }
}

const inputClassName =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]'

export default function CentralContactList() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<ContactCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadContacts = useCallback(async () => {
    setError(null)
    const response = await fetch('/api/contacts')
    const data = await response.json().catch(() => [])
    if (!response.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Failed to load contacts')
      return
    }
    setContacts(data as Contact[])
  }, [])

  useEffect(() => {
    loadContacts().finally(() => setLoading(false))
  }, [loadContacts])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return contacts.filter((contact) => {
      if (categoryFilter !== 'all' && contact.category !== categoryFilter) return false
      if (!query) return true
      const haystack = [contact.name, contact.email, contact.phone, contact.notes, labelForContactCategory(contact.category)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [contacts, categoryFilter, search])

  const openAdd = () => {
    setEditingId(null)
    setDraft(EMPTY_DRAFT)
    setFormOpen(true)
    setNotice(null)
    setError(null)
  }

  const openEdit = (contact: Contact) => {
    setEditingId(contact.id)
    setDraft(draftFromContact(contact))
    setFormOpen(true)
    setNotice(null)
    setError(null)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setDraft(EMPTY_DRAFT)
  }

  const saveContact = async () => {
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(editingId == null ? '/api/contacts' : `/api/contacts/${editingId}`, {
        method: editingId == null ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftToPayload(draft)),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Failed to save contact')
        return
      }
      await loadContacts()
      closeForm()
      setNotice(editingId == null ? 'Contact added.' : 'Contact updated.')
    } catch {
      setError('Failed to save contact')
    } finally {
      setSaving(false)
    }
  }

  const deleteContact = async (contact: Contact) => {
    if (!window.confirm(`Delete ${contact.name}? This cannot be undone.`)) return
    setDeletingId(contact.id)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Failed to delete contact')
        return
      }
      if (editingId === contact.id) closeForm()
      await loadContacts()
      setNotice('Contact deleted.')
    } catch {
      setError('Failed to delete contact')
    } finally {
      setDeletingId(null)
    }
  }

  const copyEmails = async () => {
    const emails = filtered.map((contact) => contact.email).filter((email): email is string => Boolean(email))
    const missing = filtered.length - emails.length
    if (!emails.length) {
      setError('None of the contacts in this view have an email address.')
      setNotice(null)
      return
    }
    try {
      await navigator.clipboard.writeText(emails.join(', '))
      setError(null)
      setNotice(
        missing
          ? `Copied ${emails.length} email address${emails.length === 1 ? '' : 'es'}. ${missing} contact${missing === 1 ? '' : 's'} had no email.`
          : `Copied ${emails.length} email address${emails.length === 1 ? '' : 'es'}.`
      )
    } catch {
      setError('Could not copy email addresses.')
    }
  }

  const downloadCsv = () => {
    if (!filtered.length) {
      setError('There are no contacts in this view to export.')
      setNotice(null)
      return
    }
    const csv = contactsToCsv(filtered)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'brizzle-contacts.csv'
    link.click()
    URL.revokeObjectURL(url)
    setError(null)
    setNotice(`Downloaded ${filtered.length} contact${filtered.length === 1 ? '' : 's'}.`)
  }

  const selectedCategory = contactCategoryMeta(draft.category)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          {loading
            ? 'Loading contacts…'
            : `${filtered.length} shown of ${contacts.length} contact${contacts.length === 1 ? '' : 's'}`}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyEmails}
            disabled={loading || filtered.length === 0}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Copy email addresses
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={loading || filtered.length === 0}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download CSV
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-md bg-[#38438f] px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#2d3574]"
          >
            Add contact
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}
      {notice ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}

      {formOpen ? (
        <form
          className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault()
            void saveContact()
          }}
        >
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {editingId == null ? 'Add contact' : 'Edit contact'}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="contact-name">
                Name <span className="text-red-600">*</span>
              </label>
              <input
                id="contact-name"
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                className={inputClassName}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="contact-category">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                id="contact-category"
                value={draft.category}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    category: event.target.value as ContactCategory | '',
                  }))
                }
                className={`${inputClassName} ${selectedCategory?.fieldClassName ?? ''}`}
                required
              >
                <option value="">Choose a category</option>
                {CONTACT_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="contact-email">
                Email address
              </label>
              <input
                id="contact-email"
                type="email"
                value={draft.email}
                onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="contact-phone">
                Phone number
              </label>
              <input
                id="contact-phone"
                type="tel"
                value={draft.phone}
                onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                className={inputClassName}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="contact-notes">
                Notes
              </label>
              <textarea
                id="contact-notes"
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                rows={3}
                className={inputClassName}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-[#38438f] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#2d3574] disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingId == null ? 'Save contact' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterButton active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>
              All
            </FilterButton>
            {CONTACT_CATEGORIES.map((category) => (
              <FilterButton
                key={category.value}
                active={categoryFilter === category.value}
                onClick={() => setCategoryFilter(category.value)}
                idleClassName={category.buttonClassName}
                activeClassName={category.activeButtonClassName}
              >
                {category.label}
              </FilterButton>
            ))}
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, phone, or notes"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f] lg:max-w-xs"
            aria-label="Search contacts"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email address</th>
                <th className="px-3 py-2">Phone number</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Notes</th>
                <th className="px-3 py-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                    Loading contacts…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                    {contacts.length === 0
                      ? 'No contacts yet. Add the first one to start the list.'
                      : 'No contacts match this filter.'}
                  </td>
                </tr>
              ) : (
                filtered.map((contact) => {
                  const category = contactCategoryMeta(contact.category)
                  return (
                    <tr key={contact.id} className="align-top">
                      <td className="px-3 py-3 font-medium text-gray-900">{contact.name}</td>
                      <td className="px-3 py-3 text-gray-700">{contact.email || '—'}</td>
                      <td className="px-3 py-3 text-gray-700">{contact.phone || '—'}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${category?.badgeClassName ?? 'bg-gray-100 text-gray-700'}`}
                        >
                          {labelForContactCategory(contact.category)}
                        </span>
                      </td>
                      <td className="max-w-xs whitespace-pre-wrap px-3 py-3 text-gray-700">
                        {contact.notes || '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(contact)}
                          className="font-medium text-[#38438f] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteContact(contact)}
                          disabled={deletingId === contact.id}
                          className="ml-3 font-medium text-red-700 hover:underline disabled:opacity-50"
                        >
                          {deletingId === contact.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
  idleClassName = 'border-gray-200 bg-white text-gray-700',
  activeClassName = 'border-[#38438f] bg-[#38438f] text-white',
}: {
  active: boolean
  onClick: () => void
  children: string
  idleClassName?: string
  activeClassName?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium ${active ? activeClassName : idleClassName}`}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}
