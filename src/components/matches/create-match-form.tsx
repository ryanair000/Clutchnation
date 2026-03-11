"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_GAME_ID } from '@/lib/constants';
import type { Game } from '@/types';

const formSchema = z.object({
  opponent: z.string().min(3, 'Enter opponent username or gamertag'),
  scheduled_at: z.string().min(1, 'Select a date/time'),
  half_length: z.number().min(1).max(30),
  game_id: z.string().min(1),
});

export function CreateMatchForm({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [gameId, setGameId] = useState<string>(DEFAULT_GAME_ID);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('games')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setGames(data as unknown as Game[]);
      });
  }, []);

  const selectedGame = games.find((g) => g.id === gameId);
  const rulesSchema = selectedGame?.rules_schema ?? {};
  const firstRuleKey = Object.keys(rulesSchema)[0];
  const firstRule = firstRuleKey ? (rulesSchema as Record<string, any>)[firstRuleKey] : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const opponent = form.get('opponent') as string;
    const scheduled_at = form.get('scheduled_at') as string;
    const half_length = Number(form.get('half_length'));
    const parsed = formSchema.safeParse({ opponent, scheduled_at, half_length, game_id: gameId });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      setLoading(false);
      return;
    }
    const res = await fetch('/api/matches/create', {
      method: 'POST',
      body: JSON.stringify({ opponent, scheduled_at, half_length, game_id: gameId }),
    });
    if (res.ok) {
      const { matchId } = await res.json();
      router.push(`/matches/${matchId}`);
    } else {
      const { error } = await res.json();
      setError(error || 'Failed to create match');
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Game</label>
        <select
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          className="input w-full"
        >
          {games.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Opponent Username or Gamertag</label>
        <input name="opponent" className="input w-full" required minLength={3} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Scheduled Date & Time</label>
        <input name="scheduled_at" type="datetime-local" className="input w-full" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          {firstRule?.label ?? 'Half Length (minutes)'}
        </label>
        <input
          name="half_length"
          type="number"
          min={firstRule?.min ?? 4}
          max={firstRule?.max ?? 10}
          defaultValue={firstRule?.default ?? 6}
          className="input w-24"
          required
        />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button type="submit" className={cn('btn btn-brand', { 'opacity-60': loading })} disabled={loading}>
        {loading ? 'Creating...' : 'Create Match'}
      </button>
    </form>
  );
}
