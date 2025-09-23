import ClientSignInForm from './client-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - EdSpire',
  description: 'Sign in to your EdSpire account',
};

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <ClientSignInForm />
    </div>
  );
}