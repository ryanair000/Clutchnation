'use client';

import { useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { USERNAME_REGEX, PSN_ID_REGEX, COUNTRIES } from '@/lib/constants';
import { PsnPreviewCard } from '@/components/shared/psn-preview-card';
import type { NormalizedPsnProfile } from '@/types';

const GAME_SUGGESTIONS = [
  'EA SPORTS FC26', 'Ghost of Yōtei', "Marvel's Spider-Man 2", 'GTA VI',
  'Call of Duty: Black Ops 6', 'NBA 2K26', 'Fortnite', 'Apex Legends',
  'Valorant', 'Rocket League', 'Gran Turismo 7', 'WWE 2K25',
  'Mortal Kombat 1', 'Street Fighter 6', 'Tekken 8', "Assassin's Creed Shadows",
  'Elden Ring', 'God of War Ragnarök', 'The Last of Us Part II',
  'Astro Bot', 'Horizon Forbidden West', 'Resident Evil 4',
] as const;

const VISIBLE_GAMES = 8;

const BIO_SUGGESTIONS = [
  // Identity
  'Gamer', 'Developer', 'Streamer', 'Content Creator', 'Pro Player',
  'Casual Gamer', 'Competitive', 'Clan Leader', 'Team Captain',
  // Games
  'FC26 Player', 'FIFA Veteran', 'FPS Lover', 'RPG Fan', 'Battle Royale',
  'Sports Games', 'Racing Fan', 'COD Player', 'GTA Enthusiast',
  // Location / Culture
  'From Nairobi', 'East Africa', 'Kenya', 'African Gaming', 'Mombasa',
  // Personality / Vibes
  'Clutch King', 'Never Give Up', 'GG Only', 'Tryhard', 'Grinder',
  'Night Owl', 'Weekend Warrior', 'Chill Vibes', 'All Day Gaming',
  // Platform
  'PlayStation', 'PS5', 'PS4', 'Console Warrior',
  // Esports
  'Tournament Ready', 'Looking for Team', '1v1 Me', 'Ranked Grinder',
  'Esports Fan', 'Trophy Hunter', 'Platinum Chaser', 'Online Pro',
] as const;

const VISIBLE_COUNT = 6;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface OnboardingFormProps {
  userId: string;
}

export function OnboardingForm({ userId }: OnboardingFormProps) {
  const [username, setUsername] = useState('');
  const [psnId, setPsnId] = useState('');
  const [country, setCountry] = useState('KE');
  const [bio, setBio] = useState('');
  const [favoriteGames, setFavoriteGames] = useState<string[]>([]);
  const [gameSearch, setGameSearch] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // PSN verification state
  const [psnVerifyLoading, setPsnVerifyLoading] = useState(false);
  const [psnProfile, setPsnProfile] = useState<NormalizedPsnProfile | null>(null);
  const [psnVerifyError, setPsnVerifyError] = useState<string | null>(null);
  const [psnNotFound, setPsnNotFound] = useState(false);
  const [psnConfirmed, setPsnConfirmed] = useState(false);

  // Bio suggestion chips
  const [usedSuggestions, setUsedSuggestions] = useState<Set<string>>(new Set());
  const pool = useMemo(
    () => shuffleArray(BIO_SUGGESTIONS.filter((s) => !usedSuggestions.has(s))),
    [usedSuggestions],
  );
  const visibleSuggestions = pool.slice(0, VISIBLE_COUNT);

  // Game suggestion logic — show unselected games, filtered by search
  const gameSuggestions = useMemo(() => {
    const unselected = GAME_SUGGESTIONS.filter((g) => !favoriteGames.includes(g));
    if (gameSearch.trim()) {
      const q = gameSearch.toLowerCase();
      return unselected.filter((g) => g.toLowerCase().includes(q)).slice(0, VISIBLE_GAMES);
    }
    return shuffleArray(unselected).slice(0, VISIBLE_GAMES);
  }, [favoriteGames, gameSearch]);

  const toggleGame = useCallback((game: string) => {
    setFavoriteGames((prev) =>
      prev.includes(game) ? prev.filter((g) => g !== game) : [...prev, game]
    );
    setGameSearch('');
  }, []);

  const handleSuggestionClick = useCallback(
    (tag: string) => {
      setBio((prev) => {
        const trimmed = prev.trim();
        if (!trimmed) return tag;
        // Avoid duplicates in bio text
        if (trimmed.includes(tag)) return prev;
        return `${trimmed} · ${tag}`;
      });
      setUsedSuggestions((prev) => new Set(prev).add(tag));
    },
    [],
  );

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

  async function handlePsnVerify() {
    if (!PSN_ID_REGEX.test(psnId)) return;
    setPsnVerifyLoading(true);
    setPsnVerifyError(null);
    setPsnNotFound(false);
    setPsnProfile(null);
    setPsnConfirmed(false);

    try {
      const res = await fetch(`/api/psn/lookup/${encodeURIComponent(psnId)}`);
      const data = await res.json();

      if (res.status === 404 || data.reason === 'not_found') {
        setPsnNotFound(true);
      } else if (!res.ok || !data.found) {
        setPsnVerifyError(data.error || 'Lookup failed');
      } else {
        setPsnProfile(data.data);
      }
    } catch {
      setPsnVerifyError('Network error — you can still save without verifying');
    } finally {
      setPsnVerifyLoading(false);
    }
  }

  function handlePsnConfirm() {
    setPsnConfirmed(true);
  }

  function handlePsnCancel() {
    setPsnProfile(null);
    setPsnVerifyError(null);
    setPsnNotFound(false);
    setPsnConfirmed(false);
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
        favorite_games: favoriteGames,
      })
      .eq('id', userId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // If user confirmed their PSN profile via lookup, link the account
    if (psnConfirmed && psnProfile) {
      try {
        await fetch('/api/psn/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: psnProfile.accountId,
            onlineId: psnProfile.onlineId,
          }),
        });
      } catch {
        // Non-blocking — profile is saved, linking can happen later
      }
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
        <div className="mt-1 flex gap-2">
          <input
            id="psn_id"
            type="text"
            required
            maxLength={16}
            value={psnId}
            onChange={(e) => {
              setPsnId(e.target.value);
              // Reset verification if user changes the ID
              if (psnConfirmed) {
                setPsnConfirmed(false);
                setPsnProfile(null);
              }
            }}
            className="block flex-1 rounded-lg border border-surface-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-brand"
            placeholder="Your PlayStation ID"
          />
          {!psnConfirmed && (
            <button
              type="button"
              onClick={handlePsnVerify}
              disabled={psnVerifyLoading || !PSN_ID_REGEX.test(psnId)}
              className="rounded-lg bg-surface-100 px-3 py-2 text-xs font-medium text-ink hover:bg-surface-200 disabled:opacity-50 transition-colors"
            >
              {psnVerifyLoading ? 'Checking...' : 'Verify'}
            </button>
          )}
        </div>
        {psnConfirmed && psnProfile && (
          <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
            <span>✓</span> Verified as {psnProfile.onlineId}
            <button
              type="button"
              onClick={handlePsnCancel}
              className="ml-1 text-ink-light underline"
            >
              Change
            </button>
          </p>
        )}
        {!psnConfirmed && (
          <PsnPreviewCard
            profile={psnProfile}
            loading={psnVerifyLoading}
            error={psnVerifyError}
            notFound={psnNotFound}
            onConfirm={handlePsnConfirm}
            onCancel={handlePsnCancel}
          />
        )}
        {fieldErrors.psn_online_id && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.psn_online_id}</p>
        )}
        <p className="mt-1 text-xs text-ink-light">
          Your PlayStation Network Online ID — exactly as it appears on PSN. Tap &quot;Verify&quot; to confirm.
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
        <div className="mt-2 flex flex-wrap gap-1.5">
          {visibleSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              disabled={bio.length + tag.length + 3 > 280}
              onClick={() => handleSuggestionClick(tag)}
              className="rounded-full border border-surface-300 bg-surface-50 px-2.5 py-1 text-xs font-medium text-ink-light hover:border-brand hover:text-brand disabled:opacity-30 transition-colors"
            >
              + {tag}
            </button>
          ))}
        </div>
        <p className="mt-1 text-right text-xs text-ink-light">{bio.length}/280</p>
      </div>

      {/* Favorite Games */}
      <div>
        <label className="block text-sm font-medium text-ink">
          Favorite Games <span className="text-ink-light">(optional)</span>
        </label>

        {/* Selected games */}
        {favoriteGames.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {favoriteGames.map((game) => (
              <button
                key={game}
                type="button"
                onClick={() => toggleGame(game)}
                className="flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand/20"
              >
                {game}
                <span className="text-brand/60">✕</span>
              </button>
            ))}
          </div>
        )}

        {/* Search / filter */}
        <input
          type="text"
          value={gameSearch}
          onChange={(e) => setGameSearch(e.target.value)}
          className="mt-2 block w-full rounded-lg border border-surface-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-brand"
          placeholder="Search games or pick below..."
        />

        {/* Suggestion chips — refresh on pick */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {gameSuggestions.map((game) => (
            <button
              key={game}
              type="button"
              onClick={() => toggleGame(game)}
              className="rounded-full border border-surface-300 bg-surface-50 px-2.5 py-1 text-xs font-medium text-ink-light hover:border-brand hover:text-brand transition-colors"
            >
              + {game}
            </button>
          ))}
          {gameSuggestions.length === 0 && gameSearch.trim() && (
            <button
              type="button"
              onClick={() => {
                if (gameSearch.trim() && !favoriteGames.includes(gameSearch.trim())) {
                  setFavoriteGames((prev) => [...prev, gameSearch.trim()]);
                  setGameSearch('');
                }
              }}
              className="rounded-full border border-brand bg-brand/5 px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand/10 transition-colors"
            >
              + Add &quot;{gameSearch.trim()}&quot;
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-ink-light">Tap to add, tap again to remove. You can also type a custom game.</p>
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
