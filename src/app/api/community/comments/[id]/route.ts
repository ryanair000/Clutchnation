import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  // Check ownership or admin
  const { data: comment } = await supabase
    .from('comments')
    .select('id, author_id, target_type, target_id')
    .eq('id', id)
    .single();

  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (comment.author_id !== user.id && !profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Soft delete
  const { error } = await supabase
    .from('comments')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Decrement comment_count on target
  const countTable =
    comment.target_type === 'post' ? 'community_posts' : 'activity_events';
  const { data: target } = await supabase
    .from(countTable)
    .select('comment_count')
    .eq('id', comment.target_id)
    .single();

  await supabase
    .from(countTable)
    .update({ comment_count: Math.max(0, (target?.comment_count ?? 1) - 1) })
    .eq('id', comment.target_id);

  return NextResponse.json({ success: true });
}
