import type { Database } from '@/types/database';

type Match = Database['public']['Tables']['matches']['Row'] & {
  player_home: { username: string | null; avatar_url: string | null } | null;
  player_away: { username: string | null; avatar_url: string | null } | null;
};

interface Props {
  matches: Match[];
}

export function BracketView({ matches }: Props) {
  // Group matches by round
  const rounds = new Map<number, Match[]>();
  for (const m of matches) {
    const r = m.round ?? 1;
    if (!rounds.has(r)) rounds.set(r, []);
    rounds.get(r)!.push(m);
  }

  const sortedRounds = Array.from(rounds.entries()).sort(([a], [b]) => a - b);
  const maxRound = sortedRounds.length;

  const roundLabel = (round: number) => {
    if (round === maxRound) return 'Final';
    if (round === maxRound - 1) return 'Semi-Finals';
    if (round === maxRound - 2) return 'Quarter-Finals';
    return `Round ${round}`;
  };

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="flex gap-8 min-w-max">
        {sortedRounds.map(([round, roundMatches]) => (
          <div key={round} className="flex flex-col gap-4">
            <h3 className="text-center text-xs font-semibold uppercase text-ink-muted">
              {roundLabel(round)}
            </h3>
            <div className="flex flex-col justify-around gap-4 flex-1">
              {roundMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const home = match.player_home;
  const away = match.player_away;
  const isCompleted = match.status === 'completed';

  return (
    <div className="w-52 rounded-lg border border-surface-200 bg-white text-sm">
      <PlayerRow
        username={home?.username}
        score={match.score_home}
        isWinner={match.winner_id === match.player_home_id}
        isCompleted={isCompleted}
        side="top"
      />
      <div className="border-t border-surface-200" />
      <PlayerRow
        username={away?.username}
        score={match.score_away}
        isWinner={match.winner_id === match.player_away_id}
        isCompleted={isCompleted}
        side="bottom"
      />
    </div>
  );
}

function PlayerRow({
  username,
  score,
  isWinner,
  isCompleted,
  side,
}: {
  username: string | null | undefined;
  score: number | null;
  isWinner: boolean;
  isCompleted: boolean;
  side: 'top' | 'bottom';
}) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 ${
        isCompleted && isWinner ? 'bg-accent-50 font-semibold' : ''
      } ${side === 'top' ? 'rounded-t-lg' : 'rounded-b-lg'}`}
    >
      <span className={`truncate ${!username ? 'text-ink-light italic' : ''}`}>
        {username ?? 'BYE'}
      </span>
      {isCompleted && score !== null && (
        <span className="ml-2 tabular-nums">{score}</span>
      )}
    </div>
  );
}
