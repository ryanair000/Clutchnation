"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface MatchActionsProps {
  match: {
    id: string;
    status: string;
    match_type: string;
    player_home_id: string | null;
    player_away_id: string | null;
    tournament_id: string | null;
  };
  userId: string;
  isAway: boolean;
}

export function MatchActions({ match, userId, isAway }: MatchActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);

  async function acceptMatch() {
    setLoading(true);
    setError(null);
    const { error: err } = await supabase
      .from('matches')
      .update({ status: 'scheduled' })
      .eq('id', match.id);
    if (err) setError(err.message);
    else router.refresh();
    setLoading(false);
  }

  async function declineMatch() {
    setLoading(true);
    setError(null);
    const { error: err } = await supabase
      .from('matches')
      .update({ status: 'cancelled' })
      .eq('id', match.id);
    if (err) setError(err.message);
    else router.refresh();
    setLoading(false);
  }

  async function cancelMatch() {
    setLoading(true);
    setError(null);
    const { error: err } = await supabase
      .from('matches')
      .update({ status: 'cancelled' })
      .eq('id', match.id);
    if (err) setError(err.message);
    else router.refresh();
    setLoading(false);
  }

  async function reportScore(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const scoreHome = Number(fd.get('scoreHome'));
    const scoreAway = Number(fd.get('scoreAway'));

    if (match.tournament_id) {
      // Use tournament report API
      const res = await fetch(`/api/tournaments/${match.tournament_id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, scoreHome, scoreAway }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to report score');
      } else {
        router.refresh();
      }
    } else {
      // Standalone match: dual-report inline
      const isHome = userId === match.player_home_id;
      const updateData: Record<string, number | string> = { status: 'in_progress' };
      if (isHome) {
        updateData.home_reported_score_home = scoreHome;
        updateData.home_reported_score_away = scoreAway;
      } else {
        updateData.away_reported_score_home = scoreHome;
        updateData.away_reported_score_away = scoreAway;
      }
      const { error: err } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', match.id);
      if (err) {
        setError(err.message);
      } else {
        // Check if both reported and resolve
        const { data: updated } = await supabase
          .from('matches')
          .select('*')
          .eq('id', match.id)
          .single();
        if (
          updated &&
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
                  : null;
            await supabase
              .from('matches')
              .update({
                status: 'completed',
                score_home: finalHome,
                score_away: finalAway,
                winner_id: winnerId,
                result_confirmed_at: new Date().toISOString(),
              })
              .eq('id', match.id);
          } else {
            await supabase
              .from('matches')
              .update({
                status: 'disputed',
                dispute_opened_at: new Date().toISOString(),
              })
              .eq('id', match.id);
          }
        }
        router.refresh();
      }
    }
    setLoading(false);
    setShowReportForm(false);
  }

  return (
    <div className="mb-4">
      {error && <div className="mb-2 text-sm text-red-600">{error}</div>}

      {/* Accept / Decline for pending matches (away player only) */}
      {match.status === 'pending_acceptance' && isAway && (
        <div className="flex gap-2">
          <button
            onClick={acceptMatch}
            disabled={loading}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            Accept Challenge
          </button>
          <button
            onClick={declineMatch}
            disabled={loading}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      )}

      {match.status === 'pending_acceptance' && !isAway && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-ink-muted">Waiting for opponent to accept...</p>
          <button
            onClick={cancelMatch}
            disabled={loading}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Report Score + Cancel for active matches */}
      {(match.status === 'scheduled' || match.status === 'in_progress') && (
        <div className="flex gap-2">
          {!showReportForm ? (
            <>
              <button
                onClick={() => setShowReportForm(true)}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
              >
                Report Score
              </button>
              <button
                onClick={cancelMatch}
                disabled={loading}
                className="rounded-lg border border-surface-300 px-4 py-2 text-sm font-medium text-ink hover:bg-surface-50 transition-colors disabled:opacity-50"
              >
                Cancel Match
              </button>
            </>
          ) : (
            <form onSubmit={reportScore} className="flex items-end gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Home</label>
                <input
                  name="scoreHome"
                  type="number"
                  min={0}
                  max={99}
                  required
                  className="w-16 rounded border border-surface-300 px-2 py-1 text-center"
                />
              </div>
              <span className="pb-1 text-sm font-bold text-ink-muted">-</span>
              <div>
                <label className="block text-xs font-medium mb-1">Away</label>
                <input
                  name="scoreAway"
                  type="number"
                  min={0}
                  max={99}
                  required
                  className="w-16 rounded border border-surface-300 px-2 py-1 text-center"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors',
                  loading && 'opacity-50'
                )}
              >
                Submit
              </button>
              <button
                type="button"
                onClick={() => setShowReportForm(false)}
                className="text-sm text-ink-muted hover:underline"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
