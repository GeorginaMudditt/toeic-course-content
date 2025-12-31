import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { formatCourseName } from '@/lib/date-utils'

export default async function ProgressPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  let students: any[] = []

  try {
    // Fetch all students
    const { data: studentData, error: studentError } = await supabaseServer
      .from('User')
      .select('*')
      .eq('role', 'STUDENT')
      .order('name', { ascending: true })

    if (studentError) {
      console.error('Error loading students:', studentError)
    } else if (studentData && studentData.length > 0) {
      const studentIds = studentData.map(s => s.id)

      // Fetch all enrollments for these students
      const { data: enrollmentData, error: enrollmentError } = await supabaseServer
        .from('Enrollment')
        .select('*')
        .in('studentId', studentIds)

      if (enrollmentError) console.error('Error fetching enrollments:', enrollmentError)

      // Fetch all courses for these enrollments
      const courseIds = enrollmentData?.map(e => e.courseId) || []
      let courseData: any[] = []
      if (courseIds.length > 0) {
        const { data: coursesData, error: coursesError } = await supabaseServer
          .from('Course')
          .select('*')
          .in('id', courseIds)
        if (coursesError) {
          console.error('Error fetching courses:', coursesError)
        } else {
          courseData = coursesData || []
        }
      }

      // Fetch all assignments for these enrollments
      const enrollmentIds = enrollmentData?.map(e => e.id) || []
      let assignmentData: any[] = []
      if (enrollmentIds.length > 0) {
        const { data: assignmentsData, error: assignmentsError } = await supabaseServer
          .from('Assignment')
          .select('*')
          .in('enrollmentId', enrollmentIds)
        if (assignmentsError) {
          console.error('Error fetching assignments:', assignmentsError)
        } else {
          assignmentData = assignmentsData || []
        }
      }

      // Fetch all resources for these assignments
      const resourceIds = assignmentData.map(a => a.resourceId)
      let resourceData: any[] = []
      if (resourceIds.length > 0) {
        const { data: resourcesData, error: resourcesError } = await supabaseServer
          .from('Resource')
          .select('*')
          .in('id', resourceIds)
        if (resourcesError) {
          console.error('Error fetching resources:', resourcesError)
        } else {
          resourceData = resourcesData || []
        }
      }

      // Fetch all progress for these assignments
      const assignmentIds = assignmentData.map(a => a.id)
      let progressData: any[] = []
      if (assignmentIds.length > 0) {
        const { data: progressDataResult, error: progressError } = await supabaseServer
          .from('Progress')
          .select('*')
          .in('assignmentId', assignmentIds)
        if (progressError) {
          console.error('Error fetching progress:', progressError)
        } else {
          progressData = progressDataResult || []
        }
      }

      // Manually join data
      students = studentData.map(student => {
        const studentEnrollments = (enrollmentData || []).filter(e => e.studentId === student.id)
        const enrollments = studentEnrollments.map(enrollment => ({
          ...enrollment,
          course: courseData.find(c => c.id === enrollment.courseId) || null,
          assignments: assignmentData
            .filter(a => a.enrollmentId === enrollment.id)
            .map(assignment => ({
              ...assignment,
              resource: resourceData.find(r => r.id === assignment.resourceId) || null,
              progress: progressData.filter(p => p.assignmentId === assignment.id)
            }))
        }))
        return {
          ...student,
          enrollments
        }
      })
    }
  } catch (error) {
    console.error('Error loading progress page:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Student Progress</h1>

          <div className="space-y-6">
            {students.map((student: any) => {
              const allAssignments = student.enrollments.flatMap((e: any) => e.assignments)
              const total = allAssignments.length
              const completed = allAssignments.filter((a: any) => 
                a.progress.some((p: any) => p.status === 'COMPLETED')
              ).length
              const inProgress = allAssignments.filter((a: any) => 
                a.progress.some((p: any) => p.status === 'IN_PROGRESS')
              ).length
              const notStarted = total - completed - inProgress

              return (
                <div key={student.id} className="bg-white shadow rounded-lg p-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">{student.name}</h2>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-gray-500">
                        {completed} / {total} completed
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{ backgroundColor: '#38438f', width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{completed}</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold" style={{ color: '#38438f' }}>{inProgress}</div>
                      <div className="text-sm text-gray-600">In Progress</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-gray-600">{notStarted}</div>
                      <div className="text-sm text-gray-600">Not Started</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {student.enrollments.map((enrollment: any) => (
                      <div key={enrollment.id} className="border-t pt-4">
                        <h3 className="font-medium mb-2">{formatCourseName(enrollment.course.name, enrollment.course.duration)}</h3>
                        <div className="space-y-1">
                          {enrollment.assignments.map((assignment: any) => {
                            const progress = assignment.progress[0]
                            return (
                              <div
                                key={assignment.id}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="text-gray-700">
                                  {assignment.resource.title}
                                </span>
                                <span 
                                  className={
                                    progress?.status === 'COMPLETED' ? 'text-green-600 font-medium' :
                                    progress?.status === 'IN_PROGRESS' ? 'font-medium' :
                                    'text-gray-500'
                                  }
                                  style={progress?.status === 'IN_PROGRESS' ? { color: '#38438f' } : {}}
                                >
                                  {progress?.status || 'NOT_STARTED'}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

