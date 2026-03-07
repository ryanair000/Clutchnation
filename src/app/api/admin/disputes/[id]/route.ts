import { NextRequest, NextResponse } from 'next/server';
import { checkAdminApi } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';
import { SLOT_DURATION_MIN, NO_SHOW_DEADLINE_MIN } from '@/lib/constants';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await checkAdminApi();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { score_home, score_away, winner_id } = body as {
    score_home: number;
    score_away: number;
    winner_id: string | null;
  };

  if (typeof score_home !== 'number' || typeof score_away !== 'number' || score_home < 0 || score_away < 0) {
    return NextResponse.json({ error: 'Invalid scores' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify match exists and is disputed
  const { data: match } = await supabase
    .from('matches')
    .select('id, status, player_home_id, player_away_id, tournament_id, round, bracket_position, match_type')
    .eq('id', id)
    .single();

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  if (match.status !== 'disputed') {
    return NextResponse.json({ error: 'Match is not disputed' }, { status: 400 });
  }

  // Determine winner
  let resolvedWinner = winner_id;
  if (!resolvedWinner) {
    if (score_home > score_away) resolvedWinner = match.player_home_id;
    else if (score_away > score_home) resolvedWinner = match.player_away_id;
  }

  // Tournament matches must have a winner (no draws in knockout)
  if (match.match_type === 'tournament' && !resolvedWinner) {
    return NextResponse.json(
      { error: 'Tournament matches cannot end in a draw. Provide a winner_id.' },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from('matches')
    .update({
      status: 'completed',
      score_home,
      score_away,
      winner_id: resolvedWinner,
      result_confirmed_at: new Date().toISOString(),
      dispute_resolved_at: new Date().toISOString(),
      dispute_resolved_by: admin.userId,
    })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Advance winner in tournament bracket
  if (match.match_type === 'tournament' && match.tournament_id && resolvedWinner) {
    await advanceWinner(supabase, match.tournament_id, match, resolvedWinner);
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    actor_id: admin.userId,
    action: 'dispute_resolved',
    target_type: 'match',
    target_id: id,
    metadata: { score_home, score_away, winner_id: resolvedWinner },
  });

  return NextResponse.json({ success: true });
}

async function advanceWinner(
  supabase: ReturnType<typeof createServiceClient>,
  tournamentId: string,
  match: { round: number | null; bracket_position: number | null },
  winnerId: string
) {
  const round = (match.round ?? 1) + 1;
  const bracketPos = Math.ceil((match.bracket_position ?? 1) / 2);

  const { data: nextMatch } = await supabase
    .from('matches')
    .select('id, player_home_id, player_away_id')
    .eq('tournament_id', tournamentId)
    .eq('round', round)
    .eq('bracket_position', bracketPos)
    .single();

  if (nextMatch) {
    const isHomeSlot = (match.bracket_position ?? 1) % 2 === 1;
    await supabase
      .from('matches')
      .update(isHomeSlot ? { player_home_id: winnerId } : { player_away_id: winnerId })
      .eq('id', nextMatch.id);
  } else {
    const scheduledAt = new Date();
    scheduledAt.setMinutes(scheduledAt.getMinutes() + SLOT_DURATION_MIN);
    const slotEnd = new Date(scheduledAt.getTime() + SLOT_DURATION_MIN * 60_000);
    const noShow = new Date(scheduledAt.getTime() + NO_SHOW_DEADLINE_MIN * 60_000);
    const isHomeSlot = (match.bracket_position ?? 1) % 2 === 1;

    await supabase.from('matches').insert({
      match_type: 'tournament',
      tournament_id: tournamentId,
      round,
      bracket_position: bracketPos,
      player_home_id: isHomeSlot ? winnerId : null,
      player_away_id: isHomeSlot ? null : winnerId,
      status: 'scheduled',
      scheduled_at: scheduledAt.toISOString(),
      slot_end_at: slotEnd.toISOString(),
      no_show_deadline: noShow.toISOString(),
    });
  }

  const { count } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)
    .neq('status', 'completed');

  if (count === 0) {
    await supabase
      .from('tournaments')
      .update({
        status: 'completed',
        winner_id: winnerId,
        ended_at: new Date().toISOString(),
      })
      .eq('id', tournamentId);
  }
}
