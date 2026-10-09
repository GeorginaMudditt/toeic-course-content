import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import EnglishOutsideClassManager from '@/components/EnglishOutsideClassManager'
import { loadTeacherEnglishOutside } from '@/lib/english-outside-class-data'
import { englishOutsideStoreMode, listRealWorldEnglishImageFiles } from '@/lib/english-outside-store'

export default async function TeacherEnglishOutsideClassPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  const data = await loadTeacherEnglishOutside()
  const localPreview = (await englishOutsideStoreMode()) === 'local'
  const imageFiles = await listRealWorldEnglishImageFiles()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {localPreview && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              Saved on this computer. Students on the live site will not see this list until the
              Supabase update is run. You can keep adding titles here in the meantime.
            </div>
          )}
          {data.missingTable ? (
            <p className="text-sm text-gray-700">
              The Real-World English tables are not in the database yet. Run{' '}
              <code className="text-xs">supabase-migration-english-outside-class.sql</code> and refresh.
            </p>
          ) : data.error ? (
            <p className="text-sm text-red-700">{data.error}</p>
          ) : (
            <EnglishOutsideClassManager
              resources={data.resources}
              suggestions={data.suggestions}
              pendingComments={data.pendingComments}
              imageFiles={imageFiles}
            />
          )}
        </div>
      </div>
    </div>
  )
}
