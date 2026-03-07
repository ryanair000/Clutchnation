import { NextRequest, NextResponse } from 'next/server';
import { checkAdminApi } from '@/lib/admin';
import { createServiceClient } from '@/lib/supabase/service';

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
    .select('id, status, player_home_id, player_away_id')
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
    // draw = no winner
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
