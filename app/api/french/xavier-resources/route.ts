import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'
import { supabaseServer } from '@/lib/supabase'
import {
  loadXavierResources,
  saveXavierResources,
  XAVIER_STORAGE_BUCKET,
  type XavierResource,
} from '@/lib/french-xavier-resources'

const MAX_SIZE_BYTES = 25 * 1024 * 1024

async function requireTeacher() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'TEACHER') {
    return null
  }
  return session
}

export async function GET() {
  try {
    if (!(await requireTeacher())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resources = await loadXavierResources()
    return NextResponse.json(resources)
  } catch (error) {
    console.error('Error in GET /api/french/xavier-resources:', error)
    return NextResponse.json({ error: 'Failed to load resources' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireTeacher())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const title = typeof formData.get('title') === 'string' ? formData.get('title')!.toString().trim() : ''
    const description =
      typeof formData.get('description') === 'string' ? formData.get('description')!.toString().trim() : ''
    const file = formData.get('file')

    if (!title) {
      return NextResponse.json({ error: 'A title is required' }, { status: 400 })
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Please choose a PDF to upload' }, { status: 400 })
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File size exceeds limit (25MB)' }, { status: 400 })
    }

    const id = randomUUID()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `french/xavier/${id}-${sanitizedName}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseServer.storage
      .from(XAVIER_STORAGE_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type || 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading Xavier PDF:', uploadError)
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload the PDF' },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseServer.storage
      .from(XAVIER_STORAGE_BUCKET)
      .getPublicUrl(filePath)

    const resource: XavierResource = {
      id,
      title,
      description,
      file_url: urlData.publicUrl,
      file_path: filePath,
      created_at: new Date().toISOString(),
    }

    const resources = await loadXavierResources()
    await saveXavierResources([resource, ...resources])

    return NextResponse.json(resource, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/french/xavier-resources:', error)
    return NextResponse.json({ error: 'Failed to add resource' }, { status: 500 })
  }
}
