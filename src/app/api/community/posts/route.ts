import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MAX_POST_LENGTH, MAX_POST_MEDIA, COMMUNITY_FEED_PAGE_SIZE } from '@/lib/constants';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const groupId = searchParams.get('group_id');
  const limit = Math.min(
    Number(searchParams.get('limit')) || COMMUNITY_FEED_PAGE_SIZE,
    50
  );

  let query = supabase
    .from('community_posts')
    .select(
      '*, author:profiles!community_posts_author_id_fkey(username, avatar_url)'
    )
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (groupId) {
    query = query.eq('group_id', groupId);
  } else {
    query = query.is('group_id', null);
  }

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const posts = (data ?? []).map((p) => ({
    ...p,
    media_urls: p.media_urls ?? [],
  }));

  const nextCursor =
    posts.length === limit ? posts[posts.length - 1].created_at : null;

  return NextResponse.json({ posts, nextCursor });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { post_type, title, content, media_urls, group_id } = body;

  if (!post_type || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (!['text', 'media', 'discussion'].includes(post_type)) {
    return NextResponse.json({ error: 'Invalid post_type' }, { status: 400 });
  }

  const trimmedContent = String(content).trim();
  if (trimmedContent.length === 0 || trimmedContent.length > MAX_POST_LENGTH) {
    return NextResponse.json(
      { error: `Content must be 1-${MAX_POST_LENGTH} characters` },
      { status: 400 }
    );
  }

  if (post_type === 'discussion' && title) {
    const trimmedTitle = String(title).trim();
    if (trimmedTitle.length > 150) {
      return NextResponse.json(
        { error: 'Title must be 150 characters or less' },
        { status: 400 }
      );
    }
  }

  const urls = Array.isArray(media_urls) ? media_urls.slice(0, MAX_POST_MEDIA) : [];

  // If group_id provided, verify membership
  if (group_id) {
    const { data: membership } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a group member to post' },
        { status: 403 }
      );
    }
  }

  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      author_id: user.id,
      post_type,
      title: title ? String(title).trim() : null,
      content: trimmedContent,
      media_urls: urls,
      group_id: group_id ?? null,
    })
    .select(
      '*, author:profiles!community_posts_author_id_fkey(username, avatar_url)'
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    post: { ...data, media_urls: data.media_urls ?? [] },
  });
}
