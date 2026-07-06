import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AdminLinkList from '@/components/AdminLinkList'
import { ADMIN_SECTIONS } from '@/lib/admin-content'

export default async function TeacherAdminPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin</h1>
          <p className="text-gray-600 mb-8">
            Central hub for Brizzle admin systems.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {ADMIN_SECTIONS.map((section) => (
              <section
                key={section.title}
                className={`rounded-lg border p-6 shadow-sm ${section.cardClassName}`}
              >
                <h2 className={`text-2xl font-semibold mb-2 ${section.headingClassName}`}>
                  {section.title}
                </h2>
                <p className="text-sm text-gray-600">{section.description}</p>
                {section.items?.length ? (
                  <AdminLinkList
                    items={section.items}
                    dividerClassName={
                      section.title === 'Marketing'
                        ? 'divide-pink-100/80 border-pink-100/80'
                        : section.title === 'Finances'
                          ? 'divide-emerald-100/80 border-emerald-100/80'
                          : section.title === 'Tech'
                            ? 'divide-blue-100/80 border-blue-100/80'
                            : section.title === 'CPF/EDOF'
                              ? 'divide-amber-100/80 border-amber-100/80'
                              : undefined
                    }
                  />
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
