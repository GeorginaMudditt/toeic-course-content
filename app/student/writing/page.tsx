import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import WritingSubmissionForm from '@/components/WritingSubmissionForm'
import StudentWritingList from '@/components/StudentWritingList'
import type { WritingSubmissionRow } from '@/lib/writing-submissions'

export default async function StudentWritingPage({
  searchParams,
}: {
  searchParams: { viewAs?: string }
}) {
  const session = await getServerSession(authOptions)
  const viewAs = searchParams?.viewAs

  if (viewAs && session?.user.role === 'TEACHER') {
    // Teacher viewing as student
  } else if (!session || session.user.role !== 'STUDENT') {
    redirect('/login')
  }

  const studentId =
    viewAs && session?.user.role === 'TEACHER' ? viewAs : session!.user.id
  const isTeacherView = Boolean(viewAs && session?.user.role === 'TEACHER')

  let submissions: WritingSubmissionRow[] = []
  try {
    const { data, error } = await supabaseServer
      .from('WritingSubmission')
      .select('*')
      .eq('studentId', studentId)
      .order('submittedAt', { ascending: false })

    if (error) {
      console.error('Error loading writing submissions:', error)
    } else {
      submissions = (data || []) as WritingSubmissionRow[]
    }
  } catch (error) {
    console.error('Error loading writing page:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-8">
          <div>
            <Link
              href={viewAs ? `/teacher/students/${viewAs}/view` : '/student/dashboard'}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">My Writing</h1>
            <p className="text-gray-600 mt-2">
              Submit writing for your teacher to mark. When it is marked, you will see corrections in red.
            </p>
          </div>

          {!isTeacherView && <WritingSubmissionForm />}

          <StudentWritingList
            submissions={submissions}
            viewAs={viewAs}
          />
        </div>
      </div>
    </div>
  )
}
