'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { USERNAME_REGEX, PSN_ID_REGEX, COUNTRIES, MAX_AVATAR_SIZE_MB } from '@/lib/constants';
import { getInitials } from '@/lib/utils';
import type { Database } from '@/types/database';

const GAME_SUGGESTIONS = [
  'EA SPORTS FC26', 'Ghost of Yōtei', "Marvel's Spider-Man 2", 'GTA VI',
  'Call of Duty: Black Ops 6', 'NBA 2K26', 'Fortnite', 'Apex Legends',
  'Valorant', 'Rocket League', 'Gran Turismo 7', 'WWE 2K25',
  'Mortal Kombat 1', 'Street Fighter 6', 'Tekken 8', "Assassin's Creed Shadows",
  'Elden Ring', 'God of War Ragnarök', 'The Last of Us Part II',
  'Astro Bot', 'Horizon Forbidden West', 'Resident Evil 4',
] as const;

const VISIBLE_GAMES = 8;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Profile = Database['public']['Tables']['profiles']['Row'];

interface EditProfileFormProps {
  profile: Profile;
}

export function EditProfileForm({ profile }: EditProfileFormProps) {
  const [username, setUsername] = useState(profile.username ?? '');
  const [psnId, setPsnId] = useState(profile.psn_online_id ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [country, setCountry] = useState(profile.country);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [favoriteGames, setFavoriteGames] = useState<string[]>(profile.favorite_games ?? []);
  const [gameSearch, setGameSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
      setError(`Avatar must be under ${MAX_AVATAR_SIZE_MB}MB`);
      return;
    }

    setUploading(true);
    setError('');

    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `${profile.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(path);

    // Update profile with new avatar URL
    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', profile.id);

    setAvatarUrl(publicUrl);
    setUploading(false);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!USERNAME_REGEX.test(username)) {
      setError('Username must be 3-20 characters (letters, numbers, underscores)');
      setLoading(false);
      return;
    }
    if (!PSN_ID_REGEX.test(psnId)) {
      setError('PSN ID must start with a letter, 3-16 characters');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Check uniqueness if changed
    if (username !== profile.username) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', profile.id)
        .maybeSingle();
      if (data) {
        setError('Username is already taken');
        setLoading(false);
        return;
      }
    }
    if (psnId !== profile.psn_online_id) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('psn_online_id', psnId)
        .neq('id', profile.id)
        .maybeSingle();
      if (data) {
        setError('PSN ID is already registered');
        setLoading(false);
        return;
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username,
        psn_online_id: psnId,
        bio: bio || null,
        country,
        favorite_games: favoriteGames,
      })
      .eq('id', profile.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess('Profile updated!');
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-accent-50 px-4 py-3 text-sm text-accent-700">{success}</div>
      )}

      {/* Avatar */}
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
            {getInitials(username || '??')}
          </div>
        )}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-50 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Uploading...' : 'Change avatar'}
          </button>
          <p className="mt-1 text-xs text-ink-light">Max {MAX_AVATAR_SIZE_MB}MB. JPG, PNG, WebP.</p>
        </div>
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-ink">Display Name</label>
        <input
          id="username"
          type="text"
          required
          maxLength={20}
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/\s/g, '_'))}
          className="mt-1 block w-full rounded-lg border border-surface-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-brand"
        />
      </div>

      <div>
        <label htmlFor="psn_id" className="block text-sm font-medium text-ink">PSN Online ID</label>
        <input
          id="psn_id"
          type="text"
          required
          maxLength={16}
          value={psnId}
          onChange={(e) => setPsnId(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-surface-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-brand"
        />
      </div>

      <div>
        <label htmlFor="country" className="block text-sm font-medium text-ink">Country</label>
        <select
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-surface-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-brand"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-ink">Bio</label>
        <textarea
          id="bio"
          maxLength={280}
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-surface-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-brand"
        />
        <p className="mt-1 text-right text-xs text-ink-light">{bio.length}/280</p>
      </div>

      {/* Favorite Games */}
      <div>
        <label className="block text-sm font-medium text-ink">Favorite Games</label>

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

        <input
          type="text"
          value={gameSearch}
          onChange={(e) => setGameSearch(e.target.value)}
          className="mt-2 block w-full rounded-lg border border-surface-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:ring-brand"
          placeholder="Search games or pick below..."
        />

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
        <p className="mt-1 text-xs text-ink-light">Tap to add, tap again to remove.</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
