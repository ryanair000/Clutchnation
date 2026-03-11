import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { REACTION_TYPES_ENUM } from '@/types';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { target_type, target_id, reaction_type } = body;

  if (!target_type || !target_id || !reaction_type) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (!['post', 'activity', 'comment'].includes(target_type)) {
    return NextResponse.json({ error: 'Invalid target_type' }, { status: 400 });
  }
  if (!REACTION_TYPES_ENUM.includes(reaction_type)) {
    return NextResponse.json({ error: 'Invalid reaction_type' }, { status: 400 });
  }

  // Check if reaction already exists
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .maybeSingle();

  const countTable =
    target_type === 'post' ? 'community_posts'
    : target_type === 'activity' ? 'activity_events'
    : null;

  if (!countTable) {
    // Comments don't have a separate count table — reaction stored but no aggregate update
  }

  if (existing) {
    // Remove reaction
    await supabase.from('reactions').delete().eq('id', existing.id);

    // Decrement count on parent (skip for comments — no aggregate column)
    let newCount = 0;
    if (countTable) {
      const { data: target } = await supabase
        .from(countTable)
        .select('reaction_count')
        .eq('id', target_id)
        .single();

      newCount = Math.max(0, (target?.reaction_count ?? 1) - 1);
      await supabase
        .from(countTable)
        .update({ reaction_count: newCount })
        .eq('id', target_id);
    }

    return NextResponse.json({ action: 'removed', new_count: newCount });
  }

  // Insert reaction
  const { error } = await supabase.from('reactions').insert({
    user_id: user.id,
    target_type,
    target_id,
    reaction_type,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Increment count on parent (skip for comments)
  let newCount = 1;
  if (countTable) {
    const { data: target } = await supabase
      .from(countTable)
      .select('reaction_count')
      .eq('id', target_id)
      .single();

    newCount = (target?.reaction_count ?? 0) + 1;
    await supabase
      .from(countTable)
      .update({ reaction_count: newCount })
      .eq('id', target_id);
  }

  return NextResponse.json({ action: 'added', new_count: newCount });
}
