import Link from 'next/link';
import { getInitials } from '@/lib/utils';
import type { GroupMember } from '@/types';

interface GroupMemberListProps {
  members: GroupMember[];
  ownerId: string;
}

const roleBadge: Record<string, { label: string; className: string }> = {
  owner: { label: 'Owner', className: 'bg-brand/10 text-brand' },
  admin: { label: 'Admin', className: 'bg-amber-100 text-amber-700' },
};

export function GroupMemberList({ members, ownerId }: GroupMemberListProps) {
  return (
    <div className="rounded-xl border border-surface-200 bg-white p-5">
      <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Members ({members.length})
      </h3>

      <div className="mt-4 space-y-3">
        {members.map((m) => {
          const username = m.profile?.username ?? 'Unknown';
          const badge = roleBadge[m.role];

          return (
            <div key={m.id} className="flex items-center gap-3">
              <Link
                href={`/profile/${username}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-100 text-xs font-semibold text-ink-muted"
              >
                {getInitials(username)}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${username}`}
                  className="text-sm font-medium hover:text-brand transition-colors"
                >
                  {username}
                </Link>
              </div>
              {badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
                >
                  {badge.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
