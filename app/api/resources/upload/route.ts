import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify Supabase is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Supabase is not configured. Please set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.' },
        { status: 500 }
      )
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
      const filePath = `resources/${filename}`

      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseServer.storage
        .from('resources')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        // Cast to any to access properties that may exist at runtime
        const errorDetails = uploadError as any
        console.error('Upload error details:', {
          message: uploadError.message,
          statusCode: errorDetails.statusCode,
          error: errorDetails.error,
          fileName: file.name,
          filePath: filePath
        })
        
        // Provide more helpful error messages
        let errorMsg = `Failed to upload ${file.name}: ${uploadError.message || 'Unknown error'}`
        
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          errorMsg += '. Please ensure the "resources" bucket exists in Supabase Storage and is set to public.'
        } else if (uploadError.message?.includes('permission') || uploadError.message?.includes('denied')) {
          errorMsg += '. Please check that SUPABASE_SERVICE_ROLE_KEY is set correctly and the bucket has proper permissions.'
        } else if (uploadError.message?.includes('JWT')) {
          errorMsg += '. Please check that SUPABASE_SERVICE_ROLE_KEY is set correctly in your environment variables.'
        }
        
        return NextResponse.json(
          { error: errorMsg },
          { status: 500 }
        )
      }

      // Get public URL
      const { data: urlData } = supabaseServer.storage
        .from('resources')
        .getPublicUrl(filePath)

      const publicPath = urlData.publicUrl

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
    const errorMessage = error instanceof Error 
      ? `${error.message}${error.stack ? `\nStack: ${error.stack}` : ''}` 
      : 'Failed to upload file'
    return NextResponse.json(
      { error: `Upload failed: ${errorMessage}` },
      { status: 500 }
    )
  }
}


