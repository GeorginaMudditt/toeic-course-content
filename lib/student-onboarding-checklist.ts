import { bpfNdaActivityLogHref } from '@/lib/bpf'
import { qualiopiDocumentHref } from '@/lib/qualiopi-documents'

export const ONBOARDING_CHECKLIST_STATUS_VALUES = [
  'PENDING',
  'COMPLETED',
  'NOT_APPLICABLE',
] as const

export type OnboardingChecklistStatus = (typeof ONBOARDING_CHECKLIST_STATUS_VALUES)[number]

export const ONBOARDING_CHECKLIST_ITEM_TYPES = [
  'student-document',
  'language-assessment',
  'convention-contract',
  'pdf-workflow-document',
  'template-pick-upload',
  'dual-document-or-na',
  'complete-or-na',
] as const

export type OnboardingChecklistItemType = (typeof ONBOARDING_CHECKLIST_ITEM_TYPES)[number]

export type ChecklistDocumentSlot = {
  key: string
  documentTitle: string
  label: string
}

export type ChecklistTemplatePickOption = {
  key: string
  label: string
}

export type TemplateWorkflowState = {
  templateDownloadedAt?: string | null
  templateVariant?: string | null
  templateVariantLabel?: string | null
  formPreparedAt?: string | null
  selectedVariant?: string | null
  selectedVariantLabel?: string | null
}

/** @deprecated Use TemplateWorkflowState */
export type LanguageAssessmentWorkflowState = TemplateWorkflowState

export type OnboardingChecklistItemDefinition = {
  slug: string
  label: string
  type: OnboardingChecklistItemType
  /** Title shown on the student's My Docs page (document-linked items). */
  documentTitle?: string
  /** MIME types allowed for upload (document-linked items). */
  allowedMimeTypes?: string[]
  /** Multiple My Docs uploads before the item is complete (dual-document-or-na only). */
  documentSlots?: ChecklistDocumentSlot[]
  /** Show N/A (complete-or-na items only). Defaults to true. */
  allowNotApplicable?: boolean
  /** Mark complete + note only — no optional file upload (complete-or-na items only). */
  completeNoteOnly?: boolean
  /** Links to admin / Qualiopi tools or external forms (complete-or-na items only). */
  externalLinks?: (
    | {
        label: string
        /** Built-in route key — resolved at render time. */
        route: 'bpf-nda-activity' | 'qualiopi-indicator-2' | 'qualiopi-indicator-32'
      }
    | {
        label: string
        href: string
      }
  )[]
  /** Pre-stored PDF options to publish (template-pick-upload only). */
  templatePickOptions?: ChecklistTemplatePickOption[]
}

export function isDocumentLinkedChecklistType(type: OnboardingChecklistItemType): boolean {
  return (
    type === 'student-document' ||
    type === 'language-assessment' ||
    type === 'convention-contract' ||
    type === 'pdf-workflow-document' ||
    type === 'template-pick-upload'
  )
}

export function isTemplateWorkflowType(type: OnboardingChecklistItemType): boolean {
  return (
    type === 'language-assessment' ||
    type === 'convention-contract' ||
    type === 'pdf-workflow-document'
  )
}

export function isTemplatePickUploadType(type: OnboardingChecklistItemType): boolean {
  return type === 'template-pick-upload'
}

export function usesChecklistWorkflowState(type: OnboardingChecklistItemType): boolean {
  return isTemplateWorkflowType(type) || isTemplatePickUploadType(type)
}

export function isDualDocumentOrNaType(type: OnboardingChecklistItemType): boolean {
  return type === 'dual-document-or-na'
}

export function getLinkedDocumentMapKey(slug: string, slotKey?: string): string {
  return slotKey ? `${slug}::${slotKey}` : slug
}

export function getDocumentSlotForTitle(
  item: OnboardingChecklistItemDefinition,
  title: string
): ChecklistDocumentSlot | undefined {
  return item.documentSlots?.find((slot) => slot.documentTitle === title)
}

export function parseTemplateWorkflowState(value: unknown): TemplateWorkflowState {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const record = value as Record<string, unknown>
  return {
    templateDownloadedAt:
      typeof record.templateDownloadedAt === 'string' ? record.templateDownloadedAt : null,
    templateVariant: typeof record.templateVariant === 'string' ? record.templateVariant : null,
    templateVariantLabel:
      typeof record.templateVariantLabel === 'string' ? record.templateVariantLabel : null,
    formPreparedAt: typeof record.formPreparedAt === 'string' ? record.formPreparedAt : null,
    selectedVariant: typeof record.selectedVariant === 'string' ? record.selectedVariant : null,
    selectedVariantLabel:
      typeof record.selectedVariantLabel === 'string' ? record.selectedVariantLabel : null,
  }
}

export function parseLanguageAssessmentWorkflowState(value: unknown): TemplateWorkflowState {
  return parseTemplateWorkflowState(value)
}

function resolveChecklistExternalLinkRoute(
  route: Extract<
    NonNullable<OnboardingChecklistItemDefinition['externalLinks']>[number],
    { route: string }
  >['route']
): string {
  switch (route) {
    case 'bpf-nda-activity':
      return bpfNdaActivityLogHref()
    case 'qualiopi-indicator-2':
      return qualiopiDocumentHref('indicator-2')
    case 'qualiopi-indicator-32':
      return qualiopiDocumentHref('indicator-32')
  }
}

export function resolveChecklistExternalLinks(
  item: Pick<OnboardingChecklistItemDefinition, 'externalLinks'>
): { href: string; label: string; external: boolean }[] {
  if (!item.externalLinks?.length) {
    return []
  }

  return item.externalLinks.map((link) => {
    if ('href' in link) {
      return { href: link.href, label: link.label, external: true }
    }

    return {
      href: resolveChecklistExternalLinkRoute(link.route),
      label: link.label,
      external: false,
    }
  })
}

export const STUDENT_ONBOARDING_CHECKLIST_ITEMS: OnboardingChecklistItemDefinition[] = [
  {
    slug: 'course-description-pdf',
    label: 'Course Description (PDF)',
    type: 'student-document',
    documentTitle: 'Course Description',
    allowedMimeTypes: ['application/pdf'],
  },
  {
    slug: 'student-needs-analysis-form',
    label: 'Student Needs Analysis Form (Tally Forms)',
    type: 'student-document',
    documentTitle: 'Student Needs Analysis Form',
    allowedMimeTypes: ['application/pdf'],
  },
  {
    slug: 'introductory-meeting',
    label: 'Introductory Meeting',
    type: 'complete-or-na',
  },
  {
    slug: 'language-assessment',
    label: 'Language Assessment (recent certificate / pre-enrollment assessment)',
    type: 'language-assessment',
    documentTitle: 'Language Assessment',
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'],
  },
  {
    slug: 'student-support-adaptations',
    label: 'Student Support / Proposed Adaptations',
    type: 'dual-document-or-na',
    allowedMimeTypes: ['application/pdf'],
    documentSlots: [
      {
        key: 'student-support',
        documentTitle: 'Student Support',
        label: 'Student Support document',
      },
      {
        key: 'proposed-adaptations',
        documentTitle: 'Proposed Adaptations',
        label: 'Proposed Adaptations document',
      },
    ],
  },
  {
    slug: 'convention-contract',
    label: 'Convention / Contract',
    type: 'convention-contract',
    documentTitle: 'Convention / Contract',
    allowedMimeTypes: ['application/pdf'],
  },
  {
    slug: 'cgv-reglement-interieur',
    label: 'Conditions Générales de Vente (CGV) et Règlement Intérieur',
    type: 'pdf-workflow-document',
    documentTitle: 'CGV et Règlement Intérieur',
    allowedMimeTypes: ['application/pdf'],
  },
  {
    slug: 'welcome-booklet',
    label: 'Welcome booklet',
    type: 'template-pick-upload',
    documentTitle: 'Welcome booklet',
    templatePickOptions: [
      { key: 'online', label: 'Online Student' },
      { key: 'online-toeic', label: 'Online Student (TOEIC)' },
      { key: 'inperson', label: 'In-person Student' },
      { key: 'inperson-toeic', label: 'In-person Student (TOEIC)' },
    ],
  },
  {
    slug: 'setup-e-learning-platform',
    label: 'Set up on E-Learning Platform',
    type: 'complete-or-na',
    allowNotApplicable: false,
    completeNoteOnly: true,
  },
  {
    slug: 'issue-lesson-booking-code',
    label: 'Issue code to book lessons',
    type: 'complete-or-na',
    allowNotApplicable: false,
    completeNoteOnly: true,
  },
  {
    slug: 'toeic-elearning-mobile-app',
    label: 'Access to TOEIC E-Learning and mobile app',
    type: 'complete-or-na',
    completeNoteOnly: true,
  },
  {
    slug: 'midpoint-review',
    label: 'Midpoint Review (Tally Forms)',
    type: 'student-document',
    documentTitle: 'Midpoint Review',
    allowedMimeTypes: ['application/pdf'],
  },
  {
    slug: 'end-of-course-assessment',
    label: 'End-of-course assessment against objectives',
    type: 'convention-contract',
    documentTitle: 'End-of-course assessment against objectives',
    allowedMimeTypes: ['application/pdf'],
  },
  {
    slug: 'book-toeic-exam',
    label: 'Book TOEIC exam',
    type: 'complete-or-na',
    completeNoteOnly: true,
  },
  {
    slug: 'end-of-course-certificate',
    label: 'End-of-course certificate',
    type: 'convention-contract',
    documentTitle: 'End-of-course certificate',
    allowedMimeTypes: ['application/pdf'],
  },
  {
    slug: 'log-nda-bpf-activity',
    label: 'Log NDA-related activity for BPF',
    type: 'complete-or-na',
    completeNoteOnly: true,
    externalLinks: [
      {
        label: 'Open BPF activity log',
        route: 'bpf-nda-activity',
      },
    ],
  },
  {
    slug: 'student-satisfaction-survey',
    label: 'Student Satisfaction Survey',
    type: 'complete-or-na',
    externalLinks: [
      {
        label: 'Student satisfaction indicators',
        route: 'qualiopi-indicator-2',
      },
      {
        label: 'Continuous improvement suggestions',
        route: 'qualiopi-indicator-32',
      },
    ],
  },
  {
    slug: 'employer-financer-satisfaction-survey',
    label: 'Employer/Financer Satisfaction Survey',
    type: 'complete-or-na',
  },
  {
    slug: 'trainer-satisfaction-survey',
    label: 'Trainer Satisfaction Survey',
    type: 'complete-or-na',
    externalLinks: [
      {
        label: 'Complete',
        href: 'https://tally.so/r/aQzljE',
      },
    ],
  },
  {
    slug: 'three-month-follow-up',
    label: '3-month follow up (reminder set)',
    type: 'complete-or-na',
  },
]

export function getChecklistItemDefinition(slug: string): OnboardingChecklistItemDefinition | undefined {
  return STUDENT_ONBOARDING_CHECKLIST_ITEMS.find((item) => item.slug === slug)
}

export function isValidOnboardingChecklistSlug(slug: string): boolean {
  return STUDENT_ONBOARDING_CHECKLIST_ITEMS.some((item) => item.slug === slug)
}

export function isValidOnboardingChecklistStatus(
  value: string
): value is OnboardingChecklistStatus {
  return (ONBOARDING_CHECKLIST_STATUS_VALUES as readonly string[]).includes(value)
}

export type OnboardingChecklistItemRecord = {
  id: string
  studentId: string
  itemSlug: string
  status: OnboardingChecklistStatus
  note: string | null
  fileName: string | null
  filePath: string | null
  fileUrl: string | null
  fileSize: number | null
  mimeType: string | null
  completedAt: string | null
  workflowState?: TemplateWorkflowState | null
  updatedAt: string
}

export type LinkedStudentDocument = {
  id: string
  fileName: string
  fileUrl: string
  createdAt: string
  studentNote: string | null
}

export type OnboardingChecklistItemView = OnboardingChecklistItemDefinition & {
  status: OnboardingChecklistStatus
  note: string | null
  fileName: string | null
  fileUrl: string | null
  completedAt: string | null
  linkedDocument: LinkedStudentDocument | null
  linkedDocumentsBySlot: Record<string, LinkedStudentDocument>
  workflowState: TemplateWorkflowState | null
}

export function mergeChecklistWithRecords(
  records: OnboardingChecklistItemRecord[],
  linkedDocuments: Map<string, LinkedStudentDocument> = new Map()
): OnboardingChecklistItemView[] {
  const bySlug = new Map(records.map((record) => [record.itemSlug, record]))

  return STUDENT_ONBOARDING_CHECKLIST_ITEMS.map((item) => {
    const record = bySlug.get(item.slug)

    if (isDualDocumentOrNaType(item.type)) {
      const slots = item.documentSlots ?? []
      const linkedDocumentsBySlot: Record<string, LinkedStudentDocument> = {}

      for (const slot of slots) {
        const linked = linkedDocuments.get(getLinkedDocumentMapKey(item.slug, slot.key))
        if (linked) {
          linkedDocumentsBySlot[slot.key] = linked
        }
      }

      const uploadedCount = Object.keys(linkedDocumentsBySlot).length
      const allUploaded = slots.length > 0 && uploadedCount === slots.length
      const isNotApplicable = record?.status === 'NOT_APPLICABLE'

      let completedAt: string | null = null
      if (allUploaded) {
        const dates = Object.values(linkedDocumentsBySlot).map((doc) => doc.createdAt)
        completedAt = dates.sort().at(-1) ?? null
      }

      return {
        ...item,
        status: isNotApplicable ? 'NOT_APPLICABLE' : allUploaded ? 'COMPLETED' : 'PENDING',
        note: null,
        fileName: null,
        fileUrl: null,
        completedAt: isNotApplicable ? record?.completedAt ?? null : completedAt,
        linkedDocument: null,
        linkedDocumentsBySlot,
        workflowState: null,
      }
    }

    const linkedDocument = linkedDocuments.get(item.slug) ?? null

    if (isDocumentLinkedChecklistType(item.type)) {
      const uploaded = linkedDocument !== null
      const workflowState = usesChecklistWorkflowState(item.type)
        ? parseTemplateWorkflowState(record?.workflowState)
        : null

      return {
        ...item,
        status: uploaded ? 'COMPLETED' : 'PENDING',
        note: linkedDocument?.studentNote ?? null,
        fileName: linkedDocument?.fileName ?? null,
        fileUrl: linkedDocument?.fileUrl ?? null,
        completedAt: linkedDocument?.createdAt ?? null,
        linkedDocument,
        linkedDocumentsBySlot: {},
        workflowState,
      }
    }

    return {
      ...item,
      status: record?.status ?? 'PENDING',
      note: record?.note ?? null,
      fileName: record?.fileName ?? null,
      fileUrl: record?.fileUrl ?? null,
      completedAt: record?.completedAt ?? null,
      linkedDocument: null,
      linkedDocumentsBySlot: {},
      workflowState: null,
    }
  })
}
