import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin';
import { UserManagementTable } from '@/components/admin/user-management-table';

export const metadata: Metadata = { title: 'User Management' };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; page?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { q, filter, page: pageParam } = await searchParams;

  const page = Math.max(1, parseInt(pageParam ?? '1', 10));
  const perPage = 20;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from('profiles')
    .select('id, username, psn_online_id, avatar_url, is_admin, is_banned, created_at, stats_matches_played, stats_tournaments_played', { count: 'exact' });

  if (q) {
    query = query.or(`username.ilike.%${q}%,psn_online_id.ilike.%${q}%`);
  }

  if (filter === 'banned') {
    query = query.eq('is_banned', true);
  } else if (filter === 'admins') {
    query = query.eq('is_admin', true);
  }

  const { data: users, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold">User Management</h2>
      <p className="mt-1 text-sm text-ink-muted">{count ?? 0} total users</p>

      <UserManagementTable
        users={users ?? []}
        currentPage={page}
        totalPages={totalPages}
        query={q ?? ''}
        filter={filter ?? 'all'}
      />
    </div>
  );
}
