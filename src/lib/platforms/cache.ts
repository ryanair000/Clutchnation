import { createServiceClient } from '@/lib/supabase/service';
import type { PlatformType, NormalizedPlatformProfile } from '@/types';

/** Default profile cache TTL — 24 hours */
export const PLATFORM_PROFILE_TTL_MS = 24 * 60 * 60 * 1000;

/** Check if a cached timestamp is stale relative to a TTL. */
export function isCacheStale(fetchedAt: string | null, ttlMs: number): boolean {
  if (!fetchedAt) return true;
  return Date.now() - new Date(fetchedAt).getTime() > ttlMs;
}

/**
 * Read a cached platform profile from platform_profile_cache.
 * Returns null if not found or stale.
 */
export async function getCachedPlatformProfile(
  platform: PlatformType,
  accountId: string,
  ttlMs: number = PLATFORM_PROFILE_TTL_MS,
): Promise<NormalizedPlatformProfile | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('platform_profile_cache')
    .select('*')
    .eq('platform', platform)
    .eq('platform_account_id', accountId)
    .single();

  if (error || !data) return null;
  if (isCacheStale(data.fetched_at, ttlMs)) return null;

  return {
    platform: data.platform as PlatformType,
    accountId: data.platform_account_id,
    username: data.username ?? accountId,
    avatarUrl: data.avatar_url,
    aboutMe: data.about_me,
    profileData: (data.profile_data as Record<string, unknown>) ?? {},
    presence: data.presence
      ? {
          state: ((data.presence as Record<string, unknown>).state as 'online' | 'offline' | 'unknown') ?? 'unknown',
          platform: ((data.presence as Record<string, unknown>).platform as string) ?? null,
          titleName: ((data.presence as Record<string, unknown>).titleName as string) ?? null,
          titleId: ((data.presence as Record<string, unknown>).titleId as string) ?? null,
        }
      : null,
    shareUrl: data.share_url,
    availability: 'public',
    fetchedAt: data.fetched_at,
  };
}

/**
 * Upsert a normalized platform profile into the cache table.
 */
export async function setCachedPlatformProfile(
  profile: NormalizedPlatformProfile,
): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from('platform_profile_cache').upsert(
    {
      platform: profile.platform,
      platform_account_id: profile.accountId,
      username: profile.username,
      avatar_url: profile.avatarUrl,
      about_me: profile.aboutMe,
      profile_data: profile.profileData as unknown as Record<string, unknown>,
      presence: profile.presence as unknown as Record<string, unknown> | null,
      share_url: profile.shareUrl,
      fetched_at: profile.fetchedAt,
    },
    { onConflict: 'platform,platform_account_id' },
  );
}
