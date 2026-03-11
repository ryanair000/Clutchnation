import type { PlatformService } from './types';
import type { NormalizedPlatformProfile, PlatformAvailability } from '@/types';
import { PlatformError } from './errors';
import { getCachedPlatformProfile, setCachedPlatformProfile, PLATFORM_PROFILE_TTL_MS } from './cache';
import { PLATFORM_PROFILE_URL_TEMPLATES } from '@/lib/constants';

function getSteamApiKey(): string {
  const key = process.env.STEAM_API_KEY;
  if (!key) {
    throw new PlatformError('steam', 'auth_failed', 'STEAM_API_KEY environment variable is not set');
  }
  return key;
}

interface SteamPlayer {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarfull: string;
  personastate: number; // 0=offline, 1=online, 2=busy, 3=away, 4=snooze, 5=looking to trade, 6=looking to play
  gameextrainfo?: string; // current game name
  gameid?: string;
}

/**
 * Resolve a Steam vanity URL to a SteamID64.
 * If the input looks like a SteamID64 already (17-digit number), return it directly.
 */
async function resolveVanityUrl(apiKey: string, input: string): Promise<string> {
  // If input is a 17-digit number, assume it's already a SteamID64
  if (/^\d{17}$/.test(input)) return input;

  const url = new URL('https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('vanityurl', input);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new PlatformError('steam', 'upstream_unavailable', `Steam API returned ${res.status}`);
  }

  const json = await res.json();
  const response = json?.response;

  if (response?.success !== 1 || !response?.steamid) {
    throw new PlatformError('steam', 'not_found', `Steam account "${input}" not found`);
  }

  return response.steamid as string;
}

async function getPlayerSummary(apiKey: string, steamId: string): Promise<SteamPlayer> {
  const url = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('steamids', steamId);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new PlatformError('steam', 'upstream_unavailable', `Steam API returned ${res.status}`);
  }

  const json = await res.json();
  const players = json?.response?.players as SteamPlayer[] | undefined;

  if (!players || players.length === 0) {
    throw new PlatformError('steam', 'not_found', 'Steam profile not found');
  }

  return players[0];
}

function mapPresenceState(personastate: number): 'online' | 'offline' | 'unknown' {
  if (personastate >= 1 && personastate <= 6) return 'online';
  if (personastate === 0) return 'offline';
  return 'unknown';
}

function normalize(player: SteamPlayer): NormalizedPlatformProfile {
  const availability: PlatformAvailability = player.personaname ? 'public' : 'partial';

  return {
    platform: 'steam',
    accountId: player.steamid,
    username: player.personaname,
    avatarUrl: player.avatarfull || player.avatar || null,
    aboutMe: null,
    shareUrl: player.profileurl || PLATFORM_PROFILE_URL_TEMPLATES.steam(player.personaname),
    presence: {
      state: mapPresenceState(player.personastate),
      platform: 'Steam',
      titleName: player.gameextrainfo ?? null,
      titleId: player.gameid ?? null,
    },
    profileData: {
      personastate: player.personastate,
      profileurl: player.profileurl,
    },
    availability,
    fetchedAt: new Date().toISOString(),
  };
}

export const steamAdapter: PlatformService = {
  platform: 'steam',

  async lookup(username: string): Promise<NormalizedPlatformProfile> {
    const apiKey = getSteamApiKey();
    const steamId = await resolveVanityUrl(apiKey, username);

    // Check cache first
    const cached = await getCachedPlatformProfile('steam', steamId, PLATFORM_PROFILE_TTL_MS);
    if (cached) return cached;

    const player = await getPlayerSummary(apiKey, steamId);
    const profile = normalize(player);

    await setCachedPlatformProfile(profile);
    return profile;
  },

  async sync(accountId: string): Promise<NormalizedPlatformProfile> {
    const apiKey = getSteamApiKey();
    const player = await getPlayerSummary(apiKey, accountId);
    const profile = normalize(player);

    await setCachedPlatformProfile(profile);
    return profile;
  },

  getProfileUrl(username: string): string {
    return PLATFORM_PROFILE_URL_TEMPLATES.steam(username);
  },
};
