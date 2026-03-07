import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { shuffle, buildRound1Matches } from '@/lib/tournament';

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
