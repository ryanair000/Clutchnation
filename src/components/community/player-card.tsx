import Link from 'next/link';
import { getInitials } from '@/lib/utils';

interface PlayerCardProps {
  player: {
    id: string;
    username: string | null;
    psn_online_id: string | null;
    avatar_url: string | null;
    bio: string | null;
    country: string | null;
    stats_matches_played: number;
    stats_matches_won: number;
    win_rate: number;
    rank: number | null;
    points: number | null;
  };
}

export function PlayerCard({ player }: PlayerCardProps) {
  const username = player.username ?? 'Unknown';

  return (
    <Link
      href={`/profile/${username}`}
      className="flex items-start gap-4 rounded-xl border border-surface-200 bg-white p-4 transition-shadow hover:shadow-md"
    >
      {/* Avatar */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-100 text-sm font-semibold text-ink-muted">
        {getInitials(username)}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{username}</span>
          {player.country && (
            <span className="text-xs text-ink-light">{player.country}</span>
          )}
        </div>

        {player.psn_online_id && (
          <p className="mt-0.5 text-xs text-ink-light">
            🎮 {player.psn_online_id}
          </p>
        )}

        {player.bio && (
          <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
            {player.bio}
          </p>
        )}

        {/* Stats */}
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          <span className="text-ink-muted">
            <span className="font-medium text-ink">
              {player.stats_matches_played}
            </span>{' '}
            matches
          </span>
          <span className="text-ink-muted">
            <span className="font-medium text-ink">{player.win_rate}%</span> win
            rate
          </span>
          {player.rank && (
            <span className="text-ink-muted">
              Rank{' '}
              <span className="font-medium text-brand">#{player.rank}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
