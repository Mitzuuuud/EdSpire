import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'edspire_session';
const SESSION_DURATION = 5 * 24 * 60 * 60 * 1000; // 5 days in milliseconds

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token required' },
        { status: 400 }
      );
    }

    // MITIGATION 1: Verify Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // MITIGATION 2: Create secure session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION
    });

    // MITIGATION 3: Set HTTP-only, Secure cookie
    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_DURATION / 1000,
      httpOnly: true,  // Prevents JavaScript access
      secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
      sameSite: 'strict',  // CSRF protection
      path: '/'
    });

    // MITIGATION 4: Return role from server (custom claims)
    const userRole = decodedToken.role || 'student';

    return NextResponse.json({
      success: true,
      role: userRole,
      uid: decodedToken.uid
    });

  } catch (error) {
    console.error('[SESSION ERROR]', error);
    return NextResponse.json(
      { error: 'Session creation failed' },
      { status: 500 }
    );
  }
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  
  return NextResponse.json({ success: true });
}
