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
  const isTeacher = session?.user.role === 'TEACHER'
  const isTeacherView = Boolean(isTeacher && viewAs)

  if (isTeacher) {
    // Shared list. Teachers can preview it, including from a student dashboard.
  } else if (!session || session.user.role !== 'STUDENT') {
    redirect('/login')
  }

  const studentId = isTeacher ? null : session!.user.id
  const library = await loadEnglishOutsideLibrary(isTeacherView ? viewAs! : studentId)

  const backHref = isTeacherView
    ? `/teacher/students/${viewAs}/view`
    : isTeacher
      ? '/teacher/english-outside-class'
      : '/student/dashboard'
  const backLabel = isTeacher && !isTeacherView ? 'Back to managing the list' : 'Back to dashboard'

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
              canContribute={!isTeacher}
              isTeacher={Boolean(isTeacher)}
              backHref={backHref}
              backLabel={backLabel}
            />
          )}
        </div>
      </div>
    </div>
  )
}
