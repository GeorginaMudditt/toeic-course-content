import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count()
    
    // Check environment variables (without exposing secrets)
    const hasDatabaseUrl = !!process.env.DATABASE_URL
    const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET
    const hasNextAuthUrl = !!process.env.NEXTAUTH_URL
    
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        userCount,
      },
      environment: {
        hasDatabaseUrl,
        hasNextAuthSecret,
        hasNextAuthUrl,
        nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      database: {
        connected: false,
      },
      environment: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
      },
    }, { status: 500 })
  }
}

