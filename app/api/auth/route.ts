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

// In a real app, this would be stored in a database
const registeredUsers: Array<{username: string, password: string, role: string}> = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, role, isSignUp } = body;

    if (isSignUp) {
      // Handle user registration
      const existingUser = registeredUsers.find(user => user.username === username);
      const isMockUser = username === MOCK_USERS.user.username || username === MOCK_USERS.tutor.username;
      
      if (existingUser || isMockUser) {
        return NextResponse.json(
          { success: false, message: 'User already exists' },
          { status: 409 }
        );
      }

      // Register new user
      registeredUsers.push({ username, password, role });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Account created successfully',
        user: { 
          username,
          role
        }
      });
    } else {
      // Handle sign in
      // Check mock users first
      const mockUser = role === 'tutor' ? MOCK_USERS.tutor : MOCK_USERS.user;
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

      // Check registered users
      const registeredUser = registeredUsers.find(user => 
        user.username === username && user.password === password && user.role === role
      );

      if (registeredUser) {
        return NextResponse.json({ 
          success: true, 
          message: 'Successfully signed in',
          user: { 
            username: registeredUser.username,
            role: registeredUser.role
          }
        });
      }

      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}