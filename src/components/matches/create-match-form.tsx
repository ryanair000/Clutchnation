"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  opponent: z.string().min(3, 'Enter opponent username or PSN ID'),
  scheduled_at: z.string().min(1, 'Select a date/time'),
  half_length: z.number().min(4).max(10),
});

export function CreateMatchForm({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const opponent = form.get('opponent') as string;
    const scheduled_at = form.get('scheduled_at') as string;
    const half_length = Number(form.get('half_length'));
    const parsed = formSchema.safeParse({ opponent, scheduled_at, half_length });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      setLoading(false);
      return;
    }
    const res = await fetch('/api/matches/create', {
      method: 'POST',
      body: JSON.stringify({ opponent, scheduled_at, half_length }),
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
        <label className="block text-sm font-medium mb-1">Opponent Username or PSN ID</label>
        <input name="opponent" className="input w-full" required minLength={3} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Scheduled Date & Time</label>
        <input name="scheduled_at" type="datetime-local" className="input w-full" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Half Length (minutes)</label>
        <input name="half_length" type="number" min={4} max={10} defaultValue={6} className="input w-24" required />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button type="submit" className={cn('btn btn-brand', { 'opacity-60': loading })} disabled={loading}>
        {loading ? 'Creating...' : 'Create Match'}
      </button>
    </form>
  );
}
