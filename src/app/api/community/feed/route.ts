import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { COMMUNITY_FEED_PAGE_SIZE } from '@/lib/constants';
import type { FeedItem } from '@/types';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const filter = searchParams.get('filter') ?? 'all';
  const limit = Math.min(
    Number(searchParams.get('limit')) || COMMUNITY_FEED_PAGE_SIZE,
    50
  );

  const items: FeedItem[] = [];

  // Fetch activity events
  if (filter === 'all' || filter === 'activity') {
    let query = supabase
      .from('activity_events')
      .select(
        '*, actor:profiles!activity_events_actor_id_fkey(username, avatar_url)'
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data } = await query;
    (data ?? []).forEach((e) => items.push({ type: 'activity', data: e }));
  }

  // Fetch community posts
  if (filter === 'all' || filter === 'posts') {
    let query = supabase
      .from('community_posts')
      .select(
        '*, author:profiles!community_posts_author_id_fkey(username, avatar_url)'
      )
      .eq('is_deleted', false)
      .is('group_id', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data } = await query;
    (data ?? []).forEach((p) =>
      items.push({
        type: 'post',
        data: { ...p, media_urls: p.media_urls ?? [] },
      })
    );
  }

  // Merge and sort
  items.sort(
    (a, b) =>
      new Date(b.data.created_at).getTime() -
      new Date(a.data.created_at).getTime()
  );

  const page = items.slice(0, limit);
  const nextCursor =
    page.length === limit ? page[page.length - 1].data.created_at : null;

  return NextResponse.json({ items: page, nextCursor });
}
