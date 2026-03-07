import type { Metadata } from 'next';
import { SignupForm } from './signup-form';

export const metadata: Metadata = { title: 'Sign up' };

export default function SignupPage() {
  return (
    <div className="container-app flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-ink-muted">Join ClutchNation and start competing</p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
