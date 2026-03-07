'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { USERNAME_REGEX, PSN_ID_REGEX, COUNTRIES } from '@/lib/constants';

interface OnboardingFormProps {
  userId: string;
}

export function OnboardingForm({ userId }: OnboardingFormProps) {
  const [username, setUsername] = useState('');
  const [psnId, setPsnId] = useState('');
  const [country, setCountry] = useState('KE');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const router = useRouter();

  async function checkUnique(field: 'username' | 'psn_online_id', value: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq(field, value)
      .neq('id', userId)
      .maybeSingle();
    return !data;
  }

  async function handleUsernameBlur() {
    if (!username || !USERNAME_REGEX.test(username)) return;
    setCheckingUsername(true);
    const isUnique = await checkUnique('username', username);
    setFieldErrors((prev) => ({
      ...prev,
      username: isUnique ? '' : 'Username is already taken',
    }));
    setCheckingUsername(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    if (!USERNAME_REGEX.test(username)) {
      errors.username = 'Username must be 3-20 characters (letters, numbers, underscores)';
    }
    if (!PSN_ID_REGEX.test(psnId)) {
      errors.psn_online_id = 'PSN ID must start with a letter, 3-16 characters';
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    // Check uniqueness
    const [usernameUnique, psnUnique] = await Promise.all([
      checkUnique('username', username),
      checkUnique('psn_online_id', psnId),
    ]);

    if (!usernameUnique) errors.username = 'Username is already taken';
    if (!psnUnique) errors.psn_online_id = 'PSN ID is already registered';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username,
        psn_online_id: psnId,
        country,
        bio: bio || null,
      })
      .eq('id', userId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-ink">
          Display Name
        </label>
        <input
          id="username"
          type="text"
          required
          maxLength={20}
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/\s/g, '_'))}
          onBlur={handleUsernameBlur}
          className="mt-1 block w-full rounded-lg border border-surface-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-brand"
          placeholder="ClutchKing254"
        />
        {checkingUsername && <p className="mt-1 text-xs text-ink-light">Checking availability...</p>}
        {fieldErrors.username && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.username}</p>
        )}
        <p className="mt-1 text-xs text-ink-light">3-20 characters. Letters, numbers, underscores.</p>
      </div>

      <div>
        <label htmlFor="psn_id" className="block text-sm font-medium text-ink">
          PSN Online ID
        </label>
        <input
          id="psn_id"
          type="text"
          required
          maxLength={16}
          value={psnId}
          onChange={(e) => setPsnId(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-surface-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-brand"
          placeholder="Your PlayStation ID"
        />
        {fieldErrors.psn_online_id && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.psn_online_id}</p>
        )}
        <p className="mt-1 text-xs text-ink-light">
          Your PlayStation Network Online ID — exactly as it appears on PSN.
        </p>
      </div>

      <div>
        <label htmlFor="country" className="block text-sm font-medium text-ink">
          Country
        </label>
        <select
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-surface-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-brand"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-ink">
          Bio <span className="text-ink-light">(optional)</span>
        </label>
        <textarea
          id="bio"
          maxLength={280}
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-surface-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-brand"
          placeholder="FC26 enthusiast from Nairobi..."
        />
        <p className="mt-1 text-right text-xs text-ink-light">{bio.length}/280</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Saving...' : 'Complete Setup'}
      </button>
    </form>
  );
}
