import type { PlatformService } from './types';
import type { NormalizedPlatformProfile, PlatformAvailability } from '@/types';
import { PlatformError } from './errors';
import { getCachedPlatformProfile, setCachedPlatformProfile, PLATFORM_PROFILE_TTL_MS } from './cache';
import { PLATFORM_PROFILE_URL_TEMPLATES } from '@/lib/constants';

function getOpenXblApiKey(): string {
  const key = process.env.OPENXBL_API_KEY;
  if (!key) {
    throw new PlatformError('xbox', 'auth_failed', 'OPENXBL_API_KEY environment variable is not set');
  }
  return key;
}

interface XboxProfile {
  xuid: string;
  gamertag: string;
  gamerscore: number;
  displayPicRaw: string;
  realName?: string;
  bio?: string;
  presenceState?: string; // 'Online' | 'Offline' | 'Away'
  presenceText?: string; // e.g. 'Playing EA SPORTS FC 26'
}

async function lookupXboxProfile(apiKey: string, gamertag: string): Promise<XboxProfile> {
  const url = `https://xbl.io/api/v2/search/${encodeURIComponent(gamertag)}`;

  const res = await fetch(url, {
    headers: {
      'X-Authorization': apiKey,
      'Accept': 'application/json',
    },
  });

  if (res.status === 429) {
    throw new PlatformError('xbox', 'rate_limited', 'Xbox API rate limit reached');
  }
  if (!res.ok) {
    throw new PlatformError('xbox', 'upstream_unavailable', `Xbox API returned ${res.status}`);
  }

  const json = await res.json();
  const people = json?.people ?? json?.profileUsers;

  if (!people || people.length === 0) {
    throw new PlatformError('xbox', 'not_found', `Xbox account "${gamertag}" not found`);
  }

  const person = people[0];

  // Extract settings from Xbox profile response
  const settings = person.settings as Array<{ id: string; value: string }> | undefined;
  const getSetting = (id: string) => settings?.find((s) => s.id === id)?.value;

  return {
    xuid: person.id ?? person.xuid ?? '',
    gamertag: getSetting('Gamertag') ?? person.gamertag ?? gamertag,
    gamerscore: parseInt(getSetting('Gamerscore') ?? '0', 10),
    displayPicRaw: getSetting('GameDisplayPicRaw') ?? person.displayPicRaw ?? '',
    realName: getSetting('RealName') ?? person.realName,
    bio: getSetting('Bio') ?? person.bio,
    presenceState: getSetting('PresenceState') ?? person.presenceState,
    presenceText: getSetting('PresenceText') ?? person.presenceText,
  };
}

async function getXboxProfileByXuid(apiKey: string, xuid: string): Promise<XboxProfile> {
  const url = `https://xbl.io/api/v2/player/summary/${encodeURIComponent(xuid)}`;

  const res = await fetch(url, {
    headers: {
      'X-Authorization': apiKey,
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new PlatformError('xbox', 'upstream_unavailable', `Xbox API returned ${res.status}`);
  }

  const json = await res.json();
  const people = json?.people ?? [json];

  if (!people || people.length === 0) {
    throw new PlatformError('xbox', 'not_found', 'Xbox profile not found for XUID');
  }

  const person = people[0];
  return {
    xuid: person.xuid ?? xuid,
    gamertag: person.gamertag ?? '',
    gamerscore: person.gamerscore ?? 0,
    displayPicRaw: person.displayPicRaw ?? '',
    realName: person.realName,
    bio: person.bio,
    presenceState: person.presenceState,
    presenceText: person.presenceText,
  };
}

function mapPresence(state?: string): 'online' | 'offline' | 'unknown' {
  if (!state) return 'unknown';
  const lower = state.toLowerCase();
  if (lower === 'online') return 'online';
  if (lower === 'offline') return 'offline';
  return 'unknown';
}

function normalize(profile: XboxProfile): NormalizedPlatformProfile {
  const availability: PlatformAvailability = profile.gamertag ? 'public' : 'partial';

  // Extract current game from presence text like "Playing EA SPORTS FC 26"
  let titleName: string | null = null;
  if (profile.presenceText?.startsWith('Playing ')) {
    titleName = profile.presenceText.substring(8);
  }

  return {
    platform: 'xbox',
    accountId: profile.xuid,
    username: profile.gamertag,
    avatarUrl: profile.displayPicRaw || null,
    aboutMe: profile.bio || null,
    shareUrl: PLATFORM_PROFILE_URL_TEMPLATES.xbox(profile.gamertag),
    presence: {
      state: mapPresence(profile.presenceState),
      platform: 'Xbox',
      titleName,
      titleId: null,
    },
    profileData: {
      gamerscore: profile.gamerscore,
      realName: profile.realName,
    },
    availability,
    fetchedAt: new Date().toISOString(),
  };
}

export const xboxAdapter: PlatformService = {
  platform: 'xbox',

  async lookup(username: string): Promise<NormalizedPlatformProfile> {
    const apiKey = getOpenXblApiKey();

    const xboxProfile = await lookupXboxProfile(apiKey, username);

    // Check cache by XUID
    const cached = await getCachedPlatformProfile('xbox', xboxProfile.xuid, PLATFORM_PROFILE_TTL_MS);
    if (cached) return cached;

    const profile = normalize(xboxProfile);
    await setCachedPlatformProfile(profile);
    return profile;
  },

  async sync(accountId: string): Promise<NormalizedPlatformProfile> {
    const apiKey = getOpenXblApiKey();
    const xboxProfile = await getXboxProfileByXuid(apiKey, accountId);
    const profile = normalize(xboxProfile);

    await setCachedPlatformProfile(profile);
    return profile;
  },

  getProfileUrl(username: string): string {
    return PLATFORM_PROFILE_URL_TEMPLATES.xbox(username);
  },
};
