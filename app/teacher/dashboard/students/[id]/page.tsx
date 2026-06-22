import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import StudentOnboardingChecklist from '@/components/StudentOnboardingChecklist'
import { loadStudentOnboardingChecklist } from '@/lib/load-student-onboarding-checklist'

export default async function StudentOnboardingPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  const { data: student, error: studentError } = await supabaseServer
    .from('User')
    .select('id, name')
    .eq('id', params.id)
    .eq('role', 'STUDENT')
    .single()

  if (studentError || !student) {
    notFound()
  }

  const checklist = await loadStudentOnboardingChecklist(params.id)
  const items = checklist?.items ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/teacher/onboarding"
              className="text-sm font-medium text-[#38438f] hover:text-[#2d3569]"
            >
              ← Back to Onboarding
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">{student.name}</h1>
            <p className="mt-1 text-gray-600">Onboarding &amp; administration checklist</p>
          </div>

          <StudentOnboardingChecklist studentId={student.id} initialItems={items} />
        </div>
      </div>
    </div>
  )
}
