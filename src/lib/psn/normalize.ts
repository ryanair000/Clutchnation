import type { NormalizedPsnProfile, PsnAvailability } from '@/types';
import { FC26_TITLE_NAMES } from './constants';

interface RawProfileData {
  accountId: string;
  onlineId: string;
  avatarUrl?: string | null;
  aboutMe?: string | null;
  isPlus?: boolean;
}

interface RawTrophyData {
  trophyLevel?: number;
  progress?: number;
  earnedTrophies?: {
    bronze?: number;
    silver?: number;
    gold?: number;
    platinum?: number;
  };
}

interface RawPresenceData {
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
}

interface RawRecentGame {
  titleId?: string;
  name?: string;
  lastPlayedDateTime?: string;
  playDuration?: string;
}

/**
 * Normalize raw psn-api response data into a stable NormalizedPsnProfile.
 * Handles missing/null fields gracefully — never throws on partial data.
 */
export function normalizePsnProfile(
  profile: RawProfileData,
  trophies?: RawTrophyData | null,
  presence?: RawPresenceData | null,
  recentGames?: RawRecentGame[] | null,
): NormalizedPsnProfile {
  let availability: PsnAvailability = 'public';
  let fieldsPresent = 0;
  const fieldsExpected = 3; // profile, trophies, presence

  // Profile is always expected if we reach here
  fieldsPresent++;

  if (trophies?.trophyLevel != null) fieldsPresent++;
  if (presence?.basicPresence) fieldsPresent++;

  if (fieldsPresent === 0) {
    availability = 'private_or_unavailable';
  } else if (fieldsPresent < fieldsExpected) {
    availability = 'partial';
  }

  // Resolve presence state
  let presenceState: 'online' | 'offline' | 'unknown' = 'unknown';
  let presencePlatform: string | null = null;
  let presenceTitleName: string | null = null;
  let presenceTitleId: string | null = null;

  if (presence?.basicPresence) {
    const bp = presence.basicPresence;
    const onlineStatus =
      bp.primaryPlatformInfo?.onlineStatus?.toLowerCase();
    if (onlineStatus === 'online') presenceState = 'online';
    else if (onlineStatus === 'offline') presenceState = 'offline';

    presencePlatform = bp.primaryPlatformInfo?.platform ?? null;

    const currentTitle = bp.gameTitleInfoList?.[0];
    if (currentTitle) {
      presenceTitleName = currentTitle.titleName ?? null;
      presenceTitleId = currentTitle.npTitleId ?? null;
    }
  }

  // Resolve FC 26 recent activity
  let fc26LastPlayedAt: string | null = null;
  let fc26PlayDuration: string | null = null;

  if (recentGames) {
    const fc26Game = recentGames.find(
      (g) =>
        g.name &&
        FC26_TITLE_NAMES.some((t) =>
          g.name!.toLowerCase().includes(t.toLowerCase()),
        ),
    );
    if (fc26Game) {
      fc26LastPlayedAt = fc26Game.lastPlayedDateTime ?? null;
      fc26PlayDuration = fc26Game.playDuration ?? null;
    }
  }

  return {
    accountId: profile.accountId,
    onlineId: profile.onlineId,
    avatarUrl: profile.avatarUrl ?? null,
    aboutMe: profile.aboutMe ?? null,
    isPlus: profile.isPlus ?? null,
    trophyLevel: trophies?.trophyLevel ?? null,
    trophyCounts: trophies?.earnedTrophies
      ? {
          bronze: trophies.earnedTrophies.bronze ?? 0,
          silver: trophies.earnedTrophies.silver ?? 0,
          gold: trophies.earnedTrophies.gold ?? 0,
          platinum: trophies.earnedTrophies.platinum ?? 0,
        }
      : null,
    shareUrl: `https://psnprofiles.com/${encodeURIComponent(profile.onlineId)}`,
    presence: {
      state: presenceState,
      platform: presencePlatform,
      titleName: presenceTitleName,
      titleId: presenceTitleId,
    },
    recentActivity: {
      fc26LastPlayedAt,
      fc26PlayDuration,
    },
    availability,
    fetchedAt: new Date().toISOString(),
  };
}
