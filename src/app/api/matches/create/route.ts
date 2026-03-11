import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { HALF_LENGTH_MIN, SLOT_DURATION_MIN, NO_SHOW_DEADLINE_MIN, DEFAULT_GAME_ID } from '@/lib/constants';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { opponent, scheduled_at, half_length, game_id } = await request.json();
  if (!opponent || !scheduled_at || !half_length) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const resolvedGameId = game_id || DEFAULT_GAME_ID;

  // Find opponent by username, PSN ID, or platform_accounts username
  const { data: oppProfile } = await supabase
    .from('profiles')
    .select('id')
    .or(`username.eq.${opponent},psn_online_id.eq.${opponent}`)
    .single();

  let opponentId: string | null = oppProfile?.id ?? null;

  // Fallback: search platform_accounts if not found in profiles
  if (!opponentId) {
    const { data: platformMatch } = await supabase
      .from('platform_accounts')
      .select('user_id')
      .eq('platform_username', opponent)
      .limit(1)
      .maybeSingle();
    opponentId = platformMatch?.user_id ?? null;
  }

  if (!opponentId) {
    return NextResponse.json({ error: 'Opponent not found' }, { status: 404 });
  }
  if (opponentId === user.id) {
    return NextResponse.json({ error: 'Cannot challenge yourself' }, { status: 400 });
  }

  // Create match (pending acceptance)
  const scheduled = new Date(scheduled_at);
  const slotEnd = new Date(scheduled.getTime() + SLOT_DURATION_MIN * 60_000);
  const noShow = new Date(scheduled.getTime() + NO_SHOW_DEADLINE_MIN * 60_000);
  const { data, error } = await supabase.from('matches').insert({
    match_type: 'standalone',
    game_id: resolvedGameId,
    player_home_id: user.id,
    player_away_id: opponentId,
    status: 'pending_acceptance',
    scheduled_at: scheduled.toISOString(),
    slot_end_at: slotEnd.toISOString(),
    no_show_deadline: noShow.toISOString(),
    rules_half_length_min: half_length,
    round: null,
    bracket_position: null,
    score_home: null,
    score_away: null,
    winner_id: null,
    tournament_id: null,
  }).select('id').single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ matchId: data.id });
}
