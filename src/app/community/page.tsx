import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { FeedList } from '@/components/community/feed-list';
import { CommunityStats } from '@/components/community/community-stats';
import { CreatePostForm } from '@/components/community/create-post-form';
import type { FeedItem } from '@/types';
import { COMMUNITY_FEED_PAGE_SIZE } from '@/lib/constants';

export const metadata: Metadata = { title: 'Community' };

export default async function CommunityPage() {
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

  // Fetch initial feed data in parallel
  const [activityRes, postsRes] = await Promise.all([
    supabase
      .from('activity_events')
      .select(
        '*, actor:profiles!activity_events_actor_id_fkey(username, avatar_url)'
      )
      .order('created_at', { ascending: false })
      .limit(COMMUNITY_FEED_PAGE_SIZE),
    supabase
      .from('community_posts')
      .select(
        '*, author:profiles!community_posts_author_id_fkey(username, avatar_url)'
      )
      .eq('is_deleted', false)
      .is('group_id', null)
      .order('created_at', { ascending: false })
      .limit(COMMUNITY_FEED_PAGE_SIZE),
  ]);

  const activityItems: FeedItem[] = (activityRes.data ?? []).map((e) => ({
    type: 'activity' as const,
    data: e,
  }));

  const postItems: FeedItem[] = (postsRes.data ?? []).map((p) => ({
    type: 'post' as const,
    data: { ...p, media_urls: p.media_urls ?? [] },
  }));

  const items = [...activityItems, ...postItems]
    .sort(
      (a, b) =>
        new Date(b.data.created_at).getTime() -
        new Date(a.data.created_at).getTime()
    )
    .slice(0, COMMUNITY_FEED_PAGE_SIZE);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Main feed */}
      <div className="space-y-4">
        <CreatePostForm userId={user.id} />
        <FeedList initialItems={items} userId={user.id} />
      </div>

      {/* Sidebar */}
      <aside className="hidden lg:block">
        <Suspense
          fallback={
            <div className="animate-pulse rounded-xl border border-surface-200 bg-white p-5 h-64" />
          }
        >
          <CommunityStats />
        </Suspense>
      </aside>
    </div>
  );
}
