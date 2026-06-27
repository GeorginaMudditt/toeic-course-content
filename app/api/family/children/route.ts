import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { loadFamilyChildren } from '@/lib/family-membership'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'GUARDIAN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const children = await loadFamilyChildren(session.user.id)
  return NextResponse.json({ data: children, error: null })
}
