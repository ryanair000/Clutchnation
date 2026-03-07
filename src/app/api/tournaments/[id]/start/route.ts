import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { shuffle, buildRound1Matches, totalRounds } from '@/lib/tournament';
import { SLOT_DURATION_MIN, NO_SHOW_DEADLINE_MIN } from '@/lib/constants';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch tournament
  const { data: tournament, error: fetchErr } = await supabase
    .from('tournaments')
    .select('*, tournament_participants(user_id)')
    .eq('id', id)
    .single();

  if (fetchErr || !tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  // Only host can start
  if (tournament.host_id !== user.id) {
    return NextResponse.json({ error: 'Only the host can start the tournament' }, { status: 403 });
  }

  if (tournament.status !== 'registration') {
    return NextResponse.json({ error: 'Tournament has already started or is cancelled' }, { status: 400 });
  }

  const participants = (tournament.tournament_participants ?? []) as { user_id: string }[];
  if (participants.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 participants' }, { status: 400 });
  }

  // Shuffle participants for random seeding
  const shuffled = shuffle(participants);
  const playerIds = shuffled.map((p) => p.user_id);

  // Update seeds
  for (let i = 0; i < shuffled.length; i++) {
    await supabase
      .from('tournament_participants')
      .update({ seed: i + 1 })
      .eq('tournament_id', id)
      .eq('user_id', shuffled[i].user_id);
  }

  // Generate round 1 matches
  const startsAt = new Date(tournament.starts_at);
  const matchInserts = buildRound1Matches(id, playerIds, startsAt);

  const { error: matchErr } = await supabase.from('matches').insert(matchInserts);
  if (matchErr) {
    return NextResponse.json({ error: matchErr.message }, { status: 500 });
  }

  // Advance bye match winners into round 2
  const byeMatches = matchInserts.filter((m) => m.status === 'completed' && m.winner_id);
  for (const bye of byeMatches) {
    await advanceByeWinner(supabase, id, bye);
  }

  // Update tournament status
  const { error: updateErr } = await supabase
    .from('tournaments')
    .update({ status: 'in_progress', current_round: 1 })
    .eq('id', id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, matchesCreated: matchInserts.length });
}

async function advanceByeWinner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentId: string,
  bye: { round: number; bracket_position: number; winner_id: string | null }
) {
  if (!bye.winner_id) return;

  const nextRound = bye.round + 1;
  const nextBracketPos = Math.ceil(bye.bracket_position / 2);

  const { data: nextMatch } = await supabase
    .from('matches')
    .select('id, player_home_id, player_away_id')
    .eq('tournament_id', tournamentId)
    .eq('round', nextRound)
    .eq('bracket_position', nextBracketPos)
    .single();

  if (nextMatch) {
    const isHomeSlot = bye.bracket_position % 2 === 1;
    await supabase
      .from('matches')
      .update(isHomeSlot ? { player_home_id: bye.winner_id } : { player_away_id: bye.winner_id })
      .eq('id', nextMatch.id);
  } else {
    const scheduledAt = new Date();
    scheduledAt.setMinutes(scheduledAt.getMinutes() + SLOT_DURATION_MIN);
    const slotEnd = new Date(scheduledAt.getTime() + SLOT_DURATION_MIN * 60_000);
    const noShow = new Date(scheduledAt.getTime() + NO_SHOW_DEADLINE_MIN * 60_000);
    const isHomeSlot = bye.bracket_position % 2 === 1;

    await supabase.from('matches').insert({
      match_type: 'tournament',
      tournament_id: tournamentId,
      round: nextRound,
      bracket_position: nextBracketPos,
      player_home_id: isHomeSlot ? bye.winner_id : null,
      player_away_id: isHomeSlot ? null : bye.winner_id,
      status: 'scheduled',
      scheduled_at: scheduledAt.toISOString(),
      slot_end_at: slotEnd.toISOString(),
      no_show_deadline: noShow.toISOString(),
    });
  }
}
