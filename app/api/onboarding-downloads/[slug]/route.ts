import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { getOnboardingPdfDownload, isValidOnboardingPdfDownloadSlug } from '@/lib/onboarding-templates'

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isValidOnboardingPdfDownloadSlug(params.slug)) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const pdf = getOnboardingPdfDownload(params.slug)
    if (!pdf) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const bucket = pdf.storageBucket ?? 'resources'
    const expiresIn = 60 * 60
    const { data, error } = await supabaseServer.storage
      .from(bucket)
      .createSignedUrl(pdf.storagePath, expiresIn)

    if (error || !data?.signedUrl) {
      console.error('Error creating PDF download URL:', error)
      return NextResponse.json(
        {
          error: `PDF not found in storage (${bucket}/${pdf.storagePath}).`,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      downloadUrl: data.signedUrl,
      fileName: pdf.downloadFileName,
    })
  } catch (error) {
    console.error('Error in GET /api/onboarding-downloads/[slug]:', error)
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
  }
}
