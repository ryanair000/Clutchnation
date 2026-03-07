import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin';
import { formatDateTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'Audit Log' };

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { page: pageParam, action: actionFilter } = await searchParams;

  const page = Math.max(1, parseInt(pageParam ?? '1', 10));
  const perPage = 30;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from('audit_logs')
    .select('id, actor_id, action, target_type, target_id, metadata, created_at', { count: 'exact' });

  if (actionFilter) {
    query = query.eq('action', actionFilter);
  }

  const { data: logs, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  const totalPages = Math.ceil((count ?? 0) / perPage);

  // Get actor usernames
  const actorIds = [...new Set((logs ?? []).map((l) => l.actor_id).filter(Boolean))] as string[];
  let actorMap: Record<string, string> = {};
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', actorIds);
    actorMap = Object.fromEntries((actors ?? []).map((a) => [a.id, a.username ?? 'Unknown']));
  }

  // Get unique actions for filter
  const { data: allActions } = await supabase
    .from('audit_logs')
    .select('action')
    .limit(100);
  const uniqueActions = [...new Set((allActions ?? []).map((a) => a.action))].sort();

  const actionColors: Record<string, string> = {
    user_ban: 'bg-red-100 text-red-700',
    user_unban: 'bg-green-100 text-green-700',
    user_promote: 'bg-brand/10 text-brand',
    user_demote: 'bg-amber-100 text-amber-700',
    dispute_resolved: 'bg-blue-100 text-blue-700',
    report_actioned: 'bg-red-100 text-red-700',
    report_reviewed: 'bg-blue-100 text-blue-700',
    report_dismissed: 'bg-gray-100 text-gray-600',
  };

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold">Audit Log</h2>
      <p className="mt-1 text-sm text-ink-muted">{count ?? 0} total entries</p>

      {/* Action filter */}
      {uniqueActions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1">
          <a
            href="/admin/audit-log"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              !actionFilter ? 'bg-brand text-white' : 'bg-surface-50 text-ink-muted hover:bg-surface-100'
            }`}
          >
            All
          </a>
          {uniqueActions.map((action) => (
            <a
              key={action}
              href={`/admin/audit-log?action=${action}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                actionFilter === action ? 'bg-brand text-white' : 'bg-surface-50 text-ink-muted hover:bg-surface-100'
              }`}
            >
              {formatActionLabel(action)}
            </a>
          ))}
        </div>
      )}

      {/* Log entries */}
      <div className="mt-4 space-y-2">
        {(logs ?? []).map((log) => (
          <div key={log.id} className="rounded-lg border border-surface-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${actionColors[log.action] ?? 'bg-gray-100 text-gray-700'}`}>
                  {formatActionLabel(log.action)}
                </span>
                <span className="text-sm text-ink-muted">
                  by <span className="font-medium text-ink">{log.actor_id ? actorMap[log.actor_id] ?? 'System' : 'System'}</span>
                </span>
              </div>
              <span className="text-xs text-ink-muted">{formatDateTime(log.created_at)}</span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-ink-muted">
              <span>Target: <span className="font-medium">{log.target_type}</span></span>
              <span>ID: <span className="font-mono">{log.target_id.slice(0, 12)}...</span></span>
            </div>
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div className="mt-2 rounded bg-surface-50 px-3 py-2 text-xs font-mono text-ink-muted">
                {Object.entries(log.metadata).map(([key, val]) => (
                  <div key={key}>
                    <span className="text-ink">{key}:</span> {String(val ?? 'null')}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {(logs ?? []).length === 0 && (
          <div className="rounded-lg border border-surface-200 bg-white p-8 text-center text-sm text-ink-muted">
            No audit log entries{actionFilter ? ` for action "${actionFilter}"` : ''}.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/admin/audit-log?page=${page - 1}${actionFilter ? `&action=${actionFilter}` : ''}`}
              className="rounded-lg border border-surface-200 px-3 py-1.5 text-sm hover:bg-surface-50 transition-colors"
            >
              Previous
            </a>
          )}
          <span className="text-sm text-ink-muted">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <a
              href={`/admin/audit-log?page=${page + 1}${actionFilter ? `&action=${actionFilter}` : ''}`}
              className="rounded-lg border border-surface-200 px-3 py-1.5 text-sm hover:bg-surface-50 transition-colors"
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function formatActionLabel(action: string): string {
  return action
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
