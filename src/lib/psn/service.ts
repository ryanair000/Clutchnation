import {
  makeUniversalSearch,
  getProfileFromAccountId,
  getUserTitles,
  getBasicPresence,
  getUserTrophyProfileSummary,
  type ProfileFromAccountIdResponse,
} from 'psn-api';
import { getPsnAuthContext, clearPsnAuthCache } from './auth';
import { normalizePsnProfile } from './normalize';
import { getCachedProfile, setCachedProfile } from './cache';
import { PsnError, toPsnError } from './errors';
import { PSN_PROFILE_TTL_MS } from './constants';
import type { NormalizedPsnProfile } from '@/types';

/**
 * Look up a PSN profile by Online ID.
 * 1. Universal search to resolve accountId
 * 2. Check cache by accountId
 * 3. Fetch profile + trophies + optional presence
 * 4. Normalize and cache
 */
export async function lookupPsnProfile(
  onlineId: string,
): Promise<NormalizedPsnProfile> {
  let auth;
  try {
    auth = await getPsnAuthContext();
  } catch {
    clearPsnAuthCache();
    throw new PsnError(
      'auth_failed',
      'Failed to authenticate with PSN service',
    );
  }

  // 1. Universal search to find the account
  let accountId: string | null = null;
  let matchedOnlineId: string = onlineId;

  try {
    const searchResponse = await makeUniversalSearch(
      auth,
      onlineId,
      'SocialAllAccounts',
    );
    const domainResponses = (
      searchResponse as { domainResponses?: Array<{ results?: Array<{ socialMetadata?: { onlineId?: string; accountId?: string } }> }> }
    )?.domainResponses;

    if (domainResponses && domainResponses.length > 0) {
      const results = domainResponses[0]?.results ?? [];

      // Exact case-insensitive match first
      const exactMatch = results.find(
        (r) =>
          r.socialMetadata?.onlineId?.toLowerCase() ===
          onlineId.toLowerCase(),
      );

      if (exactMatch?.socialMetadata) {
        accountId = exactMatch.socialMetadata.accountId ?? null;
        matchedOnlineId =
          exactMatch.socialMetadata.onlineId ?? onlineId;
      } else if (
        results.length === 1 &&
        results[0]?.socialMetadata
      ) {
        // Single strong candidate
        accountId = results[0].socialMetadata.accountId ?? null;
        matchedOnlineId =
          results[0].socialMetadata.onlineId ?? onlineId;
      }
    }
  } catch (err) {
    throw toPsnError(err);
  }

  if (!accountId) {
    throw new PsnError(
      'not_found',
      `PSN account "${onlineId}" not found`,
    );
  }

  // 2. Check cache by resolved accountId
  const cached = await getCachedProfile(accountId, PSN_PROFILE_TTL_MS);
  if (cached) return cached;

  // 3. Fetch profile details
  let rawProfile: ProfileFromAccountIdResponse | null = null;
  try {
    rawProfile = await getProfileFromAccountId(auth, accountId);
  } catch {
    // Profile might be private — continue with minimal data
  }

  // 4. Fetch trophy summary (optional, never blocks)
  let rawTrophies: {
    trophyLevel?: number;
    progress?: number;
    earnedTrophies?: {
      bronze?: number;
      silver?: number;
      gold?: number;
      platinum?: number;
    };
  } | null = null;
  try {
    const trophySummary = await getUserTrophyProfileSummary(
      auth,
      accountId,
    );
    rawTrophies = {
      trophyLevel: Number(trophySummary?.trophyLevel) || undefined,
      progress: trophySummary?.progress,
      earnedTrophies: trophySummary?.earnedTrophies,
    };
  } catch {
    // Trophy data unavailable — not critical
  }

  // 5. Fetch presence (optional)
  let rawPresence: {
    basicPresence?: {
      availability?: string;
      primaryPlatformInfo?: {
        platform?: string;
        onlineStatus?: string;
      };
      gameTitleInfoList?: Array<{
        npTitleId?: string;
        titleName?: string;
      }>;
    };
  } | null = null;
  try {
    const presenceData = await getBasicPresence(auth, accountId);
    rawPresence = {
      basicPresence: presenceData?.basicPresence as typeof rawPresence extends null ? never : NonNullable<typeof rawPresence>['basicPresence'],
    };
  } catch {
    // Presence unavailable — not critical
  }

  // 6. Fetch recent games for FC 26 activity (optional)
  let recentGames: Array<{
    titleId?: string;
    name?: string;
    lastPlayedDateTime?: string;
    playDuration?: string;
  }> | null = null;
  try {
    const titles = await getUserTitles(auth, accountId, {
      limit: 10,
    });
    recentGames =
      titles?.trophyTitles?.map((t) => ({
        titleId: t.npCommunicationId,
        name: t.trophyTitleName,
        lastPlayedDateTime: t.lastUpdatedDateTime,
      })) ?? null;
  } catch {
    // Recent games unavailable — not critical
  }

  // 7. Normalize
  const profileData = rawProfile
    ? {
        accountId,
        onlineId: (rawProfile as { onlineId?: string }).onlineId ?? matchedOnlineId,
        avatarUrl:
          (
            (rawProfile as { avatarUrls?: Array<{ avatarUrl?: string }> })
              .avatarUrls?.[0]
          )?.avatarUrl ?? null,
        aboutMe: (rawProfile as { aboutMe?: string }).aboutMe ?? null,
        isPlus: (rawProfile as { isPlus?: boolean }).isPlus ?? false,
      }
    : {
        accountId,
        onlineId: matchedOnlineId,
      };

  const normalized = normalizePsnProfile(
    profileData,
    rawTrophies,
    rawPresence,
    recentGames,
  );

  // 8. Cache
  await setCachedProfile(normalized);

  return normalized;
}

/**
 * Refresh cached data for a known linked PSN account.
 * Used by background sync.
 */
export async function syncPsnProfile(
  accountId: string,
): Promise<NormalizedPsnProfile> {
  let auth;
  try {
    auth = await getPsnAuthContext();
  } catch {
    clearPsnAuthCache();
    throw new PsnError(
      'auth_failed',
      'Failed to authenticate with PSN service',
    );
  }

  let rawProfile: ProfileFromAccountIdResponse | null = null;
  try {
    rawProfile = await getProfileFromAccountId(auth, accountId);
  } catch {
    throw new PsnError(
      'private_or_unavailable',
      'PSN profile unavailable for sync',
    );
  }

  let rawTrophies: {
    trophyLevel?: number;
    progress?: number;
    earnedTrophies?: {
      bronze?: number;
      silver?: number;
      gold?: number;
      platinum?: number;
    };
  } | null = null;
  try {
    const trophySummary = await getUserTrophyProfileSummary(
      auth,
      accountId,
    );
    rawTrophies = {
      trophyLevel: Number(trophySummary?.trophyLevel) || undefined,
      progress: trophySummary?.progress,
      earnedTrophies: trophySummary?.earnedTrophies,
    };
  } catch {
    // Not critical
  }

  const profileData = rawProfile
    ? {
        accountId,
        onlineId: (rawProfile as { onlineId?: string }).onlineId ?? accountId,
        avatarUrl:
          (
            (rawProfile as { avatarUrls?: Array<{ avatarUrl?: string }> })
              .avatarUrls?.[0]
          )?.avatarUrl ?? null,
        aboutMe: (rawProfile as { aboutMe?: string }).aboutMe ?? null,
        isPlus: (rawProfile as { isPlus?: boolean }).isPlus ?? false,
      }
    : { accountId, onlineId: accountId };

  const normalized = normalizePsnProfile(profileData, rawTrophies);

  await setCachedProfile(normalized);
  return normalized;
}
