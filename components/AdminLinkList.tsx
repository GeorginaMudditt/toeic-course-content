import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import type { AdminLinkItem } from '@/lib/admin-content'

function BrandLogo({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={20}
      height={20}
      className="h-5 w-5 object-contain"
    />
  )
}

function CursorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M4 4l16 6.5L4 17V4z"
        fill="#1a1a1a"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 12l-2.5 5.5" stroke="#f5f5f5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#24292f" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.021C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function NetlifyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#00ad9f" aria-hidden="true">
      <path d="M16.186 2.672H7.814L2 9.508l10 12.82 10-12.82-5.814-6.836zM12 18.956l-6.364-8.17h12.728L12 18.956z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#1877f2" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#e4405f" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function MetaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#0081fb" aria-hidden="true">
      <path d="M6.5 5.5C4.5 5.5 3 7.5 3 10.5s1.5 5 3.5 5c1.2 0 2-.8 3-2.3 1 1.5 1.8 2.3 3 2.3 2 0 3.5-2 3.5-5s-1.5-5-3.5-5c-1.2 0-2 .8-3 2.3C8.5 6.3 7.7 5.5 6.5 5.5z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#0a66c2" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function MailchimpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#ffe01b" aria-hidden="true">
      <path
        fill="#241c15"
        d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.2 5.4c.66 0 1.2.54 1.2 1.2s-.54 1.2-1.2 1.2-1.2-.54-1.2-1.2.54-1.2 1.2-1.2zm2.4 9.6H8.4v-6h4.8v6zm4.8 0h-3.6v-6H18v6z"
      />
    </svg>
  )
}

function PronunciationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M11 5L6 9H3v6h3l5 4V5z"
        fill="#ba3627"
        stroke="#ba3627"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 8.5a5 5 0 010 7"
        stroke="#38438f"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18 6a8.5 8.5 0 010 12"
        stroke="#38438f"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  )
}

function QontoIcon() {
  return <BrandLogo src="/images/admin-logos/qonto.svg" alt="Qonto" />
}

function MollieIcon() {
  return <BrandLogo src="/images/admin-logos/mollie.svg" alt="Mollie" />
}

function DougsIcon() {
  return <BrandLogo src="/images/admin-logos/dougs.svg" alt="Dougs" />
}

const ICONS = {
  cursor: CursorIcon,
  github: GitHubIcon,
  netlify: NetlifyIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  meta: MetaIcon,
  linkedin: LinkedInIcon,
  mailchimp: MailchimpIcon,
  pronunciation: PronunciationIcon,
  qonto: QontoIcon,
  mollie: MollieIcon,
  dougs: DougsIcon,
} as const

function InlineAdminLink({ phrase, href }: { phrase: string; href: string }) {
  const className = 'font-bold text-[#38438f] hover:underline'
  const isInternal = href.startsWith('/')

  if (isInternal) {
    return (
      <Link href={href} className={className}>
        {phrase}
      </Link>
    )
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {phrase}
    </a>
  )
}

function renderDescription(description: string, inlineLinks?: { phrase: string; href: string }[]) {
  if (!inlineLinks?.length) {
    return description
  }

  const parts: ReactNode[] = []
  let remaining = description

  for (const { phrase, href } of inlineLinks) {
    const index = remaining.indexOf(phrase)
    if (index === -1) continue

    if (index > 0) {
      parts.push(remaining.slice(0, index))
    }

    parts.push(<InlineAdminLink key={href} phrase={phrase} href={href} />)

    remaining = remaining.slice(index + phrase.length)
  }

  if (remaining) {
    parts.push(remaining)
  }

  return <>{parts}</>
}

function itemKey(item: AdminLinkItem) {
  return item.title ?? item.inlineLinks?.[0]?.href ?? item.description
}

function AdminLinkItemRow({ item }: { item: AdminLinkItem }) {
  const Icon = ICONS[item.icon]
  const titleContent = item.href ? (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-gray-900 hover:text-[#38438f] hover:underline"
    >
      {item.title}
    </a>
  ) : (
    <span className="font-semibold text-gray-900">{item.title}</span>
  )

  return (
    <li className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm"
        aria-hidden="true"
      >
        <Icon />
      </div>
      <div className="min-w-0 flex-1">
        {item.title ? <div className="mb-1">{titleContent}</div> : null}
        <p className={`text-sm leading-relaxed text-gray-700 ${item.title ? '' : 'pt-0.5'}`}>
          {renderDescription(item.description, item.inlineLinks)}
        </p>
      </div>
    </li>
  )
}

type Props = {
  items: AdminLinkItem[]
  dividerClassName?: string
}

export default function AdminLinkList({
  items,
  dividerClassName = 'divide-gray-200/80 border-gray-200/80',
}: Props) {
  return (
    <ul className={`mt-5 divide-y border-t ${dividerClassName}`}>
      {items.map((item) => (
        <AdminLinkItemRow key={itemKey(item)} item={item} />
      ))}
    </ul>
  )
}
