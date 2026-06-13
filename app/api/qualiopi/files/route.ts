import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { getQualiopiFolder } from '@/lib/qualiopi-documents'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const indicatorSlug = request.nextUrl.searchParams.get('indicatorSlug')
    const folderSlug = request.nextUrl.searchParams.get('folderSlug')

    if (!indicatorSlug || !folderSlug) {
      return NextResponse.json({ error: 'Indicator and folder are required' }, { status: 400 })
    }

    const folder = getQualiopiFolder(indicatorSlug, folderSlug)
    if (!folder || folder.type !== 'pdf-folder') {
      return NextResponse.json({ error: 'Invalid Qualiopi folder' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('QualiopiFile')
      .select('*')
      .eq('indicatorSlug', indicatorSlug)
      .eq('folderSlug', folderSlug)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching Qualiopi files:', error)
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
    }

    const expiresIn = 365 * 24 * 60 * 60
    const files = await Promise.all(
      (data || []).map(async (file) => {
        const { data: signedUrlData } = await supabaseServer.storage
          .from('resources')
          .createSignedUrl(file.filePath, expiresIn)

        return {
          ...file,
          fileUrl: signedUrlData?.signedUrl || file.fileUrl,
        }
      }),
    )

    return NextResponse.json(files)
  } catch (error) {
    console.error('Error in GET /api/qualiopi/files:', error)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { indicatorSlug, folderSlug, title, fileName, filePath, fileSize, mimeType } =
      await request.json()

    if (!indicatorSlug || !folderSlug) {
      return NextResponse.json({ error: 'Indicator and folder are required' }, { status: 400 })
    }

    const folder = getQualiopiFolder(indicatorSlug, folderSlug)
    if (!folder || folder.type !== 'pdf-folder') {
      return NextResponse.json({ error: 'Invalid Qualiopi folder' }, { status: 400 })
    }

    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Document title is required' }, { status: 400 })
    }

    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 })
    }

    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    if (mimeType !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    const maxSize = 25 * 1024 * 1024
    if (typeof fileSize !== 'number' || fileSize <= 0 || fileSize > maxSize) {
      return NextResponse.json({ error: 'Valid file size is required' }, { status: 400 })
    }

    const expiresIn = 365 * 24 * 60 * 60
    const { data: signedUrlData, error: signedUrlError } = await supabaseServer.storage
      .from('resources')
      .createSignedUrl(filePath, expiresIn)

    if (signedUrlError) {
      console.error('Error creating signed URL for Qualiopi file:', signedUrlError)
      return NextResponse.json({ error: 'Uploaded file not found in storage' }, { status: 400 })
    }

    const fileId = randomUUID()
    const now = new Date().toISOString()

    const { data: fileData, error: dbError } = await supabaseServer
      .from('QualiopiFile')
      .insert({
        id: fileId,
        indicatorSlug,
        folderSlug,
        title: title.trim(),
        fileName,
        filePath,
        fileUrl: signedUrlData.signedUrl,
        fileSize,
        mimeType,
        uploadedBy: session.user.id,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Qualiopi file database error:', dbError)
      await supabaseServer.storage.from('resources').remove([filePath])
      return NextResponse.json(
        { error: `Failed to save file record: ${dbError.message || 'Unknown error'}` },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, file: fileData })
  } catch (error) {
    console.error('Error in POST /api/qualiopi/files:', error)
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 })
  }
}
