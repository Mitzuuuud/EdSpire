'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { auth, db } from '@/lib/firebase'; // ← Option A
import { isTutorProfileComplete } from '@/lib/profile-service';

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
  onAuthSuccess?: (params: { uid: string; email: string | null; role: 'user' | 'tutor'; needsProfileSetup?: boolean }) => void;
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
  const [showRoleUpdate, setShowRoleUpdate] = useState(false);
  const [lastSignInAttempt, setLastSignInAttempt] = useState<{email: string, uid: string} | null>(null);

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

  const handleRoleUpdate = async () => {
    if (!lastSignInAttempt) return;
    
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', lastSignInAttempt.uid);
      await updateDoc(userRef, { 
        role: role,
        updatedAt: serverTimestamp() 
      });
      
      setShowRoleUpdate(false);
      setFormError(null);
      setLastSignInAttempt(null);
      
      onAuthSuccess?.({ 
        uid: lastSignInAttempt.uid, 
        email: lastSignInAttempt.email, 
        role 
      });
    } catch (err: any) {
      setFormError('Failed to update role. Please try again.');
    } finally {
      setIsLoading(false);
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
        const userData = {
          uid: cred.user.uid,
          email,
          role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        console.log('Debug - Sign up data:', { 
          selectedRole: role, 
          userData,
          uid: cred.user.uid,
          email: cred.user.email 
        });

        await setDoc(userRef, userData);
        
        // For new tutor registrations, check if they need profile setup
        if (role === 'tutor') {
          onAuthSuccess?.({ uid: cred.user.uid, email: cred.user.email, role, needsProfileSetup: true });
        } else {
          onAuthSuccess?.({ uid: cred.user.uid, email: cred.user.email, role });
        }
      } else {
        // Sign in existing user
        const cred = await signInWithEmailAndPassword(auth, email, password);
        
        try {
          const userRef = doc(db, 'users', cred.user.uid);
          const snap = await getDoc(userRef);

          let userRole: 'user' | 'tutor' = role; // Default to selected role

          if (snap.exists()) {
            // User exists in Firestore
            const data = snap.data() as { role?: 'user' | 'tutor' };
            const savedRole = data?.role;

            console.log('Debug - Sign in attempt:', { 
              selectedRole: role, 
              savedRole,
              uid: cred.user.uid,
              email: cred.user.email,
              hasFirestoreRecord: true
            });

            if (savedRole && savedRole !== role) {
              // Role mismatch - offer options
              setLastSignInAttempt({ email: cred.user.email ?? email, uid: cred.user.uid });
              setShowRoleUpdate(true);
              setFormError(`Account found as "${savedRole === 'user' ? 'Student' : 'Tutor'}". Update role or select correct role above.`);
              return;
            }

            // Use saved role if it exists, otherwise use selected role
            userRole = savedRole || role;
            
            // Update the record
            await updateDoc(userRef, { 
              role: userRole,
              updatedAt: serverTimestamp() 
            });
          } else {
            // No Firestore record, create one
            console.log('Debug - Creating new Firestore record:', { 
              uid: cred.user.uid, 
              email: cred.user.email, 
              role 
            });
            
            await setDoc(userRef, {
              uid: cred.user.uid,
              email: cred.user.email ?? email,
              role: userRole,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }

          console.log(`Debug - Sign in successful as ${userRole}`);
          
          // For existing tutors, check if they need profile setup
          if (userRole === 'tutor') {
            const profileStatus = await isTutorProfileComplete(cred.user.uid);
            onAuthSuccess?.({ 
              uid: cred.user.uid, 
              email: cred.user.email, 
              role: userRole, 
              needsProfileSetup: !profileStatus.complete 
            });
          } else {
            onAuthSuccess?.({ uid: cred.user.uid, email: cred.user.email, role: userRole });
          }
          
        } catch (firestoreError) {
          console.error('Firestore error, but authentication succeeded:', firestoreError);
          // If Firestore fails, still allow sign in with selected role
          onAuthSuccess?.({ uid: cred.user.uid, email: cred.user.email, role });
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

        {showRoleUpdate && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowRoleUpdate(false);
                  setFormError(null);
                  setLastSignInAttempt(null);
                }}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleRoleUpdate}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Updating...' : 'Update Role'}
              </Button>
            </div>
            <Button 
              type="button" 
              variant="secondary"
              onClick={async () => {
                if (lastSignInAttempt) {
                  // Sign in with the selected role temporarily for testing
                  onAuthSuccess?.({ 
                    uid: lastSignInAttempt.uid, 
                    email: lastSignInAttempt.email, 
                    role 
                  });
                }
              }}
              disabled={isLoading}
              className="w-full text-xs"
            >
              Sign in as {role === 'user' ? 'Student' : 'Tutor'} anyway (for testing)
            </Button>
          </div>
        )}

        {!showRoleUpdate && (
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (isSignUp ? 'Creating Account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
          </Button>
        )}
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
