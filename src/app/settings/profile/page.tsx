import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditProfileForm } from './edit-profile-form';

export const metadata: Metadata = { title: 'Edit Profile' };

export default async function SettingsProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.username) redirect('/onboarding');

  return (
    <div className="container-app py-8">
      <h1 className="font-heading text-2xl font-bold">Edit Profile</h1>
      <p className="mt-1 text-sm text-ink-muted">Update your display info and PSN details.</p>
      <div className="mt-6 max-w-lg">
        <EditProfileForm profile={profile} />
      </div>
    </div>
  );
}
