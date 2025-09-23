'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignInForm } from '@/components/sign-in-form';

export default function ClientSignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (username: string, password: string, role: 'user' | 'tutor') => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();

      if (data.success) {
        // Store the user role in localStorage
        localStorage.setItem('userRole', data.user.role);
        
        // Redirect based on role
        if (data.user.role === 'tutor') {
          router.push('/dashboard/tutor');
        } else {
          router.push('/dashboard'); // Main dashboard for students
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('An error occurred while signing in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return <SignInForm onSubmit={handleSignIn} isLoading={isLoading} />;
}