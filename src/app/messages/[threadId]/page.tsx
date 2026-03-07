import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChatWindow } from '@/components/messages/chat-window';

export const metadata: Metadata = { title: 'Conversation' };

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch thread
  const { data: thread } = await supabase
    .from('dm_threads')
    .select('*')
    .eq('id', threadId)
    .single();
  if (!thread) notFound();

  // Verify participant
  if (thread.user_a_id !== user.id && thread.user_b_id !== user.id) notFound();

  const otherId = thread.user_a_id === user.id ? thread.user_b_id : thread.user_a_id;
  const { data: otherProfile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('id', otherId)
    .single();

  // Fetch initial messages
  const { data: initialMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('channel_type', 'dm')
    .eq('channel_id', threadId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(100);

  return (
    <div className="container-app py-8 max-w-2xl mx-auto">
      <ChatWindow
        threadId={threadId}
        userId={user.id}
        otherUser={otherProfile ?? { id: otherId, username: null, avatar_url: null }}
        initialMessages={initialMessages ?? []}
      />
    </div>
  );
}
