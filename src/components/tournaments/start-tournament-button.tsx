'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  tournamentId: string;
}

export function StartTournamentButton({ tournamentId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleStart() {
    if (!confirm('Start the tournament? Registration will close and matches will be generated.')) {
      return;
    }

    setLoading(true);
    setError('');

    const res = await fetch(`/api/tournaments/${tournamentId}/start`, {
      method: 'POST',
    });

    const result = await res.json();
    if (!res.ok) {
      setError(result.error ?? 'Failed to start tournament');
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={handleStart}
        disabled={loading}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Starting…' : 'Start Tournament'}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
