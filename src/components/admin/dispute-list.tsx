'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface PlayerInfo {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface DisputedMatch {
  id: string;
  status: string;
  score_home: number | null;
  score_away: number | null;
  home_reported_score_home: number | null;
  home_reported_score_away: number | null;
  away_reported_score_home: number | null;
  away_reported_score_away: number | null;
  dispute_opened_at: string | null;
  scheduled_at: string;
  player_home: PlayerInfo | PlayerInfo[] | null;
  player_away: PlayerInfo | PlayerInfo[] | null;
}

interface ResolvedMatch {
  id: string;
  status: string;
  score_home: number | null;
  score_away: number | null;
  dispute_resolved_at: string | null;
  scheduled_at: string;
  player_home: PlayerInfo | PlayerInfo[] | null;
  player_away: PlayerInfo | PlayerInfo[] | null;
  resolver: { username: string | null } | { username: string | null }[] | null;
}

interface Props {
  disputes: DisputedMatch[];
  resolved: ResolvedMatch[];
}

function unwrap(p: PlayerInfo | PlayerInfo[] | null): PlayerInfo | null {
  if (!p) return null;
  return Array.isArray(p) ? p[0] ?? null : p;
}

export function DisputeList({ disputes, resolved }: Props) {
  const router = useRouter();
  const [resolving, setResolving] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({});

  function getScores(id: string) {
    return scores[id] ?? { home: '0', away: '0' };
  }

  function updateScore(id: string, field: 'home' | 'away', value: string) {
    setScores((prev) => ({
      ...prev,
      [id]: { ...getScores(id), [field]: value },
    }));
  }

  async function handleResolve(matchId: string, homeId: string | null) {
    const s = getScores(matchId);
    const scoreHome = parseInt(s.home, 10);
    const scoreAway = parseInt(s.away, 10);

    if (isNaN(scoreHome) || isNaN(scoreAway) || scoreHome < 0 || scoreAway < 0) {
      alert('Please enter valid scores.');
      return;
    }

    if (!confirm('Resolve this dispute with the entered scores?')) return;

    setResolving(matchId);
    try {
      let winnerId: string | null = null;
      if (scoreHome > scoreAway) winnerId = homeId;
      // else winner determined server-side

      const res = await fetch(`/api/admin/disputes/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score_home: scoreHome,
          score_away: scoreAway,
          winner_id: winnerId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to resolve dispute');
      }
      router.refresh();
    } finally {
      setResolving(null);
    }
  }

  return (
    <div className="mt-4 space-y-8">
      {/* Active disputes */}
      {disputes.length > 0 ? (
        <div className="space-y-4">
          {disputes.map((d) => {
            const home = unwrap(d.player_home);
            const away = unwrap(d.player_away);
            const s = getScores(d.id);

            return (
              <div key={d.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">Disputed</span>
                    <Link href={`/matches/${d.id}`} className="text-sm font-medium text-brand hover:underline">
                      View Match
                    </Link>
                  </div>
                  <span className="text-xs text-ink-muted">
                    Opened {d.dispute_opened_at ? formatDate(d.dispute_opened_at) : 'N/A'}
                  </span>
                </div>

                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {/* Home report */}
                  <div className="rounded-lg border border-surface-200 bg-white p-3">
                    <p className="text-xs font-medium text-ink-muted">Home Player</p>
                    <p className="font-semibold">{home?.username ?? 'Unknown'}</p>
                    <p className="mt-1 text-sm">
                      Reported: <span className="font-medium">{d.home_reported_score_home ?? '—'} - {d.home_reported_score_away ?? '—'}</span>
                    </p>
                  </div>

                  {/* Away report */}
                  <div className="rounded-lg border border-surface-200 bg-white p-3">
                    <p className="text-xs font-medium text-ink-muted">Away Player</p>
                    <p className="font-semibold">{away?.username ?? 'Unknown'}</p>
                    <p className="mt-1 text-sm">
                      Reported: <span className="font-medium">{d.away_reported_score_home ?? '—'} - {d.away_reported_score_away ?? '—'}</span>
                    </p>
                  </div>
                </div>

                {/* Resolution form */}
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <div>
                    <label className="text-xs font-medium text-ink-muted">Final Home Score</label>
                    <input
                      type="number"
                      min="0"
                      value={s.home}
                      onChange={(e) => updateScore(d.id, 'home', e.target.value)}
                      className="mt-1 block w-20 rounded-lg border border-surface-200 px-2 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-muted">Final Away Score</label>
                    <input
                      type="number"
                      min="0"
                      value={s.away}
                      onChange={(e) => updateScore(d.id, 'away', e.target.value)}
                      className="mt-1 block w-20 rounded-lg border border-surface-200 px-2 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                  <button
                    onClick={() => handleResolve(d.id, home?.id ?? null)}
                    disabled={resolving === d.id}
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                  >
                    {resolving === d.id ? 'Resolving...' : 'Resolve Dispute'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-surface-200 bg-white p-8 text-center text-sm text-ink-muted">
          No active disputes. All clear!
        </div>
      )}

      {/* Recently resolved */}
      {resolved.length > 0 && (
        <div>
          <h3 className="font-heading text-base font-semibold">Recently Resolved</h3>
          <div className="mt-3 space-y-2">
            {resolved.map((r) => {
              const home = unwrap(r.player_home);
              const away = unwrap(r.player_away);
              const resolverData = r.resolver;
              const resolverName = resolverData
                ? Array.isArray(resolverData) ? resolverData[0]?.username : resolverData.username
                : null;

              return (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-surface-200 bg-white p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {home?.username ?? 'TBD'} vs {away?.username ?? 'TBD'}
                    </span>
                    <span className="text-sm font-bold">
                      {r.score_home} - {r.score_away}
                    </span>
                  </div>
                  <div className="text-right text-xs text-ink-muted">
                    <p>Resolved by {resolverName ?? 'Admin'}</p>
                    <p>{r.dispute_resolved_at ? formatDate(r.dispute_resolved_at) : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
