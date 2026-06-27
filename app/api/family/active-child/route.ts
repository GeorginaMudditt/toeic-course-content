import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isGuardianChildLinked, loadFamilyChildren } from '@/lib/family-membership'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'GUARDIAN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const childStudentId = typeof body.childStudentId === 'string' ? body.childStudentId : ''

  if (!childStudentId) {
    return NextResponse.json({ error: 'childStudentId is required' }, { status: 400 })
  }

  const linked = await isGuardianChildLinked(session.user.id, childStudentId)
  if (!linked) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const children = await loadFamilyChildren(session.user.id)
  const child = children.find((entry) => entry.id === childStudentId)
  if (!child) {
    return NextResponse.json({ error: 'Child not found' }, { status: 404 })
  }

  return NextResponse.json({
    data: {
      activeChildId: child.id,
      activeChildName: child.name,
    },
    error: null,
  })
}
