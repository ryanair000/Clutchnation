import { createServiceClient } from '@/lib/supabase/service';
import type { NormalizedPsnProfile } from '@/types';
import { PSN_PROFILE_TTL_MS } from './constants';

/** Check if a cached timestamp is stale relative to a TTL. */
export function isCacheStale(
  fetchedAt: string | null,
  ttlMs: number,
): boolean {
  if (!fetchedAt) return true;
  return Date.now() - new Date(fetchedAt).getTime() > ttlMs;
}

/**
 * Read a cached PSN profile from psn_profile_cache.
 * Returns null if not found or stale.
 */
export async function getCachedProfile(
  accountId: string,
  ttlMs: number = PSN_PROFILE_TTL_MS,
): Promise<NormalizedPsnProfile | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('psn_profile_cache')
    .select('*')
    .eq('psn_account_id', accountId)
    .single();

  if (error || !data) return null;
  if (isCacheStale(data.fetched_at, ttlMs)) return null;

  const trophyCounts = data.trophy_counts as Record<string, number> | null;
  const presence = data.presence as Record<string, unknown> | null;

  return {
    accountId: data.psn_account_id,
    onlineId: data.online_id,
    avatarUrl: data.avatar_url,
    aboutMe: data.about_me,
    isPlus: data.is_plus,
    trophyLevel: data.trophy_level,
    trophyCounts: trophyCounts
      ? {
          bronze: trophyCounts.bronze ?? 0,
          silver: trophyCounts.silver ?? 0,
          gold: trophyCounts.gold ?? 0,
          platinum: trophyCounts.platinum ?? 0,
        }
      : null,
    shareUrl: data.share_url,
    presence: presence
      ? {
          state:
            (presence.state as 'online' | 'offline' | 'unknown') ?? 'unknown',
          platform: (presence.platform as string) ?? null,
          titleName: (presence.titleName as string) ?? null,
          titleId: (presence.titleId as string) ?? null,
        }
      : null,
    recentActivity: {
      fc26LastPlayedAt: data.fc26_last_played_at,
      fc26PlayDuration: data.fc26_play_duration,
    },
    gameActivity: data.game_activity as Record<string, { lastPlayedAt: string | null; playDuration: string | null }> | null,
    availability: 'public',
    fetchedAt: data.fetched_at,
  };
}

/**
 * Upsert a normalized PSN profile into the cache table.
 */
export async function setCachedProfile(
  profile: NormalizedPsnProfile,
): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from('psn_profile_cache').upsert(
    {
      psn_account_id: profile.accountId,
      online_id: profile.onlineId,
      avatar_url: profile.avatarUrl,
      about_me: profile.aboutMe,
      is_plus: profile.isPlus,
      trophy_level: profile.trophyLevel,
      trophy_progress: null,
      trophy_counts: profile.trophyCounts as unknown as Record<
        string,
        unknown
      > | null,
      presence: profile.presence as unknown as Record<
        string,
        unknown
      > | null,
      current_title_name: profile.presence?.titleName ?? null,
      current_title_id: profile.presence?.titleId ?? null,
      current_platform: profile.presence?.platform ?? null,
      fc26_last_played_at: profile.recentActivity?.fc26LastPlayedAt ?? null,
      fc26_play_duration: profile.recentActivity?.fc26PlayDuration ?? null,
      game_activity: profile.gameActivity as unknown as Record<string, unknown> | null,
      share_url: profile.shareUrl,
      fetched_at: profile.fetchedAt,
    },
    { onConflict: 'psn_account_id' },
  );
}
