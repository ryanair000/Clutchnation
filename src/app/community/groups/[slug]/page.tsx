import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { GroupHeader } from '@/components/community/group-header';
import { GroupMemberList } from '@/components/community/group-member-list';
import { FeedList } from '@/components/community/feed-list';
import { CreatePostForm } from '@/components/community/create-post-form';
import { COMMUNITY_FEED_PAGE_SIZE } from '@/lib/constants';
import type { FeedItem } from '@/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: group } = await supabase
    .from('groups')
    .select(
      '*, owner:profiles!groups_owner_id_fkey(username, avatar_url)'
    )
    .eq('slug', slug)
    .single();

  if (!group) notFound();

  // Check membership
  const { data: membership } = await supabase
    .from('group_members')
    .select('id, role')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .maybeSingle();

  const isMember = !!membership;

  // For private groups, non-members can't see content
  if (!group.is_public && !isMember) notFound();

  // Fetch members
  const { data: members } = await supabase
    .from('group_members')
    .select(
      '*, profile:profiles!group_members_user_id_fkey(username, avatar_url)'
    )
    .eq('group_id', group.id)
    .order('joined_at', { ascending: true });

  // Fetch group posts
  const { data: posts } = await supabase
    .from('community_posts')
    .select(
      '*, author:profiles!community_posts_author_id_fkey(username, avatar_url)'
    )
    .eq('group_id', group.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(COMMUNITY_FEED_PAGE_SIZE);

  const feedItems: FeedItem[] = (posts ?? []).map((p) => ({
    type: 'post' as const,
    data: { ...p, media_urls: p.media_urls ?? [] },
  }));

  return (
    <div className="space-y-6">
      <GroupHeader
        group={group}
        isMember={isMember}
        memberRole={membership?.role ?? null}
        slug={slug}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Group Feed */}
        <div className="space-y-4">
          {isMember && (
            <CreatePostForm userId={user.id} groupId={group.id} />
          )}
          {feedItems.length === 0 ? (
            <div className="rounded-xl border border-surface-200 bg-white p-10 text-center">
              <p className="text-ink-muted">
                No posts yet. {isMember ? 'Be the first to post!' : ''}
              </p>
            </div>
          ) : (
            <FeedList
              initialItems={feedItems}
              userId={user.id}
              groupId={group.id}
            />
          )}
        </div>

        {/* Members Sidebar */}
        <aside>
          <GroupMemberList
            members={members ?? []}
            ownerId={group.owner_id}
          />
        </aside>
      </div>
    </div>
  );
}
