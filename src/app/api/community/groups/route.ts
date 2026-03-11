import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MAX_GROUP_MEMBERS, GROUP_NAME_REGEX } from '@/lib/constants';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const cursor = Number(searchParams.get('cursor')) || 0;
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);

  let query = supabase
    .from('groups')
    .select(
      '*, owner:profiles!groups_owner_id_fkey(username, avatar_url)'
    )
    .eq('is_public', true)
    .order('member_count', { ascending: false });

  if (q) {
    query = query.ilike('name', `%${q}%`);
  }

  query = query.range(cursor, cursor + limit - 1);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const nextCursor =
    (data ?? []).length === limit ? cursor + limit : null;

  return NextResponse.json({ groups: data ?? [], nextCursor });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, description, is_public } = body;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const trimmedName = String(name).trim();
  if (!GROUP_NAME_REGEX.test(trimmedName)) {
    return NextResponse.json(
      { error: 'Group name must be 3-50 characters' },
      { status: 400 }
    );
  }

  const slug = slugify(trimmedName);
  if (!slug) {
    return NextResponse.json(
      { error: 'Could not generate a valid slug for this name' },
      { status: 400 }
    );
  }

  // Check slug uniqueness
  const { data: existingSlug } = await supabase
    .from('groups')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existingSlug) {
    return NextResponse.json(
      { error: 'A group with a similar name already exists' },
      { status: 409 }
    );
  }

  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      name: trimmedName,
      slug,
      description: description ? String(description).trim().slice(0, 500) : null,
      owner_id: user.id,
      is_public: is_public !== false,
      max_members: MAX_GROUP_MEMBERS,
      member_count: 1,
    })
    .select(
      '*, owner:profiles!groups_owner_id_fkey(username, avatar_url)'
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add owner as member
  await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: user.id,
    role: 'owner',
  });

  return NextResponse.json({ group });
}
