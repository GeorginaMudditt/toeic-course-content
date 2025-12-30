import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { formatUKDate, formatCourseName } from '@/lib/date-utils'

type EnrollmentWithRelations = Prisma.EnrollmentGetPayload<{
  include: {
    course: true
    assignments: {
      include: {
        resource: true
        progress: true
      }
    }
  }
}>

export default async function MyCoursePage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'STUDENT') {
    redirect('/login')
  }

  const enrollments: EnrollmentWithRelations[] = await prisma.enrollment.findMany({
    where: { studentId: session.user.id },
    include: {
      course: true,
      assignments: {
        include: {
          resource: true,
          progress: {
            where: { studentId: session.user.id }
          }
        },
        orderBy: { order: 'asc' }
      }
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Link
            href="/student/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Course</h1>

          {enrollments.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <p className="text-gray-500">You haven't been enrolled in any courses yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {formatCourseName(enrollment.course.name, enrollment.course.duration)}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Enrolled {formatUKDate(enrollment.enrolledAt)}
                      </p>
                      {enrollment.course.description && (
                        <p className="text-sm text-gray-600 mt-2">{enrollment.course.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Assignments</h3>
                    <div className="space-y-2">
                      {enrollment.assignments.length === 0 ? (
                        <p className="text-sm text-gray-500">No assignments yet.</p>
                      ) : (
                        enrollment.assignments.map((assignment) => {
                          const progress = assignment.progress[0]
                          const status = progress?.status || 'NOT_STARTED'
                          
                          return (
                            <Link
                              key={assignment.id}
                              href={`/student/assignment/${assignment.id}`}
                              className="block p-3 border rounded-lg hover:bg-gray-50 transition"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {assignment.resource.title}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {assignment.resource.estimatedHours}h • {assignment.resource.type} • Level {assignment.resource.level}
                                  </div>
                                </div>
                                <div className="text-sm">
                                  {status === 'COMPLETED' && (
                                    <span className="text-green-600 font-medium">✓ Completed</span>
                                  )}
                                  {status === 'IN_PROGRESS' && (
                                    <span className="font-medium" style={{ color: '#38438f' }}>In Progress</span>
                                  )}
                                  {status === 'NOT_STARTED' && (
                                    <span className="text-gray-500">Not Started</span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

