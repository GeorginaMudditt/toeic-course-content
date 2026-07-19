import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import {
  formatFileSize,
  statusLabel,
  type WritingSubmissionRow,
} from '@/lib/writing-submissions'
import { formatUKDate } from '@/lib/date-utils'

export default async function StudentWritingDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { viewAs?: string }
}) {
  const session = await getServerSession(authOptions)
  const viewAs = searchParams?.viewAs

  if (viewAs && session?.user.role === 'TEACHER') {
    // ok
  } else if (!session || session.user.role !== 'STUDENT') {
    redirect('/login')
  }

  const studentId =
    viewAs && session?.user.role === 'TEACHER' ? viewAs : session!.user.id

  const { data: submission, error } = await supabaseServer
    .from('WritingSubmission')
    .select('*')
    .eq('id', params.id)
    .eq('studentId', studentId)
    .maybeSingle()

  if (error) {
    console.error('Error loading writing submission:', error)
  }
  if (!submission) {
    notFound()
  }

  const row = submission as WritingSubmissionRow
  const isMarked = row.status === 'MARKED'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <div>
            <Link
              href={viewAs ? `/student/writing?viewAs=${viewAs}` : '/student/writing'}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to My Writing
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{row.title}</h1>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  isMarked ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {statusLabel(row.status)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Submitted {formatUKDate(row.submittedAt)}
              {row.uploadedById ? ' · added by your teacher' : ''}
              {row.markedAt ? ` · marked ${formatUKDate(row.markedAt)}` : ''}
            </p>
          </div>

          {row.fileUrl && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Attached file</h2>
              <a
                href={row.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#38438f] underline text-sm"
              >
                {row.fileName || 'Open file'}
                {row.fileSize ? ` (${formatFileSize(row.fileSize)})` : ''}
              </a>
              {row.mimeType?.startsWith('image/') && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={row.fileUrl}
                  alt={row.fileName || 'Submitted writing'}
                  className="mt-4 max-w-full rounded-md border border-gray-200"
                />
              )}
            </div>
          )}

          {isMarked ? (
            <>
              {(row.teacherComments || row.score != null) && (
                <div className="bg-white shadow rounded-lg p-6 space-y-3">
                  <h2 className="text-lg font-semibold text-gray-900" style={{ color: '#38438f' }}>
                    Teacher feedback
                  </h2>
                  {row.score != null && (
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">Score:</span> {row.score}
                    </p>
                  )}
                  {row.teacherComments && (
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{row.teacherComments}</p>
                  )}
                </div>
              )}

              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Marked writing</h2>
                <p className="text-sm text-gray-600 mb-4">
                  <span className="text-red-600 line-through">Red strikethrough</span> shows deletions.{' '}
                  <span className="text-red-600">Red text</span> shows corrections and additions.
                </p>
                {row.markedHtml ? (
                  <div
                    className="prose max-w-none text-sm leading-relaxed font-serif writing-marked-view"
                    dangerouslySetInnerHTML={{ __html: row.markedHtml }}
                  />
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No inline corrections — see comments above
                    {row.fileUrl ? ' and/or the attached file' : ''}.
                  </p>
                )}
              </div>

              {row.originalText && (
                <details className="bg-white shadow rounded-lg p-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">
                    View your original text
                  </summary>
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed font-serif text-gray-800">
                    {row.originalText}
                  </div>
                </details>
              )}
            </>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 space-y-4">
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                Your teacher has not marked this yet. You will see red corrections here when it is ready.
              </p>
              {row.originalText && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Your writing</h2>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed font-serif text-gray-800">
                    {row.originalText}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .writing-marked-view p { margin: 0 0 0.75em; }
            .writing-marked-view strike,
            .writing-marked-view s { color: #dc2626; }
          `,
        }}
      />
    </div>
  )
}
