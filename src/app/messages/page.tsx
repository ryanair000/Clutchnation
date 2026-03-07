import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'Messages' };

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch DM threads where user is a participant
  const { data: threads } = await supabase
    .from('dm_threads')
    .select('*')
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  // Get the other user's profile for each thread
  const otherIds = (threads ?? []).map((t) =>
    t.user_a_id === user.id ? t.user_b_id : t.user_a_id
  );

  let profileMap: Record<string, { username: string | null; avatar_url: string | null }> = {};
  if (otherIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', otherIds);
    for (const p of profiles ?? []) {
      profileMap[p.id] = { username: p.username, avatar_url: p.avatar_url };
    }
  }

  return (
    <div className="container-app py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Messages</h1>
        <Link
          href="/messages/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          New Message
        </Link>
      </div>

      {!threads || threads.length === 0 ? (
        <div className="rounded-lg border border-surface-200 bg-white p-12 text-center text-sm text-ink-muted">
          No conversations yet. Start a chat with another player!
        </div>
      ) : (
        <div className="space-y-1">
          {threads.map((t) => {
            const otherId = t.user_a_id === user.id ? t.user_b_id : t.user_a_id;
            const other = profileMap[otherId];
            return (
              <Link
                key={t.id}
                href={`/messages/${t.id}`}
                className="flex items-center gap-3 rounded-lg border border-surface-200 bg-white p-4 hover:border-brand/30 transition-colors"
              >
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-surface-200 flex items-center justify-center text-sm font-bold text-ink-muted">
                  {other?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {other?.username ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {t.last_message_at ? formatDateTime(t.last_message_at) : 'No messages yet'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
