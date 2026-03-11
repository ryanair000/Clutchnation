import Link from 'next/link';
import { getInitials } from '@/lib/utils';
import type { Group } from '@/types';

interface GroupCardProps {
  group: Group;
  isMember?: boolean;
}

export function GroupCard({ group, isMember }: GroupCardProps) {
  const ownerName = group.owner?.username ?? 'Unknown';

  return (
    <Link
      href={`/community/groups/${group.slug}`}
      className="flex flex-col rounded-xl border border-surface-200 bg-white p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        {/* Group avatar */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand">
          {group.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{group.name}</h3>
            {isMember && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent-700">
                Joined
              </span>
            )}
          </div>
          <p className="text-xs text-ink-light">
            by {ownerName} · {group.member_count} member
            {group.member_count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {group.description && (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-muted">
          {group.description}
        </p>
      )}

      <div className="mt-auto pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-light">
            {group.is_public ? 'Public' : 'Private'}
          </span>
          <span className="text-ink-light">
            {group.member_count}/{group.max_members}
          </span>
        </div>
      </div>
    </Link>
  );
}
