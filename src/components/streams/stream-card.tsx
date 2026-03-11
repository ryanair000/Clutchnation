import Link from 'next/link';
import { STREAM_PLATFORM_LABELS } from '@/lib/constants';
import type { StreamChannelWithProfile } from '@/types';

interface StreamCardProps {
  stream: StreamChannelWithProfile;
}

export function StreamCard({ stream }: StreamCardProps) {
  const profile = Array.isArray(stream.profile) ? stream.profile[0] : stream.profile;
  const username = profile?.username ?? 'Unknown';
  const platformLabel = STREAM_PLATFORM_LABELS[stream.platform] ?? stream.platform;

  return (
    <Link
      href={`/streams/${username}`}
      className="group rounded-xl border border-surface-200 bg-white overflow-hidden transition-shadow hover:shadow-md"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-surface-100">
        {stream.thumbnail_url ? (
          <img
            src={stream.thumbnail_url}
            alt={stream.stream_title ?? `${username}'s stream`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-light text-sm">
            No preview
          </div>
        )}

        {/* Live badge */}
        {stream.is_live && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white shadow">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            LIVE
          </div>
        )}

        {/* Viewer count */}
        {stream.is_live && stream.viewer_count > 0 && (
          <div className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
            {stream.viewer_count.toLocaleString()} viewers
          </div>
        )}

        {/* Platform badge */}
        <div className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">
          {platformLabel}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-sm line-clamp-1 group-hover:text-brand transition-colors">
          {stream.is_live && stream.stream_title ? stream.stream_title : `${username}'s channel`}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={username}
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs text-ink-muted">{username}</span>
        </div>
        {stream.is_live && stream.game_name && (
          <p className="mt-1.5 text-xs text-ink-light">{stream.game_name}</p>
        )}
        {!stream.is_live && (
          <p className="mt-1.5 text-xs text-ink-light">Offline</p>
        )}
      </div>
    </Link>
  );
}
