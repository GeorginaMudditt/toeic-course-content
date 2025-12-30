import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import { formatCourseName } from '@/lib/date-utils'

export default async function ProgressPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    include: {
      enrollments: {
        include: {
          course: true,
          assignments: {
            include: {
              resource: true,
              progress: true
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Student Progress</h1>

          <div className="space-y-6">
            {students.map((student) => {
              const allAssignments = student.enrollments.flatMap(e => e.assignments)
              const total = allAssignments.length
              const completed = allAssignments.filter(a => 
                a.progress.some(p => p.status === 'COMPLETED')
              ).length
              const inProgress = allAssignments.filter(a => 
                a.progress.some(p => p.status === 'IN_PROGRESS')
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
                    {student.enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="border-t pt-4">
                        <h3 className="font-medium mb-2">{formatCourseName(enrollment.course.name, enrollment.course.duration)}</h3>
                        <div className="space-y-1">
                          {enrollment.assignments.map((assignment) => {
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

