import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CreateGroupForm } from '@/components/community/create-group-form';

export const metadata: Metadata = { title: 'Create Group' };

export default async function CreateGroupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-6 font-heading text-xl font-bold">Create a Group</h2>
      <CreateGroupForm />
    </div>
  );
}
