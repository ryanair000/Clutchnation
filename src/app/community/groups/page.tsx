import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { GroupCard } from '@/components/community/group-card';

export const metadata: Metadata = { title: 'Groups' };

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const q = resolvedParams.q ?? '';

  let query = supabase
    .from('groups')
    .select(
      '*, owner:profiles!groups_owner_id_fkey(username, avatar_url)'
    )
    .eq('is_public', true)
    .order('member_count', { ascending: false })
    .limit(24);

  if (q) {
    query = query.ilike('name', `%${q}%`);
  }

  const { data: groups } = await query;

  // Also fetch user's groups (including private)
  const { data: myMemberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id);

  const myGroupIds = (myMemberships ?? []).map((m) => m.group_id);

  let myGroups: typeof groups = [];
  if (myGroupIds.length > 0) {
    const { data } = await supabase
      .from('groups')
      .select(
        '*, owner:profiles!groups_owner_id_fkey(username, avatar_url)'
      )
      .in('id', myGroupIds)
      .order('updated_at', { ascending: false });
    myGroups = data ?? [];
  }

  return (
    <div>
      {/* Header + Action */}
      <div className="mb-6 flex items-center justify-between">
        <form className="flex gap-3">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search groups…"
            className="rounded-lg border border-surface-300 px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button
            type="submit"
            className="rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-surface-50 transition-colors"
          >
            Search
          </button>
        </form>
        <Link
          href="/community/groups/create"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Create Group
        </Link>
      </div>

      {/* My Groups */}
      {myGroups && myGroups.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 font-heading text-lg font-semibold">My Groups</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myGroups.map((group) => (
              <GroupCard key={group.id} group={group} isMember />
            ))}
          </div>
        </div>
      )}

      {/* All Public Groups */}
      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold">
          {q ? `Results for "${q}"` : 'Public Groups'}
        </h2>
        {(groups ?? []).length === 0 ? (
          <div className="rounded-xl border border-surface-200 bg-white p-10 text-center">
            <p className="text-ink-muted">No groups found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(groups ?? []).map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                isMember={myGroupIds.includes(group.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
