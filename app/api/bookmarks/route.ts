import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getBookmarksForAssignment,
  getBookmarksForStudent,
} from '@/lib/resource-bookmarks'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const assignmentId = request.nextUrl.searchParams.get('assignmentId')

    if (assignmentId) {
      const bookmarks = await getBookmarksForAssignment(session.user.id, assignmentId)
      return NextResponse.json({ bookmarks })
    }

    const bookmarks = await getBookmarksForStudent(session.user.id)
    return NextResponse.json({ bookmarks })
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 })
  }
}
