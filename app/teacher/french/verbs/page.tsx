import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { FRENCH_VERB_GROUPS } from '@/lib/french-content'

export default async function FrenchVerbsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Link
            href="/teacher/french"
            className="mb-4 inline-block text-sm font-medium text-[#38438f] hover:underline"
          >
            ← Back to French
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Verb conjugation</h1>

          <div className="space-y-10">
            {FRENCH_VERB_GROUPS.map((group) => (
              <section key={group.id}>
                <h2 className="mb-4 text-xl font-semibold text-gray-900">{group.title}</h2>

                {group.verbs.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.verbs.map((verb) => (
                      <Link
                        key={verb.slug}
                        href={verb.href}
                        className={`rounded-lg border p-5 shadow-sm transition-colors ${group.cardClassName}`}
                      >
                        <h3
                          className={`text-xl font-semibold italic ${group.headingClassName}`}
                        >
                          {verb.title}
                        </h3>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-5 text-sm text-gray-500">
                    No verbs in this group yet.
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
