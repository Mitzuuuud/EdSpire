import { NextResponse } from 'next/server';

// Mock user data - In a real app, this would be in a database
const MOCK_USERS = {
  user: {
    username: 'testuser',
    password: 'password123',
    role: 'user'
  },
  tutor: {
    username: 'testtutor',
    password: 'tutor123',
    role: 'tutor'
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, role } = body;

    // Get the correct user type based on role
    const mockUser = role === 'tutor' ? MOCK_USERS.tutor : MOCK_USERS.user;

    // Mock authentication - In a real app, you would hash passwords and check against a database
    if (username === mockUser.username && password === mockUser.password) {
      return NextResponse.json({ 
        success: true, 
        message: 'Successfully signed in',
        user: { 
          username: mockUser.username,
          role: mockUser.role
        }
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}