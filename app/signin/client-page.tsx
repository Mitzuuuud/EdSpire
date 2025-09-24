'use client';

import { useRouter } from 'next/navigation';
import { SignInForm } from '@/components/sign-in-form';

export default function ClientSignInForm() {
  const router = useRouter();

  const handleAuthSuccess = ({
    uid,
    email,
    role,
  }: { uid: string; email: string | null; role: 'user' | 'tutor' }) => {
    try {
      localStorage.setItem('userRole', role);
      // (Optional) Persist minimal user info for your UI
      localStorage.setItem('user', JSON.stringify({ uid, email, role }));
    } catch {
      /* localStorage may be unavailable; ignore */
    }

    // Route by role
    router.push(role === 'tutor' ? '/dashboard/tutor' : '/dashboard');
  };

  return <SignInForm onAuthSuccess={handleAuthSuccess} />;
}
