export const CONTACT_CATEGORIES = [
  {
    value: 'business_funded_adult',
    label: 'Business-funded adult',
    badgeClassName: 'bg-blue-100 text-blue-800',
    buttonClassName: 'border-blue-200 bg-blue-50 text-blue-800',
    activeButtonClassName: 'border-blue-700 bg-blue-700 text-white',
    fieldClassName: 'border-blue-300 bg-blue-50',
  },
  {
    value: 'cpf_funded_adult',
    label: 'CPF-funded adult',
    badgeClassName: 'bg-amber-100 text-amber-900',
    buttonClassName: 'border-amber-200 bg-amber-50 text-amber-900',
    activeButtonClassName: 'border-amber-700 bg-amber-700 text-white',
    fieldClassName: 'border-amber-300 bg-amber-50',
  },
  {
    value: 'self_funded_adult',
    label: 'Self-funded adult',
    badgeClassName: 'bg-emerald-100 text-emerald-800',
    buttonClassName: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    activeButtonClassName: 'border-emerald-700 bg-emerald-700 text-white',
    fieldClassName: 'border-emerald-300 bg-emerald-50',
  },
  {
    value: 'enquiry',
    label: 'Enquiry',
    badgeClassName: 'bg-violet-100 text-violet-800',
    buttonClassName: 'border-violet-200 bg-violet-50 text-violet-800',
    activeButtonClassName: 'border-violet-700 bg-violet-700 text-white',
    fieldClassName: 'border-violet-300 bg-violet-50',
  },
  {
    value: 'parent_of_student',
    label: 'Parent of student',
    badgeClassName: 'bg-pink-100 text-pink-800',
    buttonClassName: 'border-pink-200 bg-pink-50 text-pink-800',
    activeButtonClassName: 'border-pink-700 bg-pink-700 text-white',
    fieldClassName: 'border-pink-300 bg-pink-50',
  },
] as const

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number]['value']

export type Contact = {
  id: number
  name: string
  email: string | null
  phone: string | null
  category: ContactCategory
  notes: string | null
  created_at: string
  updated_at: string
}

export type ContactInput = {
  name: string
  email: string | null
  phone: string | null
  category: ContactCategory
  notes: string | null
}

const CATEGORY_VALUES = new Set<string>(CONTACT_CATEGORIES.map((category) => category.value))

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isContactCategory(value: string): value is ContactCategory {
  return CATEGORY_VALUES.has(value)
}

export function contactCategoryMeta(value: string) {
  return CONTACT_CATEGORIES.find((category) => category.value === value) ?? null
}

export function labelForContactCategory(value: string) {
  return contactCategoryMeta(value)?.label ?? value
}

function optionalText(value: unknown, maxLength: number, field: string) {
  if (value == null) return { value: null as string | null }
  if (typeof value !== 'string') return { error: `${field} must be text` }
  const trimmed = value.trim()
  if (!trimmed) return { value: null as string | null }
  if (trimmed.length > maxLength) return { error: `${field} must be ${maxLength} characters or fewer` }
  return { value: trimmed }
}

export function parseContactBody(body: unknown): { data?: ContactInput; error?: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'Invalid contact' }
  }

  const record = body as Record<string, unknown>
  const name = typeof record.name === 'string' ? record.name.trim() : ''
  if (!name) return { error: 'Name is required' }
  if (name.length > 200) return { error: 'Name must be 200 characters or fewer' }

  const emailResult = optionalText(record.email, 320, 'Email address')
  if (emailResult.error) return { error: emailResult.error }
  const email = emailResult.value ? emailResult.value.toLowerCase() : null
  if (email && !EMAIL_PATTERN.test(email)) return { error: 'Enter a valid email address' }

  const phoneResult = optionalText(record.phone, 50, 'Phone number')
  if (phoneResult.error) return { error: phoneResult.error }

  const category = typeof record.category === 'string' ? record.category : ''
  if (!isContactCategory(category)) return { error: 'Choose a category' }

  const notesResult = optionalText(record.notes, 5000, 'Notes')
  if (notesResult.error) return { error: notesResult.error }

  return {
    data: {
      name,
      email,
      phone: phoneResult.value ?? null,
      category,
      notes: notesResult.value ?? null,
    },
  }
}

export function contactDatabaseErrorMessage(error: { code?: string }, fallback: string) {
  if (error.code === 'PGRST205') {
    return 'The contact list is not in the database yet. Run scripts/sql/create-contacts-table.sql in the Supabase SQL editor, then reload this page.'
  }
  return fallback
}

export function contactsToCsv(contacts: Contact[]) {
  const header = ['Name', 'Email address', 'Phone number', 'Category', 'Notes']
  const lines = contacts.map((contact) =>
    [
      contact.name,
      contact.email ?? '',
      contact.phone ?? '',
      labelForContactCategory(contact.category),
      contact.notes ?? '',
    ]
      .map(csvCell)
      .join(',')
  )
  return [header.join(','), ...lines].join('\n')
}

function csvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
