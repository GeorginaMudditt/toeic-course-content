import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isTeacher = token?.role === 'TEACHER'
    const isStudent = token?.role === 'STUDENT'
    const isGuardian = token?.role === 'GUARDIAN'
    const path = req.nextUrl.pathname
    const viewAs = req.nextUrl.searchParams.get('viewAs')
    const activeChildId = token?.activeChildId as string | null | undefined

    if (path.startsWith('/teacher') && !isTeacher) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (path.startsWith('/family')) {
      if (!isGuardian) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      return NextResponse.next()
    }

    if (path.startsWith('/student')) {
      if (isTeacher && viewAs) {
        return NextResponse.next()
      }

      if (isStudent) {
        return NextResponse.next()
      }

      if (isGuardian) {
        const isVocabularyRoute = path.startsWith('/student/vocabulary')
        if (!isVocabularyRoute) {
          return NextResponse.redirect(new URL('/family', req.url))
        }
        if (!activeChildId) {
          return NextResponse.redirect(new URL('/family', req.url))
        }
        return NextResponse.next()
      }

      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/teacher/:path*', '/student/:path*', '/family', '/family/:path*'],
}
