import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default async function ResourcesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  const resources = await prisma.resource.findMany({
    where: { creatorId: session.user.id },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Resource Bank</h1>
            <Link
              href="/teacher/resources/new"
              className="text-white px-4 py-2 rounded-md transition-colors hover:bg-[#2d3569]"
              style={{ backgroundColor: '#38438f' }}
            >
              + New Resource
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resources.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      No resources yet. Create your first resource!
                    </td>
                  </tr>
                ) : (
                  resources.map((resource) => (
                    <tr key={resource.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{resource.title}</div>
                        {resource.description && (
                          <div className="text-sm text-gray-500">{resource.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resource.level || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/teacher/resources/${resource.id}/preview`}
                          className="mr-4 transition-colors hover:text-[#2d3569]"
                          style={{ color: '#38438f' }}
                        >
                          View
                        </Link>
                        <Link
                          href={`/teacher/resources/${resource.id}`}
                          className="transition-colors hover:text-[#2d3569]"
                          style={{ color: '#38438f' }}
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

