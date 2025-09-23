'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignInForm } from '@/components/sign-in-form';

export default function ClientSignInForm() {
  const router = useRouter();

  const handleAuthSuccess = ({ uid, email, role }: { uid: string; email: string | null; role: 'user' | 'tutor' }) => {
    // Store the user role and info in localStorage
    localStorage.setItem('userRole', role);
    localStorage.setItem('userId', uid);
    if (email) {
      localStorage.setItem('userEmail', email);
    }
    
    // Redirect based on role
    if (role === 'tutor') {
      router.push('/dashboard/tutor');
    } else {
      router.push('/dashboard'); // Main dashboard for students
    }
  };

  return <SignInForm onAuthSuccess={handleAuthSuccess} />;
}