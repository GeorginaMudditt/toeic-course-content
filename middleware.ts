import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isTeacher = token?.role === 'TEACHER'
    const isStudent = token?.role === 'STUDENT'
    const path = req.nextUrl.pathname
    const viewAs = req.nextUrl.searchParams.get('viewAs')

    // Protect teacher routes
    if (path.startsWith('/teacher') && !isTeacher) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Protect student routes
    // Allow teachers to access student routes if they have viewAs parameter (from Student View)
    if (path.startsWith('/student') && !isStudent) {
      if (isTeacher && viewAs) {
        // Teacher viewing as student - allow access
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
  matcher: ['/teacher/:path*', '/student/:path*']
}


