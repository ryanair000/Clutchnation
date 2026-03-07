import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { username, message } = await request.json();
  if (!username || !message) {
    return NextResponse.json({ error: 'Username and message are required' }, { status: 400 });
  }
  if (typeof message !== 'string' || message.length > 2000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 });
  }

  // Find recipient
  const { data: recipient } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();
  if (!recipient) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (recipient.id === user.id) {
    return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
  }

  // Check if blocked
  const { data: block } = await supabase
    .from('blocks')
    .select('id')
    .or(
      `and(blocker_id.eq.${user.id},blocked_id.eq.${recipient.id}),and(blocker_id.eq.${recipient.id},blocked_id.eq.${user.id})`
    )
    .limit(1)
    .maybeSingle();
  if (block) {
    return NextResponse.json({ error: 'Cannot message this user' }, { status: 403 });
  }

  // Check for existing thread (order user IDs for canonical lookup)
  const [userA, userB] = [user.id, recipient.id].sort();
  const { data: existing } = await supabase
    .from('dm_threads')
    .select('id')
    .eq('user_a_id', userA)
    .eq('user_b_id', userB)
    .maybeSingle();

  let threadId: string;
  if (existing) {
    threadId = existing.id;
  } else {
    const { data: newThread, error: threadErr } = await supabase
      .from('dm_threads')
      .insert({ user_a_id: userA, user_b_id: userB })
      .select('id')
      .single();
    if (threadErr || !newThread) {
      return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
    }
    threadId = newThread.id;
  }

  // Send the initial message
  const { error: msgErr } = await supabase.from('messages').insert({
    channel_type: 'dm',
    channel_id: threadId,
    sender_id: user.id,
    body: message,
  });
  if (msgErr) {
    return NextResponse.json({ error: msgErr.message }, { status: 500 });
  }

  // Update last_message_at
  await supabase
    .from('dm_threads')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', threadId);

  return NextResponse.json({ threadId });
}
