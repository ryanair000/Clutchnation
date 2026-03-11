import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PlayerCard } from '@/components/community/player-card';
import { COUNTRIES, CURRENT_SEASON } from '@/lib/constants';

export const metadata: Metadata = { title: 'Players' };

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; country?: string; sort?: string }>;
}) {
  const resolvedParams = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const q = resolvedParams.q ?? '';
  const country = resolvedParams.country ?? '';
  const sort = resolvedParams.sort ?? 'recent';

  let query = supabase
    .from('profiles')
    .select(
      'id, username, psn_online_id, avatar_url, bio, country, stats_matches_played, stats_matches_won, created_at'
    )
    .not('username', 'is', null);

  if (q) {
    query = query.ilike('username', `%${q}%`);
  }
  if (country) {
    query = query.eq('country', country);
  }

  switch (sort) {
    case 'matches':
      query = query.order('stats_matches_played', { ascending: false });
      break;
    case 'wins':
      query = query.order('stats_matches_won', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  query = query.limit(24);

  const { data: players } = await query;

  // Fetch leaderboard data
  const playerIds = (players ?? []).map((p) => p.id);
  let rankMap: Record<string, { rank: number; points: number }> = {};

  if (playerIds.length > 0) {
    const { data: snapshots } = await supabase
      .from('leaderboard_snapshots')
      .select('user_id, rank, points')
      .eq('season', CURRENT_SEASON)
      .in('user_id', playerIds);

    (snapshots ?? []).forEach((s) => {
      rankMap[s.user_id] = { rank: s.rank, points: s.points };
    });
  }

  const enrichedPlayers = (players ?? []).map((p) => ({
    ...p,
    rank: rankMap[p.id]?.rank ?? null,
    points: rankMap[p.id]?.points ?? null,
    win_rate:
      p.stats_matches_played > 0
        ? Math.round((p.stats_matches_won / p.stats_matches_played) * 100)
        : 0,
  }));

  return (
    <div>
      {/* Search & Filters */}
      <form className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by username…"
          className="flex-1 rounded-lg border border-surface-300 px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <select
          name="country"
          defaultValue={country}
          className="rounded-lg border border-surface-300 px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        >
          <option value="">All Countries</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={sort}
          className="rounded-lg border border-surface-300 px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        >
          <option value="recent">Recently Joined</option>
          <option value="matches">Most Matches</option>
          <option value="wins">Most Wins</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Results */}
      {enrichedPlayers.length === 0 ? (
        <div className="rounded-xl border border-surface-200 bg-white p-10 text-center">
          <p className="text-ink-muted">No players found.</p>
          {q && (
            <Link
              href="/community/players"
              className="mt-2 inline-block text-sm font-medium text-brand hover:underline"
            >
              Clear search
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrichedPlayers.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      )}
    </div>
  );
}
