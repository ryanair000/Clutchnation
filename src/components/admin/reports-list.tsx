'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDate, getInitials } from '@/lib/utils';

interface ProfileInfo {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  context_type: string | null;
  context_id: string | null;
  reporter: ProfileInfo | ProfileInfo[] | null;
  reported: ProfileInfo | ProfileInfo[] | null;
  resolver: { username: string | null } | { username: string | null }[] | null;
}

interface Props {
  reports: Report[];
  activeFilter: string;
  counts: { open: number; reviewed: number; actioned: number; dismissed: number };
}

function unwrap<T>(p: T | T[] | null): T | null {
  if (!p) return null;
  return Array.isArray(p) ? p[0] ?? null : p;
}

const reasonLabels: Record<string, string> = {
  cheating: 'Cheating',
  harassment: 'Harassment',
  impersonation: 'Impersonation',
  spam: 'Spam',
  other: 'Other',
};

const reasonColors: Record<string, string> = {
  cheating: 'bg-red-100 text-red-700',
  harassment: 'bg-orange-100 text-orange-700',
  impersonation: 'bg-purple-100 text-purple-700',
  spam: 'bg-yellow-100 text-yellow-700',
  other: 'bg-gray-100 text-gray-700',
};

const statusFilters = [
  { key: 'open', label: 'Open' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'actioned', label: 'Actioned' },
  { key: 'dismissed', label: 'Dismissed' },
  { key: 'all', label: 'All' },
];

export function ReportsList({ reports, activeFilter, counts }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function handleAction(reportId: string, status: string) {
    const adminNotes = notes[reportId];
    if (!confirm(`Mark this report as "${status}"?`)) return;

    setLoading(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes: adminNotes || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update report');
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-4">
      {/* Status filter tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {statusFilters.map((f) => {
          const count = f.key === 'all' ? null : counts[f.key as keyof typeof counts];
          return (
            <Link
              key={f.key}
              href={`/admin/reports?status=${f.key}`}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeFilter === f.key
                  ? 'bg-brand text-white'
                  : 'bg-surface-50 text-ink-muted hover:bg-surface-100'
              }`}
            >
              {f.label}{count !== null ? ` (${count})` : ''}
            </Link>
          );
        })}
      </div>

      {/* Reports list */}
      <div className="mt-4 space-y-4">
        {reports.map((report) => {
          const reporter = unwrap(report.reporter);
          const reported = unwrap(report.reported);
          const resolver = unwrap(report.resolver);
          const isOpen = report.status === 'open';

          return (
            <div
              key={report.id}
              className={`rounded-lg border p-4 ${
                isOpen ? 'border-red-200 bg-red-50' : 'border-surface-200 bg-white'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${reasonColors[report.reason] ?? 'bg-gray-100 text-gray-700'}`}>
                    {reasonLabels[report.reason] ?? report.reason}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    report.status === 'open' ? 'bg-red-100 text-red-700'
                    : report.status === 'actioned' ? 'bg-green-100 text-green-700'
                    : report.status === 'dismissed' ? 'bg-gray-100 text-gray-600'
                    : 'bg-blue-100 text-blue-700'
                  }`}>
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </span>
                </div>
                <span className="text-xs text-ink-muted">{formatDate(report.created_at)}</span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-ink-muted">Reported By</p>
                  <div className="mt-1 flex items-center gap-2">
                    {reporter?.avatar_url ? (
                      <img src={reporter.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                        {getInitials(reporter?.username ?? '?')}
                      </div>
                    )}
                    <Link href={`/profile/${reporter?.username}`} className="text-sm font-medium hover:text-brand">
                      {reporter?.username ?? 'Unknown'}
                    </Link>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-muted">Reported User</p>
                  <div className="mt-1 flex items-center gap-2">
                    {reported?.avatar_url ? (
                      <img src={reported.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {getInitials(reported?.username ?? '?')}
                      </div>
                    )}
                    <Link href={`/profile/${reported?.username}`} className="text-sm font-medium hover:text-brand">
                      {reported?.username ?? 'Unknown'}
                    </Link>
                  </div>
                </div>
              </div>

              {report.details && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-ink-muted">Details</p>
                  <p className="mt-1 text-sm">{report.details}</p>
                </div>
              )}

              {report.context_type && report.context_id && (
                <div className="mt-2">
                  <Link
                    href={report.context_type === 'match' ? `/matches/${report.context_id}` : '#'}
                    className="text-xs text-brand hover:underline"
                  >
                    View {report.context_type} context
                  </Link>
                </div>
              )}

              {report.admin_notes && (
                <div className="mt-3 rounded-lg bg-surface-50 p-2">
                  <p className="text-xs font-medium text-ink-muted">Admin Notes</p>
                  <p className="text-sm">{report.admin_notes}</p>
                </div>
              )}

              {!isOpen && resolver && (
                <p className="mt-2 text-xs text-ink-muted">
                  Resolved by {resolver.username ?? 'Admin'}
                </p>
              )}

              {/* Actions for open reports */}
              {isOpen && (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={notes[report.id] ?? ''}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [report.id]: e.target.value }))}
                    placeholder="Admin notes (optional)..."
                    rows={2}
                    className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <div className="flex gap-2">
                    {loading === report.id ? (
                      <span className="text-sm text-ink-muted">Processing...</span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAction(report.id, 'actioned')}
                          className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
                        >
                          Action (Ban/Warn)
                        </button>
                        <button
                          onClick={() => handleAction(report.id, 'reviewed')}
                          className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
                        >
                          Mark Reviewed
                        </button>
                        <button
                          onClick={() => handleAction(report.id, 'dismissed')}
                          className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-semibold text-ink-muted hover:bg-gray-300 transition-colors"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {reports.length === 0 && (
          <div className="rounded-lg border border-surface-200 bg-white p-8 text-center text-sm text-ink-muted">
            No reports with this status.
          </div>
        )}
      </div>
    </div>
  );
}
