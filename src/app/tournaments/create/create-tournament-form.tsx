'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MODES, TOURNAMENT_SIZES, HALF_LENGTH_MIN } from '@/lib/constants';

export function CreateTournamentForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<string>(MODES[0]);
  const [size, setSize] = useState<number>(8);
  const [halfLength, setHalfLength] = useState(HALF_LENGTH_MIN);
  const [startsAt, setStartsAt] = useState('');
  const [regCloses, setRegCloses] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (title.length < 3 || title.length > 100) {
      setError('Title must be 3-100 characters');
      return;
    }
    if (!startsAt || !regCloses) {
      setError('Start time and registration close time are required');
      return;
    }
    if (new Date(regCloses) >= new Date(startsAt)) {
      setError('Registration must close before the tournament starts');
      return;
    }
    if (new Date(startsAt) <= new Date()) {
      setError('Start time must be in the future');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in');
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from('tournaments')
      .insert({
        host_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        mode,
        size,
        rules_half_length_min: halfLength,
        starts_at: new Date(startsAt).toISOString(),
        registration_closes_at: new Date(regCloses).toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Auto-join tournament as host
    await supabase.from('tournament_participants').insert({
      tournament_id: data.id,
      user_id: user.id,
    });

    router.push(`/tournaments/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-ink">
          Tournament Name
        </label>
        <input
          id="title"
          type="text"
          required
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-surface-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-brand"
          placeholder="Nairobi FC26 Weekend Cup"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-ink">
          Description <span className="text-ink-light">(optional)</span>
        </label>
        <textarea
          id="description"
          maxLength={1000}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-surface-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-brand"
          placeholder="Rules, prizes, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="mode" className="block text-sm font-medium text-ink">
            Mode
          </label>
          <select
            id="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-surface-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-brand"
          >
            {MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="size" className="block text-sm font-medium text-ink">
            Bracket Size
          </label>
          <select
            id="size"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="mt-1 block w-full rounded-lg border border-surface-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-brand"
          >
            {TOURNAMENT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s} players
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="halfLength" className="block text-sm font-medium text-ink">
          Half Length (minutes)
        </label>
        <input
          id="halfLength"
          type="number"
          min={4}
          max={20}
          value={halfLength}
          onChange={(e) => setHalfLength(Number(e.target.value))}
          className="mt-1 block w-full rounded-lg border border-surface-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-brand"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="regCloses" className="block text-sm font-medium text-ink">
            Registration Closes
          </label>
          <input
            id="regCloses"
            type="datetime-local"
            required
            value={regCloses}
            onChange={(e) => setRegCloses(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-surface-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-brand"
          />
        </div>

        <div>
          <label htmlFor="startsAt" className="block text-sm font-medium text-ink">
            Starts At
          </label>
          <input
            id="startsAt"
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-surface-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-brand"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Creating…' : 'Create Tournament'}
      </button>
    </form>
  );
}
