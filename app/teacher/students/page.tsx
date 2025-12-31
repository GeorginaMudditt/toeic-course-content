import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default async function StudentsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  // Use Supabase REST API instead of Prisma for serverless compatibility
  let students: any[] = []

  try {
    // Get all students
    const { data: studentData, error: studentError } = await supabaseServer
      .from('User')
      .select('*')
      .eq('role', 'STUDENT')
      .order('name', { ascending: true })

    if (studentError) {
      console.error('Error loading students:', studentError)
    } else if (studentData) {
      // For each student, get their enrollments, courses, and assignments
      students = await Promise.all(
        studentData.map(async (student) => {
          // Get enrollments for this student
          const { data: enrollmentData } = await supabaseServer
            .from('Enrollment')
            .select('*')
            .eq('studentId', student.id)

          if (enrollmentData && enrollmentData.length > 0) {
            // Get courses for these enrollments
            const courseIds = enrollmentData.map(e => e.courseId)
            const { data: courseData } = await supabaseServer
              .from('Course')
              .select('*')
              .in('id', courseIds)

            // Get assignments for these enrollments
            const enrollmentIds = enrollmentData.map(e => e.id)
            const { data: assignmentData } = await supabaseServer
              .from('Assignment')
              .select('*')
              .in('enrollmentId', enrollmentIds)

            // Get progress for these assignments
            let progressData: any[] = []
            if (assignmentData && assignmentData.length > 0) {
              const assignmentIds = assignmentData.map(a => a.id)
              const { data: progress } = await supabaseServer
                .from('Progress')
                .select('*')
                .in('assignmentId', assignmentIds)
              progressData = progress || []
            }

            // Combine the data
            const enrollments = enrollmentData.map(enrollment => ({
              ...enrollment,
              course: courseData?.find(c => c.id === enrollment.courseId) || null,
              assignments: (assignmentData || [])
                .filter(a => a.enrollmentId === enrollment.id)
                .map(assignment => ({
                  ...assignment,
                  progress: progressData.filter(p => p.assignmentId === assignment.id)
                }))
            }))

            return {
              ...student,
              enrollments
            }
          }

          return {
            ...student,
            enrollments: []
          }
        })
      )
    }
  } catch (error) {
    console.error('Error loading students:', error)
    // Continue with empty array so the page still renders
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Students</h1>
            <Link
              href="/teacher/students/new"
              className="text-white px-4 py-2 rounded-md transition-colors hover:bg-[#2d3569]"
              style={{ backgroundColor: '#38438f' }}
            >
              + Add Student
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No students yet. Add your first student!
                    </td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const totalAssignments = student.enrollments.reduce<number>(
                      (sum: number, e: any) => sum + e.assignments.length,
                      0
                    )
                    const completedAssignments = student.enrollments.reduce<number>(
                      (sum: number, e: any) => sum + e.assignments.filter((a: any) => 
                        a.progress.some((p: any) => p.status === 'COMPLETED')
                      ).length,
                      0
                    )

                    return (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.enrollments.length} course(s)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {completedAssignments} / {totalAssignments} completed
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/teacher/students/${student.id}`}
                            className="transition-colors hover:text-[#2d3569]"
                            style={{ color: '#38438f' }}
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

