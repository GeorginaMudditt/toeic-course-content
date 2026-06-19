import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import QualiopiSpreadsheetEmbed from '@/components/QualiopiSpreadsheetEmbed'
import QualiopiFileManager from '@/components/QualiopiFileManager'
import QualiopiCourseDescriptions from '@/components/QualiopiCourseDescriptions'
import { supabaseServer } from '@/lib/supabase'
import { getQualiopiCourseDescriptions } from '@/lib/adult-course-descriptions'
import { getQualiopiDocument, getQualiopiFolder } from '@/lib/qualiopi-documents'

export default async function QualiopiFolderPage({
  params,
}: {
  params: { slug: string; folderSlug: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  const document = getQualiopiDocument(params.slug)
  const folder = getQualiopiFolder(params.slug, params.folderSlug)

  if (!document || !folder) {
    notFound()
  }

  const backHref = `/teacher/qualiopi/${document.slug}`
  const backLabel = `← Back to ${document.title}`

  if (folder.type === 'spreadsheet') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <QualiopiSpreadsheetEmbed
              document={document}
              backHref={backHref}
              backLabel={backLabel}
            />
          </div>
        </div>
      </div>
    )
  }

  if (folder.type === 'course-catalog') {
    const courses = getQualiopiCourseDescriptions()

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-4">
              <Link
                href={backHref}
                className="text-sm transition-colors hover:text-[#2d3569]"
                style={{ color: '#38438f' }}
              >
                {backLabel}
              </Link>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">{folder.title}</h1>
            <p className="text-gray-600 mb-8">{folder.description}</p>

            <QualiopiCourseDescriptions courses={courses} />
          </div>
        </div>
      </div>
    )
  }

  let files: any[] = []

  try {
    const { data, error } = await supabaseServer
      .from('QualiopiFile')
      .select('*')
      .eq('indicatorSlug', params.slug)
      .eq('folderSlug', params.folderSlug)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error loading Qualiopi files:', error)
    } else if (data) {
      const expiresIn = 365 * 24 * 60 * 60
      files = await Promise.all(
        data.map(async (file) => {
          const { data: signedUrlData } = await supabaseServer.storage
            .from('resources')
            .createSignedUrl(file.filePath, expiresIn)

          return {
            ...file,
            fileUrl: signedUrlData?.signedUrl || file.fileUrl,
          }
        }),
      )
    }
  } catch (error) {
    console.error('Error loading Qualiopi files:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-4">
            <Link
              href={backHref}
              className="text-sm transition-colors hover:text-[#2d3569]"
              style={{ color: '#38438f' }}
            >
              {backLabel}
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{folder.title}</h1>
          <p className="text-gray-600 mb-8">{folder.description}</p>

          <QualiopiFileManager
            indicatorSlug={params.slug}
            folderSlug={params.folderSlug}
            files={files}
          />
        </div>
      </div>
    </div>
  )
}
