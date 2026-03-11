'use client';

import type { NormalizedPsnProfile } from '@/types';
import Image from 'next/image';

interface PsnPreviewCardProps {
  profile: NormalizedPsnProfile | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const trophyIcons: Record<string, { emoji: string; color: string }> = {
  platinum: { emoji: '🏆', color: 'text-sky-400' },
  gold: { emoji: '🥇', color: 'text-yellow-500' },
  silver: { emoji: '🥈', color: 'text-slate-400' },
  bronze: { emoji: '🥉', color: 'text-amber-600' },
};

export function PsnPreviewCard({
  profile,
  loading,
  error,
  notFound,
  onConfirm,
  onCancel,
}: PsnPreviewCardProps) {
  if (loading) {
    return (
      <div className="mt-3 animate-pulse overflow-hidden rounded-xl border border-surface-200 bg-surface-50">
        <div className="flex items-center gap-4 p-4">
          <div className="h-14 w-14 shrink-0 rounded-full bg-surface-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 rounded bg-surface-200" />
            <div className="h-3 w-48 rounded bg-surface-200" />
          </div>
        </div>
        <div className="flex gap-2 border-t border-surface-200 bg-surface-100/50 px-4 py-3">
          <div className="h-8 w-32 rounded-lg bg-surface-200" />
          <div className="h-8 w-20 rounded-lg bg-surface-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm text-amber-800">
          We couldn&apos;t verify this PSN ID right now. You can still
          save and verify later.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-2 text-xs font-medium text-amber-700 underline"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-sm text-red-700">
          No PlayStation account found with this Online ID.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-2 text-xs font-medium text-red-600 underline"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (!profile) return null;

  const totalTrophies = profile.trophyCounts
    ? profile.trophyCounts.platinum +
      profile.trophyCounts.gold +
      profile.trophyCounts.silver +
      profile.trophyCounts.bronze
    : null;

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-brand/20 bg-gradient-to-b from-brand/5 to-transparent shadow-sm">
      {/* Header row */}
      <div className="flex items-center gap-4 p-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={`${profile.onlineId} avatar`}
              width={56}
              height={56}
              className="rounded-full ring-2 ring-brand/20 ring-offset-2"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-200 text-xl ring-2 ring-brand/20 ring-offset-2">
              🎮
            </div>
          )}
          {profile.presence?.state === 'online' && (
            <span
              className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-green-500"
              title="Online"
            />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-bold text-ink">
              {profile.onlineId}
            </p>
            {profile.isPlus && (
              <span className="shrink-0 rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-700">
                PS+
              </span>
            )}
          </div>

          {/* Level + presence */}
          <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-light">
            {profile.trophyLevel != null && (
              <span className="flex items-center gap-1 font-medium">
                <span className="text-yellow-500">★</span>
                Level {profile.trophyLevel}
              </span>
            )}
            {profile.presence?.state === 'online' && (
              <span className="flex items-center gap-1 text-green-600">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                Online
                {profile.presence.titleName && (
                  <span className="text-ink-light">
                    — {profile.presence.titleName}
                  </span>
                )}
              </span>
            )}
          </div>

          {/* About me */}
          {profile.aboutMe && (
            <p className="mt-1 truncate text-xs italic text-ink-light/70">
              &ldquo;{profile.aboutMe}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Trophy bar */}
      {profile.trophyCounts && (
        <div className="flex items-center gap-3 border-t border-surface-200/60 bg-surface-50/50 px-4 py-2">
          {(
            ['platinum', 'gold', 'silver', 'bronze'] as const
          ).map((tier) => {
            const { emoji, color } = trophyIcons[tier];
            const count = profile.trophyCounts![tier];
            return (
              <span
                key={tier}
                className={`flex items-center gap-1 text-xs font-medium ${color}`}
                title={`${count} ${tier}`}
              >
                <span className="text-sm">{emoji}</span>
                {count.toLocaleString()}
              </span>
            );
          })}
          {totalTrophies != null && (
            <span className="ml-auto text-[11px] text-ink-light">
              {totalTrophies.toLocaleString()} total
            </span>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-2 border-t border-surface-200/60 px-4 py-3">
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 active:scale-[0.98]"
        >
          This is my account
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-surface-300 px-4 py-2 text-xs font-medium text-ink-light transition-colors hover:bg-surface-100"
        >
          Not me
        </button>
        {profile.shareUrl && (
          <a
            href={profile.shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-xs font-medium text-brand transition-colors hover:text-brand-600"
          >
            View on PlayStation
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
