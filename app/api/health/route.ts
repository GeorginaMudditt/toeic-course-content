import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Test if we can import authOptions without crashing
    let authOptionsError = null
    try {
      const { authOptions } = await import('@/lib/auth')
      // Just check if it exists, don't use it
      if (!authOptions) {
        authOptionsError = 'authOptions is undefined'
      }
    } catch (error: any) {
      authOptionsError = error.message || String(error)
    }

    // Test Supabase initialization
    let supabaseError = null
    try {
      const { supabaseServer } = await import('@/lib/supabase')
      if (!supabaseServer) {
        supabaseError = 'supabaseServer is undefined'
      }
    } catch (error: any) {
      supabaseError = error.message || String(error)
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      errors: {
        authOptions: authOptionsError,
        supabase: supabaseError,
      },
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasSupabaseServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || String(error),
      stack: error.stack
    }, { status: 500 })
  }
}
