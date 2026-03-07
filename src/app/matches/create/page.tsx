import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CreateMatchForm } from '@/components/matches/create-match-form';

export const metadata: Metadata = { title: '1v1 Challenge' };

export default async function CreateMatchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="container-app py-8 max-w-lg mx-auto">
      <h1 className="font-heading text-2xl font-bold mb-4">Challenge a Player</h1>
      <CreateMatchForm userId={user.id} />
    </div>
  );
}
