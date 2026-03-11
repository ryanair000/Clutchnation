import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: group, error } = await supabase
    .from('groups')
    .select(
      '*, owner:profiles!groups_owner_id_fkey(username, avatar_url)'
    )
    .eq('slug', slug)
    .single();

  if (error || !group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  // Check access for private groups
  if (!group.is_public) {
    const { data: membership } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Fetch members
  const { data: members } = await supabase
    .from('group_members')
    .select(
      '*, profile:profiles!group_members_user_id_fkey(username, avatar_url)'
    )
    .eq('group_id', group.id)
    .order('joined_at', { ascending: true });

  return NextResponse.json({ group, members: members ?? [] });
}

export async function PATCH(
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
    .select('id, owner_id')
    .eq('slug', slug)
    .single();

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  // Check if owner or admin member
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.description !== undefined) {
    updates.description = body.description
      ? String(body.description).trim().slice(0, 500)
      : null;
  }
  if (body.is_public !== undefined) {
    updates.is_public = Boolean(body.is_public);
  }

  const { data, error } = await supabase
    .from('groups')
    .update(updates)
    .eq('id', group.id)
    .select(
      '*, owner:profiles!groups_owner_id_fkey(username, avatar_url)'
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ group: data });
}
