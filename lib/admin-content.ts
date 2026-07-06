export type AdminIcon =
  | 'cursor'
  | 'github'
  | 'netlify'
  | 'facebook'
  | 'instagram'
  | 'meta'
  | 'linkedin'
  | 'mailchimp'
  | 'pronunciation'
  | 'qonto'
  | 'mollie'
  | 'dougs'
  | 'bpf'
  | 'canva'
  | 'maf'
  | 'edof'
  | 'wedof'

export type AdminLinkItem = {
  title?: string
  description: string
  href?: string
  inlineLinks?: { phrase: string; href: string }[]
  icon: AdminIcon
}

export type AdminSection = {
  title: string
  description: string
  cardClassName: string
  headingClassName: string
  items?: AdminLinkItem[]
}

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    title: 'Marketing',
    description: 'Links and tools for campaigns, social media, and outreach.',
    cardClassName: 'bg-pink-50 border-pink-200',
    headingClassName: 'text-pink-900',
    items: [
      {
        description: 'Brizzle English School has a Facebook page.',
        inlineLinks: [{ phrase: 'Facebook', href: 'https://www.facebook.com/brizzleenglish' }],
        icon: 'facebook',
      },
      {
        description: 'Brizzle English School has an Instagram account.',
        inlineLinks: [{ phrase: 'Instagram', href: 'https://www.instagram.com/brizzleenglish/' }],
        icon: 'instagram',
      },
      {
        description: 'Templates for social media posts are found on Canva.',
        inlineLinks: [{ phrase: 'Canva', href: 'https://www.canva.com/' }],
        icon: 'canva',
      },
      {
        description:
          'We use Meta Business Suite to schedule content and cross post between Facebook and Instagram.',
        inlineLinks: [
          {
            phrase: 'Meta Business Suite',
            href: 'https://business.facebook.com/latest/?asset_id=596607923540487&business_id=3917524108488663&ir_qe_exposed=1&nav_ref=profile_plus_admin_tool',
          },
        ],
        icon: 'meta',
      },
      {
        description:
          'We use the Generate Brizzle Pronunciation URLs page to generate custom URLs for audio clips.',
        inlineLinks: [
          {
            phrase: 'Generate Brizzle Pronunciation URLs',
            href: '/teacher/admin/pronunciation-urls',
          },
        ],
        icon: 'pronunciation',
      },
      {
        description: 'Georgina shares business content on LinkedIn.',
        inlineLinks: [
          { phrase: 'LinkedIn', href: 'https://www.linkedin.com/in/georgina-mudditt/' },
        ],
        icon: 'linkedin',
      },
      {
        description: 'A monthly newsletter is sent out via Mailchimp.',
        inlineLinks: [{ phrase: 'Mailchimp', href: 'https://us16.admin.mailchimp.com/' }],
        icon: 'mailchimp',
      },
    ],
  },
  {
    title: 'Finances',
    description: 'Invoicing, accounting, and financial admin.',
    cardClassName: 'bg-emerald-50 border-emerald-200',
    headingClassName: 'text-emerald-900',
    items: [
      {
        description: 'The business banks with Qonto.',
        inlineLinks: [{ phrase: 'Qonto', href: 'https://app.qonto.com/signin' }],
        icon: 'qonto',
      },
      {
        description: 'Credit card payments are processed by Mollie.',
        inlineLinks: [
          {
            phrase: 'Mollie',
            href: 'https://my.mollie.com/dashboard/login?lang=fr',
          },
        ],
        icon: 'mollie',
      },
      {
        description:
          'Accounting and performance centrally referenced on the Dougs platform (end of tax year 30th September).',
        inlineLinks: [
          {
            phrase: 'Dougs platform',
            href: 'https://app.dougs.fr/app/c/214963/accounting/operations/payments',
          },
        ],
        icon: 'dougs',
      },
      {
        description:
          'A BPF ("Bilan Pédagogique et Financier") needs to be lodged annually in May to include NDA-covered activity.',
        inlineLinks: [
          {
            phrase: 'NDA-covered activity',
            href: '/teacher/admin/nda-covered-activity',
          },
        ],
        icon: 'bpf',
      },
    ],
  },
  {
    title: 'Tech',
    description: 'Platforms, hosting, and technical systems.',
    cardClassName: 'bg-blue-50 border-blue-200',
    headingClassName: 'text-blue-900',
    items: [
      {
        title: 'Cursor AI',
        description:
          'We use Cursor AI to build and update the Brizzle website and the Brizzle E-Learning Platform.',
        href: 'https://cursor.com',
        inlineLinks: [
          { phrase: 'Brizzle website', href: 'https://www.brizzle-english.com' },
          { phrase: 'Brizzle E-Learning Platform', href: 'https://www.brizzle-courses.com' },
        ],
        icon: 'cursor',
      },
      {
        title: 'GitHub',
        description: 'We use GitHub to store the code.',
        href: 'https://github.com/GeorginaMudditt?tab=repositories',
        icon: 'github',
      },
      {
        title: 'Netlify',
        description: 'We use Netlify to host.',
        href: 'https://app.netlify.com/teams/georginamudditt/projects',
        icon: 'netlify',
      },
    ],
  },
  {
    title: 'CPF/EDOF',
    description: 'Training fund admin and EDOF-related processes.',
    cardClassName: 'bg-amber-50 border-amber-200',
    headingClassName: 'text-amber-900',
    items: [
      {
        description:
          'The administrative “regulatory” space for training providers is Mon Activité Formation (MAF).',
        inlineLinks: [
          {
            phrase: 'Mon Activité Formation (MAF)',
            href: 'https://www.monactiviteformation.emploi.gouv.fr/mon-activite-formation/latest/#/',
          },
        ],
        icon: 'maf',
      },
      {
        description:
          'The platform to manage training offers that can be bought with CPF credits is EDOF.',
        inlineLinks: [
          { phrase: 'EDOF', href: 'https://of.moncompteformation.gouv.fr/espace-public/' },
        ],
        icon: 'edof',
      },
      {
        description:
          'The platform that ETS use to manage all the EDOF/CPF information is Wedof.',
        inlineLinks: [
          {
            phrase: 'Wedof',
            href: 'https://www.wedof.fr/formation/certifications/catalogue/?state=active',
          },
        ],
        icon: 'wedof',
      },
    ],
  },
]
