import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

const SECTIONS = [
  {
    title: 'Error correction',
    description:
      'Log mistakes and their corrections in one place so you can revise them quickly.',
    href: '/teacher/french/error-correction',
    external: false,
    cardClassName: 'bg-rose-50 border-rose-200 hover:border-rose-300',
    headingClassName: 'text-rose-900',
  },
  {
    title: 'Verb conjugation',
    description:
      'Conjugation tables and example sentences for the verbs you’re working on.',
    href: '/teacher/french/verbs',
    external: false,
    cardClassName: 'bg-sky-50 border-sky-200 hover:border-sky-300',
    headingClassName: 'text-sky-900',
  },
  {
    title: 'Chat',
    description: 'Jump into Talkpal for live French conversation practice.',
    href: 'https://app.talkpal.ai/dashboard',
    external: true,
    cardClassName: 'bg-violet-50 border-violet-200 hover:border-violet-300',
    headingClassName: 'text-violet-900',
  },
  {
    title: 'Xavier resources',
    description: 'PDFs and worksheets from your lessons with Xavier.',
    href: '/teacher/french/xavier',
    external: false,
    cardClassName: 'bg-amber-50 border-amber-200 hover:border-amber-300',
    headingClassName: 'text-amber-950',
  },
  {
    title: 'Adomlingua',
    description: 'Open your Adomlingua student dashboard.',
    href: 'https://maformation.adomlingua.fr/student/dashboard/76093',
    external: true,
    cardClassName: 'bg-teal-50 border-teal-200 hover:border-teal-300',
    headingClassName: 'text-teal-900',
  },
] as const

export default async function TeacherFrenchPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">French</h1>
          <p className="text-gray-600 mb-8">
            Your personal French study hub — revise here while you work.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map((section) => {
              const className = `rounded-lg border p-6 shadow-sm transition-colors ${section.cardClassName}`
              const content = (
                <>
                  <h2 className={`text-2xl font-semibold mb-2 ${section.headingClassName}`}>
                    {section.title}
                  </h2>
                  <p className="text-sm text-gray-600">{section.description}</p>
                </>
              )

              if (section.external) {
                return (
                  <a
                    key={section.href}
                    href={section.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {content}
                  </a>
                )
              }

              return (
                <Link key={section.href} href={section.href} className={className}>
                  {content}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
