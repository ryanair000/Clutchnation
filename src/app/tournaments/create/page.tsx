import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CreateTournamentForm } from './create-tournament-form';

export const metadata: Metadata = { title: 'Host Tournament' };

export default async function CreateTournamentPage() {
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

  if (!profile?.username) redirect('/onboarding');

  return (
    <div className="container-app py-8">
      <h1 className="font-heading text-2xl font-bold">Host a Tournament</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Set up an FC26 tournament for the community.
      </p>
      <div className="mt-6 max-w-lg">
        <CreateTournamentForm />
      </div>
    </div>
  );
}
