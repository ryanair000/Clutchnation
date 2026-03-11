'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Group } from '@/types';

interface GroupHeaderProps {
  group: Group;
  isMember: boolean;
  memberRole: 'owner' | 'admin' | 'member' | null;
  slug: string;
}

export function GroupHeader({ group, isMember, memberRole, slug }: GroupHeaderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/groups/${slug}/members`, {
        method: 'POST',
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/groups/${slug}/members`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand/10 text-lg font-bold text-brand">
            {group.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold">{group.name}</h2>
            <p className="text-sm text-ink-muted">
              {group.member_count} member{group.member_count !== 1 ? 's' : ''} ·{' '}
              {group.is_public ? 'Public' : 'Private'} ·{' '}
              Created by {group.owner?.username ?? 'Unknown'}
            </p>
          </div>
        </div>

        <div>
          {isMember ? (
            memberRole === 'owner' ? (
              <span className="rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand">
                Owner
              </span>
            ) : (
              <button
                onClick={handleLeave}
                disabled={loading}
                className="rounded-lg border border-red-200 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {loading ? 'Leaving…' : 'Leave Group'}
              </button>
            )
          ) : (
            <button
              onClick={handleJoin}
              disabled={loading}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Joining…' : 'Join Group'}
            </button>
          )}
        </div>
      </div>

      {group.description && (
        <p className="mt-4 text-sm leading-relaxed text-ink-muted">
          {group.description}
        </p>
      )}
    </div>
  );
}
