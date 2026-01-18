import { NextRequest, NextResponse } from 'next/server';
// import { adminAuth } from '@/lib/firebase-admin';

const SESSION_COOKIE_NAME = 'edspire_session';

// Protected routes configuration
const PROTECTED_ROUTES = {
  '/tutor': ['tutor', 'admin'],
  '/admin': ['admin'],
  '/student': ['student', 'tutor', 'admin']
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if route requires protection
  const protectedRoute = Object.keys(PROTECTED_ROUTES).find(route =>
    pathname.startsWith(route)
  );

  if (!protectedRoute) {
    return NextResponse.next();
  }

  // MITIGATION 5: Verify session cookie server-side
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  try {
    // MITIGATION 6: Verify and decode session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    // MITIGATION 7: Enforce role-based access control
    const userRole = decodedClaims.role || 'student';
    const allowedRoles = PROTECTED_ROUTES[protectedRoute];

    if (!allowedRoles.includes(userRole)) {
      // User doesn't have permission - redirect to appropriate dashboard
      const redirectMap = {
        'student': '/student/dashboard',
        'tutor': '/tutor/dashboard',
        'admin': '/admin/dashboard'
      };
      
      return NextResponse.redirect(
        new URL(redirectMap[userRole] || '/signin', request.url)
      );
    }

    // MITIGATION 8: Add user info to request headers for downstream use
    const response = NextResponse.next();
    response.headers.set('X-User-Role', userRole);
    response.headers.set('X-User-UID', decodedClaims.uid);
    
    return response;

  } catch (error) {
    console.error('[AUTH MIDDLEWARE]', error);
    // Invalid or expired session - clear cookie and redirect
    const response = NextResponse.redirect(new URL('/signin', request.url));
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ['/tutor/:path*', '/student/:path*', '/admin/:path*']
};
