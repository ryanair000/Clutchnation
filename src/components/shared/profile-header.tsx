import Link from 'next/link';
import Image from 'next/image';
import { getInitials } from '@/lib/utils';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile: boolean;
}

export function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
      {/* Avatar */}
      <div className="relative">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.username ?? ''}
            className="h-24 w-24 rounded-full object-cover ring-4 ring-brand/20"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white ring-4 ring-brand/20">
            {getInitials(profile.username ?? '??')}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 text-center sm:text-left">
        <h1 className="font-heading text-2xl font-bold">{profile.username}</h1>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-100 px-3 py-1 text-xs font-medium text-ink-muted">
            🎮 {profile.psn_online_id}
          </span>
          <span className="text-xs text-ink-light">{profile.country}</span>
        </div>
        {profile.bio && (
          <p className="mt-3 max-w-lg text-sm text-ink-muted">{profile.bio}</p>
        )}
      </div>

      {/* Actions */}
      {isOwnProfile && (
        <Link
          href="/settings/profile"
          className="rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-surface-50 transition-colors"
        >
          Edit Profile
        </Link>
      )}
    </div>
  );
}
