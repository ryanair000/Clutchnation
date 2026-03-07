import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin';
import { DisputeList } from '@/components/admin/dispute-list';

export const metadata: Metadata = { title: 'Dispute Resolution' };

export default async function AdminDisputesPage() {
  const { supabase } = await requireAdmin();

  const { data: disputes } = await supabase
    .from('matches')
    .select(`
      id, status, score_home, score_away,
      home_reported_score_home, home_reported_score_away,
      away_reported_score_home, away_reported_score_away,
      dispute_opened_at, scheduled_at,
      player_home:profiles!matches_player_home_id_fkey(id, username, avatar_url),
      player_away:profiles!matches_player_away_id_fkey(id, username, avatar_url)
    `)
    .eq('status', 'disputed')
    .order('dispute_opened_at', { ascending: true });

  // Also get recently resolved disputes
  const { data: resolved } = await supabase
    .from('matches')
    .select(`
      id, status, score_home, score_away,
      dispute_resolved_at, scheduled_at,
      player_home:profiles!matches_player_home_id_fkey(id, username, avatar_url),
      player_away:profiles!matches_player_away_id_fkey(id, username, avatar_url),
      resolver:profiles!matches_dispute_resolved_by_fkey(username)
    `)
    .not('dispute_resolved_at', 'is', null)
    .eq('status', 'completed')
    .order('dispute_resolved_at', { ascending: false })
    .limit(10);

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold">Dispute Resolution</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {(disputes ?? []).length} active dispute{(disputes ?? []).length !== 1 ? 's' : ''}
      </p>

      <DisputeList disputes={disputes ?? []} resolved={resolved ?? []} />
    </div>
  );
}
