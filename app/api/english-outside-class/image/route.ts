import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'

const MAX_BYTES = 5 * 1024 * 1024
const BUCKET = 'toeic'

const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Choose a picture from your computer.' }, { status: 400 })
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'The picture needs to be under 5 MB.' }, { status: 400 })
    }

    const extension = TYPES[file.type]
    if (!extension) {
      return NextResponse.json({ error: 'Use a JPG, PNG, WEBP, or GIF picture.' }, { status: 400 })
    }

    const path = `real-world-english/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`
    const bytes = Buffer.from(await file.arrayBuffer())
    const { error } = await supabaseServer.storage.from(BUCKET).upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    })
    if (error) {
      console.error('Error uploading Real-World English picture:', error)
      return NextResponse.json({ error: 'The picture could not be saved.' }, { status: 500 })
    }

    const { data } = supabaseServer.storage.from(BUCKET).getPublicUrl(path)
    return NextResponse.json({ image: data.publicUrl })
  } catch (error) {
    console.error('Error in POST /api/english-outside-class/image:', error)
    return NextResponse.json({ error: 'The picture could not be saved.' }, { status: 500 })
  }
}
