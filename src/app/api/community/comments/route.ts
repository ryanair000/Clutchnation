import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MAX_COMMENT_LENGTH } from '@/lib/constants';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get('target_type');
  const targetId = searchParams.get('target_id');
  const cursor = searchParams.get('cursor');
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);

  if (!targetType || !targetId) {
    return NextResponse.json({ error: 'Missing target_type or target_id' }, { status: 400 });
  }

  let query = supabase
    .from('comments')
    .select(
      '*, author:profiles!comments_author_id_fkey(username, avatar_url)'
    )
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (cursor) {
    query = query.gt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const nextCursor =
    data && data.length === limit ? data[data.length - 1].created_at : null;

  return NextResponse.json({ comments: data ?? [], nextCursor });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { target_type, target_id, body: commentBody } = body;

  if (!target_type || !target_id || !commentBody) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (!['post', 'activity'].includes(target_type)) {
    return NextResponse.json({ error: 'Invalid target_type' }, { status: 400 });
  }

  const trimmed = String(commentBody).trim();
  if (trimmed.length === 0 || trimmed.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: `Comment must be 1-${MAX_COMMENT_LENGTH} characters` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      author_id: user.id,
      target_type,
      target_id,
      body: trimmed,
    })
    .select(
      '*, author:profiles!comments_author_id_fkey(username, avatar_url)'
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Increment comment_count on target
  const countTable =
    target_type === 'post' ? 'community_posts' : 'activity_events';
  const { data: target } = await supabase
    .from(countTable)
    .select('comment_count')
    .eq('id', target_id)
    .single();

  await supabase
    .from(countTable)
    .update({ comment_count: (target?.comment_count ?? 0) + 1 })
    .eq('id', target_id);

  return NextResponse.json({ comment: data });
}
