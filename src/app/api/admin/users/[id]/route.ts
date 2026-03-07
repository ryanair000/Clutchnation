import { NextRequest, NextResponse } from 'next/server';
import { checkAdminApi } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdminApi();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action } = body as { action: string };

  if (!['ban', 'unban', 'promote', 'demote'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // Prevent self-modification
  if (id === admin.userId) {
    return NextResponse.json({ error: 'Cannot modify own account' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get target user
  const { data: target } = await supabase
    .from('profiles')
    .select('id, username, is_admin, is_banned')
    .eq('id', id)
    .single();

  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let updateData: Record<string, boolean> = {};

  switch (action) {
    case 'ban':
      updateData = { is_banned: true };
      break;
    case 'unban':
      updateData = { is_banned: false };
      break;
    case 'promote':
      updateData = { is_admin: true };
      break;
    case 'demote':
      if (target.id === admin.userId) {
        return NextResponse.json({ error: 'Cannot demote yourself' }, { status: 400 });
      }
      updateData = { is_admin: false };
      break;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    actor_id: admin.userId,
    action: `user_${action}`,
    target_type: 'profile',
    target_id: id,
    metadata: { username: target.username },
  });

  return NextResponse.json({ success: true });
}
