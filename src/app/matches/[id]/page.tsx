import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatTime } from '@/lib/utils';
import { EvidenceUpload } from '@/components/matches/evidence-upload';
import { MatchActions } from '@/components/matches/match-actions';

export const metadata: Metadata = { title: 'Match Details' };

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: match } = await supabase
    .from('matches')
    .select(`*,
      player_home:profiles!matches_player_home_id_fkey(username, avatar_url),
      player_away:profiles!matches_player_away_id_fkey(username, avatar_url),
      evidence:match_evidence(id, image_url, uploaded_by)
    `)
    .eq('id', id)
    .single();
  if (!match) notFound();

  const home = Array.isArray(match.player_home) ? match.player_home[0] : match.player_home;
  const away = Array.isArray(match.player_away) ? match.player_away[0] : match.player_away;
  const isPlayer = user.id === match.player_home_id || user.id === match.player_away_id;
  const isAway = user.id === match.player_away_id;

  const statusLabel: Record<string, string> = {
    pending_acceptance: 'Waiting for opponent to accept',
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    disputed: 'Disputed — awaiting admin review',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };

  return (
    <div className="container-app py-8 max-w-2xl mx-auto">
      <h1 className="font-heading text-2xl font-bold mb-2">
        {match.match_type === 'standalone' ? '1v1 Match' : 'Tournament Match'}
      </h1>

      {/* Scoreboard */}
      <div className="rounded-lg border border-surface-200 bg-white p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 text-center">
            <Link href={`/profile/${home?.username}`} className="font-semibold hover:text-brand">
              {home?.username ?? 'TBD'}
            </Link>
            {match.status === 'completed' && (
              <div className="mt-1 text-3xl font-heading font-bold">{match.score_home ?? '-'}</div>
            )}
          </div>
          <div className="text-center">
            <span className="text-lg font-bold text-ink-muted">vs</span>
            {match.status === 'completed' && match.winner_id && (
              <div className="mt-1 text-xs text-accent font-semibold">
                {match.winner_id === match.player_home_id ? '◀ Winner' : 'Winner ▶'}
              </div>
            )}
          </div>
          <div className="flex-1 text-center">
            <Link href={`/profile/${away?.username}`} className="font-semibold hover:text-brand">
              {away?.username ?? 'TBD'}
            </Link>
            {match.status === 'completed' && (
              <div className="mt-1 text-3xl font-heading font-bold">{match.score_away ?? '-'}</div>
            )}
          </div>
        </div>
      </div>

      {/* Status + schedule */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <span className="rounded-full bg-surface-100 px-3 py-1 font-medium">
          {statusLabel[match.status] ?? match.status}
        </span>
        <span className="text-ink-muted">
          {formatDate(match.scheduled_at)} at {formatTime(match.scheduled_at)}
        </span>
      </div>

      {/* Actions: accept/decline, report score, cancel */}
      {isPlayer && <MatchActions match={match} userId={user.id} isAway={isAway} />}

      {/* Evidence upload */}
      {isPlayer && (match.status === 'in_progress' || match.status === 'completed' || match.status === 'disputed') && (
        <EvidenceUpload matchId={match.id} />
      )}

      {/* Evidence gallery */}
      {match.evidence && match.evidence.length > 0 && (
        <div className="mt-6">
          <h2 className="font-heading text-lg font-semibold mb-2">Evidence</h2>
          <div className="flex gap-3 flex-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {match.evidence.map((ev: { id: string; image_url: string }) => (
              <img key={ev.id} src={ev.image_url} alt="match evidence" className="w-32 h-32 object-cover rounded border" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
