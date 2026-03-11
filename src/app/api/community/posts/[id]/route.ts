import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MAX_POST_LENGTH } from '@/lib/constants';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: post } = await supabase
    .from('community_posts')
    .select('id, author_id')
    .eq('id', id)
    .single();

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
  if (post.author_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.content !== undefined) {
    const trimmed = String(body.content).trim();
    if (trimmed.length === 0 || trimmed.length > MAX_POST_LENGTH) {
      return NextResponse.json(
        { error: `Content must be 1-${MAX_POST_LENGTH} characters` },
        { status: 400 }
      );
    }
    updates.content = trimmed;
  }
  if (body.title !== undefined) {
    updates.title = body.title ? String(body.title).trim().slice(0, 150) : null;
  }

  const { data, error } = await supabase
    .from('community_posts')
    .update(updates)
    .eq('id', id)
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: post } = await supabase
    .from('community_posts')
    .select('id, author_id')
    .eq('id', id)
    .single();

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (post.author_id !== user.id && !profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase
    .from('community_posts')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
