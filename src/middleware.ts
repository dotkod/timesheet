import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for login page and API routes
  if (pathname === '/login' || pathname.startsWith('/api/auth/login')) {
    return NextResponse.next()
  }

  // Skip middleware for static files
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  try {
    const session = await getSession()

    if (!session) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - login (login page)
     * - api/auth/login (login endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!login|api/auth/login|_next/static|_next/image|favicon.ico).*)',
  ],
}
