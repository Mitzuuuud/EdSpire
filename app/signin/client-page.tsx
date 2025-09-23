'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignInForm } from '@/components/sign-in-form';

export default function ClientSignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Clear any existing authentication on sign-in page load
    localStorage.removeItem('userRole');
  }, []);

  const handleSignIn = async (username: string, password: string, role: 'user' | 'tutor') => {
    setIsLoading(true);
    try {
      // Clear any existing auth data first
      localStorage.removeItem('userRole');
      
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
        
        // Use replace instead of push to prevent back navigation
        if (data.user.role === 'tutor') {
          router.replace('/dashboard/tutor');
        } else {
          router.replace('/dashboard'); // Main dashboard for students
        }
      } else {
        localStorage.removeItem('userRole');
        alert(data.message);
      }
    } catch (error) {
      localStorage.removeItem('userRole');
      alert('An error occurred while signing in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return <SignInForm onSubmit={handleSignIn} isLoading={isLoading} />;
}