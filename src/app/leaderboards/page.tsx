import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { CURRENT_SEASON, DEFAULT_GAME_ID } from '@/lib/constants';
import { LeaderboardTable } from '@/components/leaderboards/leaderboard-table';
import { ModeFilter } from '@/components/leaderboards/mode-filter';
import { GameFilter } from '@/components/leaderboards/game-filter';

export const metadata: Metadata = { title: 'Leaderboards' };

interface Props {
  searchParams: Promise<{ mode?: string; game?: string }>;
}

export default async function LeaderboardsPage({ searchParams }: Props) {
  const { mode: modeParam, game: gameParam } = await searchParams;
  const mode = modeParam || 'all';
  const gameId = gameParam || DEFAULT_GAME_ID;
  const supabase = await createClient();

  // Fetch available games for the filter
  const { data: games } = await supabase
    .from('games')
    .select('id, name, slug, modes, scoring_type')
    .eq('is_active', true)
    .order('sort_order');

  const { data: entries } = await supabase
    .from('leaderboard_snapshots')
    .select(`
      *,
      profile:profiles!leaderboard_snapshots_user_id_fkey(username, avatar_url, psn_online_id, country)
    `)
    .eq('season', CURRENT_SEASON)
    .eq('mode', mode)
    .eq('game_id', gameId)
    .order('rank', { ascending: true, nullsFirst: false })
    .limit(100);

  // Find scoring type for selected game
  const selectedGame = (games ?? []).find((g) => g.id === gameId);
  const scoringType = (selectedGame?.scoring_type as string) ?? 'goals';

  return (
    <div className="container-app py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Leaderboards</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Season {CURRENT_SEASON} rankings
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <GameFilter games={games ?? []} currentGame={gameId} />
          <ModeFilter currentMode={mode} gameId={gameId} games={games ?? []} />
        </div>
      </div>

      {!entries || entries.length === 0 ? (
        <div className="mt-8 rounded-lg border border-surface-200 bg-white p-12 text-center">
          <p className="text-ink-muted text-sm">No rankings yet for this game and mode.</p>
          <p className="mt-2 text-xs text-ink-light">
            Play matches and compete in tournaments to appear on the leaderboard.
          </p>
        </div>
      ) : (
        <LeaderboardTable entries={entries} />
      )}
    </div>
  );
}
