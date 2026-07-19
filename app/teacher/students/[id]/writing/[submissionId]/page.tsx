import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import WritingMarkEditor from '@/components/WritingMarkEditor'
import type { WritingSubmissionRow } from '@/lib/writing-submissions'

export default async function TeacherMarkWritingPage({
  params,
}: {
  params: { id: string; submissionId: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  const { data: student } = await supabaseServer
    .from('User')
    .select('id, name, email')
    .eq('id', params.id)
    .eq('role', 'STUDENT')
    .maybeSingle()

  if (!student) {
    notFound()
  }

  const { data: submission, error } = await supabaseServer
    .from('WritingSubmission')
    .select('*')
    .eq('id', params.submissionId)
    .eq('studentId', params.id)
    .maybeSingle()

  if (error) {
    console.error('Error loading writing submission for marking:', error)
  }
  if (!submission) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Link
            href={`/teacher/students/${params.id}?tab=writing`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {student.name}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{submission.title}</h1>
          <p className="text-gray-600 mb-8">
            Marking writing for {student.name}
          </p>
          <WritingMarkEditor
            submission={submission as WritingSubmissionRow}
            studentId={params.id}
          />
        </div>
      </div>
    </div>
  )
}
