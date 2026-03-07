import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OnboardingForm } from './onboarding-form';

export const metadata: Metadata = { title: 'Complete Your Profile' };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  // If profile already has a username, skip onboarding
  if (profile?.username) redirect('/dashboard');

  return (
    <div className="container-app flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold">Set up your profile</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Choose a display name and enter your PSN Online ID to get started.
          </p>
        </div>
        <OnboardingForm userId={user.id} />
      </div>
    </div>
  );
}
