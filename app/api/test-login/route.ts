import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if users exist in the database
    const { data: users, error } = await supabaseServer
      .from('User')
      .select('id, email, name, role')
      .limit(10)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error
      }, { status: 500 })
    }

    const teacherUser = users?.find(u => u.email === 'hello@brizzle-english.com')
    const studentUser = users?.find(u => u.email === 'student@example.com')

    return NextResponse.json({
      success: true,
      totalUsers: users?.length || 0,
      users: users?.map(u => ({ email: u.email, name: u.name, role: u.role })),
      accounts: {
        teacher: {
          exists: !!teacherUser,
          email: 'hello@brizzle-english.com',
          password: 'X-press129'
        },
        student: {
          exists: !!studentUser,
          email: 'student@example.com',
          password: 'student123'
        }
      },
      message: !teacherUser && !studentUser 
        ? 'No users found. You need to run the setup script to create user accounts.'
        : 'Users found in database.'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || String(error),
      stack: error.stack
    }, { status: 500 })
  }
}
