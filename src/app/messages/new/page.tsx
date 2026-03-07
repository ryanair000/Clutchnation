import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NewThreadForm } from '@/components/messages/new-thread-form';

export const metadata: Metadata = { title: 'New Message' };

export default async function NewMessagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="container-app py-8 max-w-lg mx-auto">
      <h1 className="font-heading text-2xl font-bold mb-4">New Message</h1>
      <NewThreadForm userId={user.id} />
    </div>
  );
}
