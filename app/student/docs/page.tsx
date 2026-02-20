import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import StudentDocumentActions from '@/components/StudentDocumentActions'

export default async function StudentDocsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'STUDENT') {
    redirect('/login')
  }

  let documents: any[] = []

  try {
    // Fetch documents for this student
    const { data: documentsData, error: documentsError } = await supabaseServer
      .from('StudentDocument')
      .select('*')
      .eq('studentId', session.user.id)
      .order('createdAt', { ascending: false })

    if (!documentsError && documentsData) {
      documents = documentsData
    }
  } catch (error) {
    console.error('Error loading documents:', error)
  }

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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Docs</h1>

          {documents.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <p className="text-gray-500">No documents have been assigned to you yet.</p>
              <p className="text-sm text-gray-400 mt-2">Your teacher will upload documents here for your reference.</p>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-6">
                Here are your administrative documents. Click "View" to open them in a new window.
              </p>
              <div className="space-y-4">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {document.mimeType === 'application/pdf' ? (
                          <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {document.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {document.fileName}
                          {document.fileSize && (
                            <span className="ml-2">
                              • {(document.fileSize / 1024).toFixed(1)} KB
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Uploaded {new Date(document.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <StudentDocumentActions fileUrl={document.fileUrl} fileName={document.fileName} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
