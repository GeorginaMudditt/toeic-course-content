import type { QualiopiResourceLink } from '@/lib/qualiopi-documents'

export default function QualiopiProfessionalUpdates({
  intro,
  links,
}: {
  intro?: string
  links: QualiopiResourceLink[]
}) {
  if (links.length === 0) return null

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Professional updates</h2>
      <p className="text-gray-600 mb-4">
        {intro ||
          'Each time you complete the tracker, check these websites for relevant professional updates:'}
      </p>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium transition-colors hover:text-[#2d3569]"
              style={{ color: '#38438f' }}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
