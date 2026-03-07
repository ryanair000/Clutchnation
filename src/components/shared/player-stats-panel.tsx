import { cn } from '@/lib/utils';
import type { PlayerDetailedStats } from '@/types';

const FORM_COLORS: Record<string, string> = {
  W: 'bg-accent text-white',
  L: 'bg-red-500 text-white',
  D: 'bg-amber-400 text-white',
};

export function PlayerStatsPanel({ stats }: { stats: PlayerDetailedStats }) {
  return (
    <div className="mt-6 space-y-6">
      {/* Points + Rank Banner */}
      <div className="flex items-center gap-6 rounded-lg border border-surface-200 bg-gradient-to-r from-brand/5 to-accent/5 p-5">
        <div className="text-center">
          <p className="font-heading text-3xl font-bold text-brand">{stats.points}</p>
          <p className="text-xs text-ink-muted">Points</p>
        </div>
        {stats.rank && (
          <div className="text-center">
            <p className="font-heading text-3xl font-bold text-ink">#{stats.rank}</p>
            <p className="text-xs text-ink-muted">Rank</p>
          </div>
        )}
        <div className="flex-1" />
        {/* Recent Form */}
        {stats.recentForm.length > 0 && (
          <div>
            <p className="text-xs text-ink-muted mb-1.5 text-right">Recent Form</p>
            <div className="flex gap-1">
              {stats.recentForm.map((r, i) => (
                <span
                  key={i}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold',
                    FORM_COLORS[r]
                  )}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <StatCard label="Played" value={stats.totalMatches} />
        <StatCard label="Won" value={stats.totalWins} accent />
        <StatCard label="Lost" value={stats.totalLosses} negative />
        <StatCard label="Drawn" value={stats.totalDraws} />
        <StatCard
          label="Win Rate"
          value={`${(stats.winRate * 100).toFixed(1)}%`}
        />
        <StatCard label="Goals For" value={stats.goalsFor} />
        <StatCard label="Goals Against" value={stats.goalsAgainst} />
        <StatCard
          label="Goal Diff"
          value={`${stats.goalDiff > 0 ? '+' : ''}${stats.goalDiff}`}
          accent={stats.goalDiff > 0}
          negative={stats.goalDiff < 0}
        />
        <StatCard
          label="Avg Goals/Match"
          value={stats.avgGoalsPerMatch.toFixed(1)}
        />
        <StatCard label="Clean Sheets" value={stats.cleanSheets} />
        <StatCard label="Tournaments" value={stats.tournamentsPlayed} />
        <StatCard label="Tourney Wins" value={stats.tournamentsWon} accent />
        <StatCard
          label="Current Streak"
          value={
            stats.streakType
              ? `${stats.currentStreak}${stats.streakType}`
              : '—'
          }
          accent={stats.streakType === 'W'}
          negative={stats.streakType === 'L'}
        />
        <StatCard label="Best Win Streak" value={stats.bestStreak} accent />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  negative,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="rounded-lg border border-surface-200 bg-white p-3 text-center">
      <p
        className={cn(
          'font-heading text-xl font-bold',
          accent ? 'text-accent' : negative ? 'text-red-500' : 'text-ink'
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-ink-muted">{label}</p>
    </div>
  );
}
