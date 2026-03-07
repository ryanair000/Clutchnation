import Link from 'next/link';

interface Entry {
  id: string;
  user_id: string;
  rank: number | null;
  points: number;
  matches_played: number;
  matches_won: number;
  win_rate: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  tournaments_won: number;
  profile:
    | { username: string | null; avatar_url: string | null; psn_online_id: string | null; country: string }
    | { username: string | null; avatar_url: string | null; psn_online_id: string | null; country: string }[]
    | null;
}

function getRankBadge(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

export function LeaderboardTable({ entries }: { entries: Entry[] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-200 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
            <th className="px-3 py-3 w-16">Rank</th>
            <th className="px-3 py-3">Player</th>
            <th className="px-3 py-3 text-center">Pts</th>
            <th className="px-3 py-3 text-center hidden sm:table-cell">P</th>
            <th className="px-3 py-3 text-center hidden sm:table-cell">W</th>
            <th className="px-3 py-3 text-center hidden md:table-cell">Win%</th>
            <th className="px-3 py-3 text-center hidden md:table-cell">GF</th>
            <th className="px-3 py-3 text-center hidden md:table-cell">GA</th>
            <th className="px-3 py-3 text-center hidden lg:table-cell">GD</th>
            <th className="px-3 py-3 text-center hidden lg:table-cell">🏆</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {entries.map((entry) => {
            const profile = Array.isArray(entry.profile)
              ? entry.profile[0]
              : entry.profile;
            const rank = entry.rank ?? 0;

            return (
              <tr
                key={entry.id}
                className={`hover:bg-surface-50 transition-colors ${
                  rank <= 3 ? 'bg-amber-50/40' : ''
                }`}
              >
                <td className="px-3 py-3 font-heading font-bold text-lg">
                  {getRankBadge(rank)}
                </td>
                <td className="px-3 py-3">
                  <Link
                    href={`/profile/${profile?.username ?? ''}`}
                    className="flex items-center gap-2 hover:text-brand transition-colors"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                        {profile?.username?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">
                        {profile?.username ?? 'Unknown'}
                      </p>
                      {profile?.psn_online_id && (
                        <p className="text-xs text-ink-light">
                          {profile.psn_online_id}
                        </p>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-3 text-center font-heading font-bold text-brand">
                  {entry.points}
                </td>
                <td className="px-3 py-3 text-center hidden sm:table-cell">
                  {entry.matches_played}
                </td>
                <td className="px-3 py-3 text-center hidden sm:table-cell">
                  {entry.matches_won}
                </td>
                <td className="px-3 py-3 text-center hidden md:table-cell">
                  {(entry.win_rate * 100).toFixed(0)}%
                </td>
                <td className="px-3 py-3 text-center hidden md:table-cell">
                  {entry.goals_for}
                </td>
                <td className="px-3 py-3 text-center hidden md:table-cell">
                  {entry.goals_against}
                </td>
                <td
                  className={`px-3 py-3 text-center font-semibold hidden lg:table-cell ${
                    entry.goal_diff > 0
                      ? 'text-accent'
                      : entry.goal_diff < 0
                        ? 'text-red-500'
                        : ''
                  }`}
                >
                  {entry.goal_diff > 0 ? '+' : ''}
                  {entry.goal_diff}
                </td>
                <td className="px-3 py-3 text-center hidden lg:table-cell">
                  {entry.tournaments_won > 0 ? entry.tournaments_won : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
