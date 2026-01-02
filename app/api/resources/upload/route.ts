import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const singleFile = formData.get('file') as File

    // Support both single file (backward compatibility) and multiple files
    const filesToUpload = files.length > 0 ? files : singleFile ? [singleFile] : []

    if (filesToUpload.length === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file types
    const allowedTypes = [
      'application/pdf', 
      'image/png', 
      'image/jpeg', 
      'image/jpg',
      'audio/mpeg',
      'audio/mp3',
      'audio/mpeg3',
      'audio/mp4',
      'video/mp4'
    ]
    
    // Validate file size (max 10MB for PDFs/images, 20MB for audio)
    const maxSizePDF = 10 * 1024 * 1024 // 10MB
    const maxSizeAudio = 20 * 1024 * 1024 // 20MB

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'resources')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const uploadedFiles = []

    for (const file of filesToUpload) {
      // Check file type
      const isAudio = file.type.startsWith('audio/') || file.type.startsWith('video/mp4') || 
                      file.name.toLowerCase().endsWith('.mp3') || file.name.toLowerCase().endsWith('.mp4')
      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      const isImage = file.type.startsWith('image/')
      
      if (!isPDF && !isImage && !isAudio) {
        return NextResponse.json(
          { error: `Invalid file type for ${file.name}. Only PDF, PNG, JPEG, and MP3/MP4 audio files are allowed.` },
          { status: 400 }
        )
      }

      // Check file size
      const maxSize = isAudio ? maxSizeAudio : maxSizePDF
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds size limit (${isAudio ? '20MB' : '10MB'})` },
          { status: 400 }
        )
      }

      // Generate unique filename
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 9)
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filename = `${timestamp}-${random}-${sanitizedName}`
      const filepath = join(uploadsDir, filename)

      // Save file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filepath, buffer)

      // Return the public URL path
      const publicPath = `/uploads/resources/${filename}`

      uploadedFiles.push({
        path: publicPath,
        filename: file.name,
        size: file.size,
        type: file.type,
        isAudio,
        isPDF,
        isImage
      })
    }

    // If single file, return single object for backward compatibility
    if (uploadedFiles.length === 1) {
      return NextResponse.json(uploadedFiles[0])
    }

    // Return array for multiple files
    return NextResponse.json({ files: uploadedFiles })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}


