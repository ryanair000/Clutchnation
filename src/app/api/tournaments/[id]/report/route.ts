import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SLOT_DURATION_MIN, NO_SHOW_DEADLINE_MIN } from '@/lib/constants';

/**
 * POST /api/tournaments/[id]/report
 * Body: { matchId, scoreHome, scoreAway }
 *
 * Report a match score. When both players report matching scores,
 * the match is confirmed and the next round match is updated.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tournamentId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { matchId, scoreHome, scoreAway } = body as {
    matchId: string;
    scoreHome: number;
    scoreAway: number;
  };

  if (typeof scoreHome !== 'number' || typeof scoreAway !== 'number' || scoreHome < 0 || scoreAway < 0) {
    return NextResponse.json({ error: 'Invalid scores' }, { status: 400 });
  }

  // Fetch the match
  const { data: match, error: matchErr } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .eq('tournament_id', tournamentId)
    .single();

  if (matchErr || !match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  if (match.status !== 'scheduled' && match.status !== 'in_progress') {
    return NextResponse.json({ error: 'Match is not active' }, { status: 400 });
  }

  const isHome = user.id === match.player_home_id;
  const isAway = user.id === match.player_away_id;
  if (!isHome && !isAway) {
    return NextResponse.json({ error: 'You are not a player in this match' }, { status: 403 });
  }

  // Store this player's reported score
  const updateData: Record<string, number | string> = {
    status: 'in_progress',
  };
  if (isHome) {
    updateData.home_reported_score_home = scoreHome;
    updateData.home_reported_score_away = scoreAway;
  } else {
    updateData.away_reported_score_home = scoreHome;
    updateData.away_reported_score_away = scoreAway;
  }

  await supabase.from('matches').update(updateData).eq('id', matchId);

  // Re-fetch to check if both players reported
  const { data: updated } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (!updated) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }

  // Both reported — check if scores match
  if (
    updated.home_reported_score_home !== null &&
    updated.away_reported_score_home !== null
  ) {
    const scoresMatch =
      updated.home_reported_score_home === updated.away_reported_score_home &&
      updated.home_reported_score_away === updated.away_reported_score_away;

    if (scoresMatch) {
      const finalHome = updated.home_reported_score_home;
      const finalAway = updated.home_reported_score_away!;
      const winnerId =
        finalHome > finalAway
          ? match.player_home_id
          : finalAway > finalHome
            ? match.player_away_id
            : null; // draw — shouldn't happen in knockout

      await supabase
        .from('matches')
        .update({
          status: 'completed',
          score_home: finalHome,
          score_away: finalAway,
          winner_id: winnerId,
          result_confirmed_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      // Advance winner to next round
      if (winnerId) {
        await advanceWinner(supabase, tournamentId, match, winnerId);
      }

      return NextResponse.json({ success: true, confirmed: true });
    } else {
      // Scores don't match → dispute
      await supabase
        .from('matches')
        .update({
          status: 'disputed',
          dispute_opened_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      return NextResponse.json({ success: true, disputed: true });
    }
  }

  return NextResponse.json({ success: true, waiting: true });
}

async function advanceWinner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentId: string,
  match: { round: number | null; bracket_position: number | null },
  winnerId: string
) {
  const round = (match.round ?? 1) + 1;
  const bracketPos = Math.ceil((match.bracket_position ?? 1) / 2);

  // Check if next round match already exists
  const { data: nextMatch } = await supabase
    .from('matches')
    .select('id, player_home_id, player_away_id')
    .eq('tournament_id', tournamentId)
    .eq('round', round)
    .eq('bracket_position', bracketPos)
    .single();

  if (nextMatch) {
    // Fill in the empty slot
    const isHomeSlot = (match.bracket_position ?? 1) % 2 === 1;
    await supabase
      .from('matches')
      .update(isHomeSlot ? { player_home_id: winnerId } : { player_away_id: winnerId })
      .eq('id', nextMatch.id);
  } else {
    // Create next round match
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

  // Check if the tournament is complete (only 1 unfinished match remaining)
  const { count } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)
    .neq('status', 'completed');

  if (count === 0) {
    // All matches completed — tournament is done
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
