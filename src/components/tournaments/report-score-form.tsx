'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  tournamentId: string;
  matchId: string;
  opponentName: string;
}

export function ReportScoreForm({ tournamentId, matchId, opponentName }: Props) {
  const router = useRouter();
  const [scoreHome, setScoreHome] = useState(0);
  const [scoreAway, setScoreAway] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const res = await fetch(`/api/tournaments/${tournamentId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, scoreHome, scoreAway }),
    });

    const result = await res.json();
    if (!res.ok) {
      setError(result.error ?? 'Failed to report score');
    } else if (result.confirmed) {
      setSuccess('Score confirmed! Match result recorded.');
    } else if (result.disputed) {
      setSuccess('Scores don\'t match. A dispute has been opened.');
    } else {
      setSuccess('Score reported. Waiting for opponent to confirm.');
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-surface-200 bg-white p-4">
      <h3 className="text-sm font-semibold">Report Score vs {opponentName}</h3>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {success && <p className="mt-2 text-xs text-accent-700">{success}</p>}
      <div className="mt-3 flex items-center gap-3">
        <div>
          <label className="text-xs text-ink-muted">You</label>
          <input
            type="number"
            min={0}
            max={99}
            value={scoreHome}
            onChange={(e) => setScoreHome(Number(e.target.value))}
            className="mt-1 block w-16 rounded border border-surface-300 px-2 py-1 text-center text-sm"
          />
        </div>
        <span className="mt-4 text-ink-muted">—</span>
        <div>
          <label className="text-xs text-ink-muted">{opponentName}</label>
          <input
            type="number"
            min={0}
            max={99}
            value={scoreAway}
            onChange={(e) => setScoreAway(Number(e.target.value))}
            className="mt-1 block w-16 rounded border border-surface-300 px-2 py-1 text-center text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Submit'}
        </button>
      </div>
    </form>
  );
}
