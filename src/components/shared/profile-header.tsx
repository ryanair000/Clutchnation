'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getInitials } from '@/lib/utils';
import { PlatformBadge } from '@/components/shared/platform-badge';
import { PsnBadge } from '@/components/shared/psn-badge';
import { useProfile } from '@/components/profile/profile-context';
import type { Database } from '@/types/database';
import type { PsnVerifiedStatus } from '@/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile: boolean;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
  const { psnCache, currentUserId, platformAccounts } = useProfile();
  const [copied, setCopied] = useState(false);

  const presence = psnCache?.presence as
    | { state?: string; platform?: string; titleName?: string }
    | null
    | undefined;
  const isOnline = presence?.state === 'online';

  // Avatar fallback: uploaded → PSN cache → initials
  const avatarUrl = profile.avatar_url ?? psnCache?.avatar_url ?? null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        // Clipboard API unavailable (insecure context, denied permission, etc.)
      },
    );
  };

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
      {/* Avatar */}
      <div className="relative">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={profile.username ?? ''}
            width={96}
            height={96}
            className="h-24 w-24 rounded-full object-cover ring-4 ring-brand/20"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white ring-4 ring-brand/20">
            {getInitials(profile.username ?? '??')}
          </div>
        )}
        {/* Online presence dot */}
        {isOnline && (
          <span
            className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-green-500"
            title="Online"
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 text-center sm:text-left">
        <h1 className="font-heading text-2xl font-bold">{profile.username}</h1>

        {/* Badges row */}
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          {/* Multi-platform badges */}
          {platformAccounts.length > 0
            ? platformAccounts.map((account) => (
                <PlatformBadge
                  key={account.id}
                  platform={account.platform}
                  username={account.platform_username}
                  verifiedStatus={account.verified_status}
                  profileUrl={account.profile_url}
                  size="sm"
                />
              ))
            : (
              /* Fallback to legacy PSN badge if no platform_accounts yet */
              <PsnBadge
                psnOnlineId={profile.psn_online_id}
                verifiedStatus={profile.psn_verified_status as PsnVerifiedStatus}
                profileUrl={profile.psn_profile_url}
                size="sm"
              />
            )
          }
          {psnCache?.is_plus && (
            <span className="shrink-0 rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-700">
              PS+
            </span>
          )}
          {profile.country && (
            <span className="text-xs text-ink-light">{profile.country}</span>
          )}
        </div>

        {/* Currently playing */}
        {isOnline && presence?.titleName && (
          <p className="mt-1.5 flex items-center justify-center gap-1 text-xs text-green-600 sm:justify-start">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
            Playing: {presence.titleName}
          </p>
        )}

        {/* Game activity badges */}
        {psnCache?.game_activity && typeof psnCache.game_activity === 'object' && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {Object.entries(psnCache.game_activity as Record<string, { lastPlayedAt?: string | null }>).map(([gameId, info]) =>
              info?.lastPlayedAt ? (
                <span key={gameId} className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                  🎮 Active on {gameId.toUpperCase()}
                  <span className="text-accent/60">· {formatRelativeTime(info.lastPlayedAt)}</span>
                </span>
              ) : null,
            )}
          </div>
        )}
        {/* Legacy FC 26 badge (fallback if game_activity not yet populated) */}
        {!psnCache?.game_activity && psnCache?.fc26_last_played_at && (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
            ⚽ Active on FC 26
            <span className="text-accent/60">
              · {formatRelativeTime(psnCache.fc26_last_played_at)}
            </span>
          </span>
        )}

        {/* Bio */}
        {profile.bio && (
          <p className="mt-3 max-w-lg text-sm text-ink-muted">{profile.bio}</p>
        )}

        {/* Favorite Games */}
        {profile.favorite_games && profile.favorite_games.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-ink-light">🎮</span>
            {profile.favorite_games.map((game) => (
              <span
                key={game}
                className="rounded-full bg-surface-100 px-2 py-0.5 text-[11px] font-medium text-ink-muted"
              >
                {game}
              </span>
            ))}
          </div>
        )}

        {/* Social actions (other users only) */}
        {!isOwnProfile && currentUserId && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Link
              href={`/messages/new?to=${profile.username}`}
              className="rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-50 transition-colors"
            >
              ✉ Message
            </Link>
            <Link
              href={`/matches/create?opponent=${profile.id}`}
              className="rounded-lg border border-brand bg-brand/5 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/10 transition-colors"
            >
              ⚔ Challenge
            </Link>
          </div>
        )}
      </div>

      {/* Top-right actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="relative rounded-lg border border-surface-300 bg-white p-2 text-ink-muted hover:bg-surface-50 transition-colors"
          title="Share profile"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.065a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 0 0-6.364 6.364l1.757 1.757" />
          </svg>
          {copied && (
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[10px] font-medium text-white">
              Copied!
            </span>
          )}
        </button>
        {isOwnProfile && (
          <Link
            href="/settings/profile"
            className="rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-surface-50 transition-colors"
          >
            Edit Profile
          </Link>
        )}
      </div>
    </div>
  );
}
