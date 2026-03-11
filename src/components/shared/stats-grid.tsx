import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface StatsGridProps {
  profile: Profile;
}

export function StatsGrid({ profile }: StatsGridProps) {
  const stats = [
    { label: 'Matches', value: profile.stats_matches_played },
    { label: 'Wins', value: profile.stats_matches_won },
    {
      label: 'Win %',
      value:
        profile.stats_matches_played > 0
          ? `${Math.round((profile.stats_matches_won / profile.stats_matches_played) * 100)}%`
          : '—',
    },
    { label: 'Score For', value: profile.stats_goals_for },
    { label: 'Score Against', value: profile.stats_goals_against },
    {
      label: 'Score Diff',
      value: profile.stats_goals_for - profile.stats_goals_against,
      color:
        profile.stats_goals_for - profile.stats_goals_against > 0
          ? 'text-accent'
          : profile.stats_goals_for - profile.stats_goals_against < 0
            ? 'text-red-500'
            : '',
    },
    { label: 'Tournaments', value: profile.stats_tournaments_played },
    { label: 'Tourney Wins', value: profile.stats_tournaments_won },
  ];

  return (
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-surface-200 bg-white p-4 text-center"
        >
          <p className={`font-heading text-2xl font-bold ${'color' in stat && stat.color ? stat.color : 'text-ink'}`}>
            {stat.value}
          </p>
          <p className="mt-1 text-xs text-ink-muted">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
