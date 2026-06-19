export type OnboardingTemplateVariant = {
  key: string
  label: string
  googleDocumentId: string
  downloadFileName?: string
}

export const ONBOARDING_TEMPLATE_SETS: Record<string, { variants: OnboardingTemplateVariant[] }> = {
  'language-assessment': {
    variants: [
      {
        key: 'default',
        label: 'Pre-enrollment Language Assessment',
        googleDocumentId: '11ApbHFR-PKHcvo7GtfpDbO1Dqinm2NDQ93hA7SIRBsM',
        downloadFileName: 'Pre-enrollment Language Assessment.docx',
      },
    ],
  },
  'convention-contract': {
    variants: [
      {
        key: 'convention',
        label: 'Convention',
        googleDocumentId: '1rjCcTtljHQJZdzNTxH1wHv2yFJShEeTVV_3SYlQYIpg',
        downloadFileName: 'Convention.docx',
      },
      {
        key: 'contract',
        label: 'Contract',
        googleDocumentId: '1rEpd6PMPzoqDSjazAY6u_CUtJLgv_84Xn5YrNrOJvoE',
        downloadFileName: 'Contract.docx',
      },
    ],
  },
  'end-of-course-certificate': {
    variants: [
      {
        key: 'default',
        label: 'End-of-course certificate',
        googleDocumentId: '19hhYXTJ8r-G8KRNahZ5RUMKBl4wHg3AK',
        downloadFileName: 'End-of-course certificate.docx',
      },
    ],
  },
}

export type OnboardingTemplateSlug = keyof typeof ONBOARDING_TEMPLATE_SETS

export function isValidOnboardingTemplateSlug(slug: string): slug is OnboardingTemplateSlug {
  return slug in ONBOARDING_TEMPLATE_SETS
}

export function listOnboardingTemplateVariants(slug: string): OnboardingTemplateVariant[] {
  if (!isValidOnboardingTemplateSlug(slug)) {
    return []
  }
  return ONBOARDING_TEMPLATE_SETS[slug].variants
}

export function getOnboardingTemplateVariant(slug: string, variantKey: string) {
  return listOnboardingTemplateVariants(slug).find((variant) => variant.key === variantKey)
}

export function getGoogleDocCopyUrl(documentId: string): string {
  return `https://docs.google.com/document/d/${documentId}/copy`
}

export function getGoogleDocDocxExportUrl(documentId: string): string {
  return `https://docs.google.com/document/d/${documentId}/export?format=docx`
}

export function getOnboardingTemplateUrls(slug: string, variantKey: string) {
  const variant = getOnboardingTemplateVariant(slug, variantKey)
  if (!variant) {
    return null
  }

  return {
    copyUrl: getGoogleDocCopyUrl(variant.googleDocumentId),
    downloadUrl: getGoogleDocDocxExportUrl(variant.googleDocumentId),
    fileName: variant.downloadFileName ?? `${variant.label}.docx`,
    label: variant.label,
    variantKey: variant.key,
  }
}

export type OnboardingPdfDownload = {
  /** Supabase Storage bucket (defaults to resources). */
  storageBucket?: string
  storagePath: string
  downloadFileName: string
}

/** Fixed PDFs in Supabase Storage — download only, no editing. */
export const ONBOARDING_PDF_DOWNLOADS: Record<string, OnboardingPdfDownload> = {
  'cgv-reglement-interieur': {
    storageBucket: 'onboarding-templates',
    storagePath: 'CGV.pdf',
    downloadFileName: 'CGV et Reglement Interieur.pdf',
  },
}

export function isValidOnboardingPdfDownloadSlug(slug: string): boolean {
  return slug in ONBOARDING_PDF_DOWNLOADS
}

export function getOnboardingPdfDownload(slug: string): OnboardingPdfDownload | undefined {
  return ONBOARDING_PDF_DOWNLOADS[slug]
}

export type WelcomeBookletTemplate = {
  key: string
  label: string
  storageBucket: string
  storagePath: string
  publishFileName: string
}

export const WELCOME_BOOKLET_TEMPLATES: WelcomeBookletTemplate[] = [
  {
    key: 'online',
    label: 'Online Student',
    storageBucket: 'onboarding-templates',
    storagePath: 'welcome-online.pdf',
    publishFileName: 'Welcome booklet - Online Student.pdf',
  },
  {
    key: 'online-toeic',
    label: 'Online Student (TOEIC)',
    storageBucket: 'onboarding-templates',
    storagePath: 'welcome-online-toeic.pdf',
    publishFileName: 'Welcome booklet - Online Student (TOEIC).pdf',
  },
  {
    key: 'inperson',
    label: 'In-person Student',
    storageBucket: 'onboarding-templates',
    storagePath: 'welcome-inperson.pdf',
    publishFileName: 'Welcome booklet - In-person Student.pdf',
  },
  {
    key: 'inperson-toeic',
    label: 'In-person Student (TOEIC)',
    storageBucket: 'onboarding-templates',
    storagePath: 'welcome-inperson-toeic.pdf',
    publishFileName: 'Welcome booklet - In-person Student (TOEIC).pdf',
  },
]

export function getWelcomeBookletTemplate(templateKey: string): WelcomeBookletTemplate | undefined {
  return WELCOME_BOOKLET_TEMPLATES.find((template) => template.key === templateKey)
}
