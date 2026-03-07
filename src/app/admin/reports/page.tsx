import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin';
import { ReportsList } from '@/components/admin/reports-list';

export const metadata: Metadata = { title: 'Reports' };

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { status: filterStatus } = await searchParams;

  const statusFilter = filterStatus ?? 'open';

  let query = supabase
    .from('reports')
    .select(`
      id, reason, details, status, admin_notes, created_at, context_type, context_id,
      reporter:profiles!reports_reporter_id_fkey(id, username, avatar_url),
      reported:profiles!reports_reported_user_id_fkey(id, username, avatar_url),
      resolver:profiles!reports_resolved_by_fkey(username)
    `)
    .order('created_at', { ascending: statusFilter === 'open' });

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: reports } = await query.limit(50);

  // Count by status
  const [openCount, reviewedCount, actionedCount, dismissedCount] = await Promise.all([
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'reviewed'),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'actioned'),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'dismissed'),
  ]);

  const counts = {
    open: openCount.count ?? 0,
    reviewed: reviewedCount.count ?? 0,
    actioned: actionedCount.count ?? 0,
    dismissed: dismissedCount.count ?? 0,
  };

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold">Reports</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {counts.open} open · {counts.reviewed} reviewed · {counts.actioned} actioned · {counts.dismissed} dismissed
      </p>

      <ReportsList
        reports={reports ?? []}
        activeFilter={statusFilter}
        counts={counts}
      />
    </div>
  );
}
