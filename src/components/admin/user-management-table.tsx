'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';

interface User {
  id: string;
  username: string | null;
  psn_online_id: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
  stats_matches_played: number;
  stats_tournaments_played: number;
}

interface Props {
  users: User[];
  currentPage: number;
  totalPages: number;
  query: string;
  filter: string;
}

export function UserManagementTable({ users, currentPage, totalPages, query, filter }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [loading, setLoading] = useState<string | null>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (filter !== 'all') params.set('filter', filter);
    router.push(`/admin/users?${params.toString()}`);
  }

  function handleFilter(f: string) {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (f !== 'all') params.set('filter', f);
    router.push(`/admin/users?${params.toString()}`);
  }

  async function handleAction(userId: string, action: string) {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    setLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed');
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'banned', label: 'Banned' },
    { key: 'admins', label: 'Admins' },
  ];

  return (
    <div className="mt-4">
      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username or PSN ID..."
            className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button type="submit" className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
            Search
          </button>
        </form>

        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => handleFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-brand text-white'
                  : 'bg-surface-50 text-ink-muted hover:bg-surface-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-surface-200">
        <table className="w-full text-sm">
          <thead className="bg-surface-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-ink-muted">User</th>
              <th className="hidden px-4 py-3 text-left font-medium text-ink-muted md:table-cell">PSN ID</th>
              <th className="hidden px-4 py-3 text-center font-medium text-ink-muted lg:table-cell">Matches</th>
              <th className="px-4 py-3 text-center font-medium text-ink-muted">Status</th>
              <th className="px-4 py-3 text-right font-medium text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 bg-white">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                        {getInitials(user.username ?? '?')}
                      </div>
                    )}
                    <div>
                      <Link href={`/profile/${user.username}`} className="font-medium hover:text-brand">
                        {user.username ?? 'No username'}
                      </Link>
                      <p className="text-xs text-ink-muted">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-ink-muted md:table-cell">
                  {user.psn_online_id ?? '—'}
                </td>
                <td className="hidden px-4 py-3 text-center lg:table-cell">
                  {user.stats_matches_played}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {user.is_admin && (
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">Admin</span>
                    )}
                    {user.is_banned && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Banned</span>
                    )}
                    {!user.is_admin && !user.is_banned && (
                      <span className="text-xs text-ink-muted">Active</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {loading === user.id ? (
                      <span className="text-xs text-ink-muted">Processing...</span>
                    ) : (
                      <>
                        {user.is_banned ? (
                          <button
                            onClick={() => handleAction(user.id, 'unban')}
                            className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 transition-colors"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(user.id, 'ban')}
                            className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
                          >
                            Ban
                          </button>
                        )}
                        {user.is_admin ? (
                          <button
                            onClick={() => handleAction(user.id, 'demote')}
                            className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200 transition-colors"
                          >
                            Demote
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(user.id, 'promote')}
                            className="rounded bg-brand/10 px-2 py-1 text-xs font-medium text-brand hover:bg-brand/20 transition-colors"
                          >
                            Promote
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-muted">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/admin/users?page=${currentPage - 1}${query ? `&q=${query}` : ''}${filter !== 'all' ? `&filter=${filter}` : ''}`}
              className="rounded-lg border border-surface-200 px-3 py-1.5 text-sm hover:bg-surface-50 transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-ink-muted">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/admin/users?page=${currentPage + 1}${query ? `&q=${query}` : ''}${filter !== 'all' ? `&filter=${filter}` : ''}`}
              className="rounded-lg border border-surface-200 px-3 py-1.5 text-sm hover:bg-surface-50 transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
