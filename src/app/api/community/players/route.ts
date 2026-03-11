import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CURRENT_SEASON } from '@/lib/constants';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const country = searchParams.get('country');
  const sort = searchParams.get('sort') ?? 'recent';
  const cursor = Number(searchParams.get('cursor')) || 0;
  const limit = Math.min(Number(searchParams.get('limit')) || 24, 50);

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

  query = query.range(cursor, cursor + limit - 1);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const players = data ?? [];

  // Fetch leaderboard data for these players
  const playerIds = players.map((p) => p.id);
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

  const enriched = players.map((p) => ({
    ...p,
    rank: rankMap[p.id]?.rank ?? null,
    points: rankMap[p.id]?.points ?? null,
    win_rate:
      p.stats_matches_played > 0
        ? Math.round((p.stats_matches_won / p.stats_matches_played) * 100)
        : 0,
  }));

  const nextCursor =
    players.length === limit ? cursor + limit : null;

  return NextResponse.json({ players: enriched, nextCursor });
}
