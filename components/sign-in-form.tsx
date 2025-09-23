'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { auth, db } from '@/lib/firebase'; // ← Option A


import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

interface SignInFormProps {
  onAuthSuccess?: (params: { uid: string; email: string | null; role: 'user' | 'tutor' }) => void;
}

export function SignInForm({ onAuthSuccess }: SignInFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState(''); // email
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'user' | 'tutor'>('user');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = useCallback(() => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setFormError(null);
    setRole('user');
  }, []);

  const toggleMode = () => {
    setIsSignUp((v) => !v);
    resetForm();
  };

  const normalizeEmail = (e: string) => e.trim().toLowerCase();

  const firebaseErrorToMessage = (code: string) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'That email is already in use.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password is too weak (min 6 characters).';
      case 'auth/user-disabled':
        return 'This user is disabled.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setPasswordError('');

    const email = normalizeEmail(username);

    if (!email || !password) {
      setFormError('Email and password are required.');
      return;
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setPasswordError('Password must be at least 6 characters long');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: role === 'tutor' ? 'Tutor' : 'Student' });

        const userRef = doc(db, 'users', cred.user.uid);
        await setDoc(userRef, {
          uid: cred.user.uid,
          email,
          role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        onAuthSuccess?.({ uid: cred.user.uid, email: cred.user.email, role });
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const userRef = doc(db, 'users', cred.user.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: cred.user.uid,
            email: cred.user.email ?? email,
            role,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          onAuthSuccess?.({ uid: cred.user.uid, email: cred.user.email, role });
        } else {
          const data = snap.data() as { role?: 'user' | 'tutor' };
          const savedRole = data?.role;

          // Strict role enforcement (recommended)
          if (savedRole && savedRole !== role) {
            setFormError(`Your account is registered as "${savedRole}". Please switch the role above and sign in again.`);
            return;
          }

          await updateDoc(userRef, { updatedAt: serverTimestamp() });
          onAuthSuccess?.({ uid: cred.user.uid, email: cred.user.email, role: savedRole ?? role });
        }
      }
    } catch (err: any) {
      setFormError(firebaseErrorToMessage(err?.code || ''));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-6 space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">{isSignUp ? 'Create Account' : 'Sign In'}</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {isSignUp ? 'Create your account to get started' : 'Enter your credentials to access your account'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="role">{isSignUp ? 'I am a' : 'Sign in as'}</Label>
          <Select value={role} onValueChange={(v: 'user' | 'tutor') => setRole(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Student</SelectItem>
              <SelectItem value="tutor">Tutor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Email</Label>
          <Input
            id="username"
            placeholder="Enter your email"
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            placeholder="Enter your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
        </div>

        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              placeholder="Confirm your password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
        )}

        {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
        {formError && <p className="text-sm text-red-500">{formError}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (isSignUp ? 'Creating Account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={toggleMode}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            {isSignUp ? 'Sign In' : 'Create Account'}
          </button>
        </p>
      </div>
    </Card>
  );
}
