import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import EnglishOutsideClassBoard from '@/components/EnglishOutsideClassBoard'
import { loadEnglishOutsideLibrary } from '@/lib/english-outside-class-data'

export default async function EnglishOutsideClassPage({
  searchParams,
}: {
  searchParams: { viewAs?: string }
}) {
  const session = await getServerSession(authOptions)
  const viewAs = searchParams?.viewAs
  const isTeacherView = Boolean(viewAs)

  if (!session || session.user.role !== 'TEACHER') {
    redirect(session?.user.role === 'STUDENT' ? '/student/dashboard' : '/login')
  }

  const library = await loadEnglishOutsideLibrary(isTeacherView ? viewAs! : null)

  const backHref = isTeacherView
    ? `/teacher/students/${viewAs}/view`
    : '/teacher/english-outside-class'
  const backLabel = isTeacherView ? 'Back to dashboard' : 'Back to managing the list'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {library.missingTable ? (
            <p className="text-sm text-gray-600">This list is being set up. Please check back soon.</p>
          ) : library.error ? (
            <p className="text-sm text-red-700">{library.error}</p>
          ) : (
            <EnglishOutsideClassBoard
              resources={library.resources}
              canContribute={false}
              isTeacher
              backHref={backHref}
              backLabel={backLabel}
            />
          )}
        </div>
      </div>
    </div>
  )
}
