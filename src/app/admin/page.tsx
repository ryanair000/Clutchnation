import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';

export const metadata: Metadata = { title: 'Admin Overview' };

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdmin();

  // Fetch platform stats in parallel
  const [
    usersResult,
    matchesResult,
    tournamentsResult,
    openReportsResult,
    disputedMatchesResult,
    recentAuditResult,
    bannedResult,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('matches').select('id', { count: 'exact', head: true }),
    supabase.from('tournaments').select('id', { count: 'exact', head: true }),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'disputed'),
    supabase
      .from('audit_logs')
      .select('id, actor_id, action, target_type, target_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_banned', true),
  ]);

  const totalUsers = usersResult.count ?? 0;
  const totalMatches = matchesResult.count ?? 0;
  const totalTournaments = tournamentsResult.count ?? 0;
  const openReports = openReportsResult.count ?? 0;
  const disputedMatches = disputedMatchesResult.count ?? 0;
  const bannedUsers = bannedResult.count ?? 0;
  const recentAudit = recentAuditResult.data ?? [];

  const statCards = [
    { label: 'Total Users', value: totalUsers, color: 'text-brand' },
    { label: 'Total Matches', value: totalMatches, color: 'text-ink' },
    { label: 'Total Tournaments', value: totalTournaments, color: 'text-ink' },
    { label: 'Open Reports', value: openReports, color: openReports > 0 ? 'text-red-600' : 'text-ink', href: '/admin/reports' },
    { label: 'Disputed Matches', value: disputedMatches, color: disputedMatches > 0 ? 'text-amber-600' : 'text-ink', href: '/admin/disputes' },
    { label: 'Banned Users', value: bannedUsers, color: bannedUsers > 0 ? 'text-red-600' : 'text-ink', href: '/admin/users?filter=banned' },
  ];

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold">Platform Overview</h2>

      {/* Stats grid */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const inner = (
            <div className="rounded-lg border border-surface-200 bg-white p-4">
              <p className="text-xs font-medium text-ink-muted">{card.label}</p>
              <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          );
          return card.href ? (
            <Link key={card.label} href={card.href} className="hover:ring-2 hover:ring-brand/20 rounded-lg transition-shadow">
              {inner}
            </Link>
          ) : (
            <div key={card.label}>{inner}</div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h3 className="font-heading text-base font-semibold">Quick Actions</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/admin/users" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
            Manage Users
          </Link>
          <Link href="/admin/disputes" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors">
            Resolve Disputes ({disputedMatches})
          </Link>
          <Link href="/admin/reports" className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors">
            Review Reports ({openReports})
          </Link>
        </div>
      </div>

      {/* Recent audit log */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-base font-semibold">Recent Activity</h3>
          <Link href="/admin/audit-log" className="text-sm text-brand hover:underline">View all</Link>
        </div>
        {recentAudit.length > 0 ? (
          <div className="mt-3 space-y-2">
            {recentAudit.map((log) => (
              <div key={log.id} className="rounded-lg border border-surface-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {formatAction(log.action)}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  Target: {log.target_type} · {log.target_id.slice(0, 8)}...
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">No admin activity recorded yet.</p>
        )}
      </div>
    </div>
  );
}

function formatAction(action: string): string {
  return action
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
