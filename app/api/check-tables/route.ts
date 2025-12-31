import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const tables = ['User', 'Resource', 'Course', 'Enrollment', 'Assignment', 'Progress']
    const tableStatus: Record<string, { exists: boolean; error?: string; count?: number }> = {}

    for (const table of tables) {
      try {
        // Try to query the table - if it exists, this will work
        const { data, error, count } = await supabaseServer
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          tableStatus[table] = {
            exists: false,
            error: error.message
          }
        } else {
          tableStatus[table] = {
            exists: true,
            count: count || 0
          }
        }
      } catch (error: any) {
        tableStatus[table] = {
          exists: false,
          error: error.message || String(error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      tables: tableStatus,
      message: 'Check complete'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || String(error),
      stack: error.stack
    }, { status: 500 })
  }
}
