import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { threadId, body } = await request.json();
  if (!threadId || !body) {
    return NextResponse.json({ error: 'threadId and body are required' }, { status: 400 });
  }
  if (typeof body !== 'string' || body.length > 2000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 });
  }

  // Verify user is a participant
  const { data: thread } = await supabase
    .from('dm_threads')
    .select('id, user_a_id, user_b_id')
    .eq('id', threadId)
    .single();
  if (!thread) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
  }
  if (thread.user_a_id !== user.id && thread.user_b_id !== user.id) {
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
  }

  // Check block
  const otherId = thread.user_a_id === user.id ? thread.user_b_id : thread.user_a_id;
  const { data: block } = await supabase
    .from('blocks')
    .select('id')
    .or(
      `and(blocker_id.eq.${user.id},blocked_id.eq.${otherId}),and(blocker_id.eq.${otherId},blocked_id.eq.${user.id})`
    )
    .limit(1)
    .maybeSingle();
  if (block) {
    return NextResponse.json({ error: 'Cannot message this user' }, { status: 403 });
  }

  // Insert message
  const { data: msg, error: msgErr } = await supabase
    .from('messages')
    .insert({
      channel_type: 'dm',
      channel_id: threadId,
      sender_id: user.id,
      body,
    })
    .select('id')
    .single();
  if (msgErr) {
    return NextResponse.json({ error: msgErr.message }, { status: 500 });
  }

  // Update thread timestamp
  await supabase
    .from('dm_threads')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', threadId);

  return NextResponse.json({ messageId: msg.id });
}
