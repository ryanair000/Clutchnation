import type { PlatformType, PlatformVerifiedStatus } from '@/types';
import { PLATFORM_ICONS, PLATFORM_LABELS } from '@/lib/constants';

interface PlatformBadgeProps {
  platform: PlatformType;
  username: string | null;
  verifiedStatus?: PlatformVerifiedStatus | null;
  profileUrl?: string | null;
  size?: 'sm' | 'md';
}

export function PlatformBadge({
  platform,
  username,
  verifiedStatus,
  profileUrl,
  size = 'sm',
}: PlatformBadgeProps) {
  if (!username) return null;

  const isVerified = verifiedStatus === 'confirmed_by_user';
  const sizeClasses =
    size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  const icon = PLATFORM_ICONS[platform];
  const label = PLATFORM_LABELS[platform];

  const badge = (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-surface-100 font-medium text-ink-light ${sizeClasses}`}
      title={label}
    >
      <span>{icon}</span>
      <span>{username}</span>
      {isVerified && (
        <svg
          className="h-3.5 w-3.5 text-brand"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-label="Verified"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </span>
  );

  if (profileUrl) {
    return (
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
      >
        {badge}
      </a>
    );
  }

  return badge;
}
