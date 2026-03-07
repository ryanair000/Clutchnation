import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { POINTS, CURRENT_SEASON, MODES } from '@/lib/constants';

/**
 * POST /api/leaderboards/compute
 * Computes leaderboard snapshots for all players in the current season.
 * Protected by a simple bearer token (CRON_SECRET env var).
 */
export async function POST(request: Request) {
  // Validate cron secret or admin auth
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Fall back to checking if user is admin
    const { createClient: createUserClient } = await import('@/lib/supabase/server');
    const userSupabase = await createUserClient();
    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await userSupabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const season = CURRENT_SEASON;

  // Fetch all profiles
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_banned', false);

  if (profilesErr || !profiles) {
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }

  // Fetch all completed matches
  const { data: allMatches, error: matchesErr } = await supabase
    .from('matches')
    .select('id, match_type, player_home_id, player_away_id, score_home, score_away, winner_id, status, mode:tournaments(mode)')
    .eq('status', 'completed');

  if (matchesErr) {
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }

  // Fetch tournament winners for bonus points
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, winner_id, mode')
    .eq('status', 'completed');

  // Fetch tournament participations
  const { data: participations } = await supabase
    .from('tournament_participants')
    .select('user_id, tournament_id');

  const tournMap = new Map<string, { winner_id: string | null; mode: string }>();
  for (const t of tournaments ?? []) {
    tournMap.set(t.id, { winner_id: t.winner_id, mode: t.mode });
  }

  // Group participations by user
  const userTournaments = new Map<string, Set<string>>();
  for (const p of participations ?? []) {
    if (!userTournaments.has(p.user_id)) userTournaments.set(p.user_id, new Set());
    userTournaments.get(p.user_id)!.add(p.tournament_id);
  }

  // Compute snapshots for each mode + "all"
  const modes = ['all', ...MODES];
  const snapshots: {
    user_id: string;
    season: string;
    mode: string;
    matches_played: number;
    matches_won: number;
    win_rate: number;
    goals_for: number;
    goals_against: number;
    goal_diff: number;
    tournaments_won: number;
    points: number;
  }[] = [];

  for (const profile of profiles) {
    const uid = profile.id;

    for (const mode of modes) {
      // Filter matches for this user and mode
      const userMatches = (allMatches ?? []).filter((m: any) => {
        const isPlayer = m.player_home_id === uid || m.player_away_id === uid;
        if (!isPlayer) return false;
        if (mode === 'all') return true;
        // For standalone matches, assume 1v1
        if (m.match_type === 'standalone') return mode === '1v1';
        // For tournament matches, check the tournament mode
        const tournMode = Array.isArray(m.mode) ? m.mode[0]?.mode : (m.mode as { mode?: string })?.mode;
        return tournMode === mode;
      });

      if (userMatches.length === 0 && mode !== 'all') continue;

      let matchesWon = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;
      let draws = 0;

      for (const m of userMatches) {
        const isHome = m.player_home_id === uid;
        goalsFor += isHome ? (m.score_home ?? 0) : (m.score_away ?? 0);
        goalsAgainst += isHome ? (m.score_away ?? 0) : (m.score_home ?? 0);
        if (m.winner_id === uid) matchesWon++;
        else if (m.winner_id === null) draws++;
      }

      // Tournament stats for this mode
      const userTids = userTournaments.get(uid) ?? new Set<string>();
      let tournsWon = 0;
      let tournsPlayed = 0;
      for (const tid of userTids) {
        const t = tournMap.get(tid);
        if (!t) continue;
        if (mode !== 'all' && t.mode !== mode) continue;
        tournsPlayed++;
        if (t.winner_id === uid) tournsWon++;
      }

      // Calculate points
      const losses = userMatches.length - matchesWon - draws;
      let points = matchesWon * POINTS.MATCH_WIN + draws * POINTS.MATCH_DRAW;
      points += tournsWon * POINTS.TOURNAMENT_WIN;
      points += (tournsPlayed - tournsWon) * POINTS.TOURNAMENT_PARTICIPATION;

      const winRate = userMatches.length > 0 ? matchesWon / userMatches.length : 0;

      snapshots.push({
        user_id: uid,
        season,
        mode,
        matches_played: userMatches.length,
        matches_won: matchesWon,
        win_rate: Math.round(winRate * 10000) / 10000,
        goals_for: goalsFor,
        goals_against: goalsAgainst,
        goal_diff: goalsFor - goalsAgainst,
        tournaments_won: tournsWon,
        points,
      });
    }
  }

  // Sort each mode group by points DESC and assign ranks
  for (const mode of modes) {
    const modeSnapshots = snapshots
      .filter((s) => s.mode === mode)
      .sort((a, b) => b.points - a.points || b.goal_diff - a.goal_diff || b.matches_won - a.matches_won);

    let rank = 1;
    for (const s of modeSnapshots) {
      (s as any).rank = rank++;
    }
  }

  // Upsert snapshots (avoids delete+insert race condition)
  if (snapshots.length > 0) {
    for (let i = 0; i < snapshots.length; i += 500) {
      const chunk = snapshots.slice(i, i + 500);
      const { error: upsertErr } = await supabase
        .from('leaderboard_snapshots')
        .upsert(chunk as any[], { onConflict: 'user_id,season,mode' });
      if (upsertErr) {
        return NextResponse.json({ error: upsertErr.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({
    success: true,
    season,
    playersProcessed: profiles.length,
    snapshotsCreated: snapshots.length,
  });
}
