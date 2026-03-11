import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: group } = await supabase
    .from('groups')
    .select('id, is_public, max_members, member_count')
    .eq('slug', slug)
    .single();

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Already a member' }, { status: 409 });
  }

  if (!group.is_public) {
    return NextResponse.json(
      { error: 'This group is private. You need an invitation.' },
      { status: 403 }
    );
  }

  if (group.member_count >= group.max_members) {
    return NextResponse.json({ error: 'Group is full' }, { status: 400 });
  }

  // Join
  const { error } = await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: user.id,
    role: 'member',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Increment member count
  await supabase
    .from('groups')
    .update({ member_count: group.member_count + 1 })
    .eq('id', group.id);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: group } = await supabase
    .from('groups')
    .select('id, owner_id, member_count')
    .eq('slug', slug)
    .single();

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const kickUserId = searchParams.get('user_id');

  if (kickUserId && kickUserId !== user.id) {
    // Kicking another user — must be owner or admin
    const { data: actorMembership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (
      !actorMembership ||
      (actorMembership.role !== 'owner' && actorMembership.role !== 'admin')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Can't kick the owner
    if (kickUserId === group.owner_id) {
      return NextResponse.json({ error: 'Cannot remove the group owner' }, { status: 400 });
    }

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', group.id)
      .eq('user_id', kickUserId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // Leaving the group
    if (user.id === group.owner_id) {
      return NextResponse.json(
        { error: 'Owner cannot leave. Transfer ownership first.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', group.id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Decrement member count
  await supabase
    .from('groups')
    .update({ member_count: Math.max(0, group.member_count - 1) })
    .eq('id', group.id);

  return NextResponse.json({ success: true });
}
