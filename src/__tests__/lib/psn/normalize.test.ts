import { describe, it, expect } from 'vitest';
import { normalizePsnProfile } from '@/lib/psn/normalize';

const baseProfile = {
  accountId: '1234567890',
  onlineId: 'ClutchKing254',
  avatarUrl: 'https://image.api.playstation.com/avatar.png',
  aboutMe: 'I play FC 26',
  isPlus: true,
};

const baseTrophies = {
  trophyLevel: 300,
  progress: 50,
  earnedTrophies: { bronze: 100, silver: 50, gold: 20, platinum: 5 },
};

const basePresence = {
  basicPresence: {
    availability: 'availableToPlay',
    primaryPlatformInfo: {
      platform: 'PS5',
      onlineStatus: 'online',
    },
    gameTitleInfoList: [
      { npTitleId: 'PPSA12345', titleName: 'EA SPORTS FC 26' },
    ],
  },
};

const baseRecentGames = [
  {
    titleId: 'PPSA12345',
    name: 'EA SPORTS FC™ 26',
    lastPlayedDateTime: '2026-03-10T12:00:00Z',
    playDuration: 'PT5H30M',
  },
  {
    titleId: 'PPSA99999',
    name: 'Some Other Game',
    lastPlayedDateTime: '2026-03-08T00:00:00Z',
  },
];

describe('normalizePsnProfile', () => {
  it('normalizes a full profile with all data', () => {
    const result = normalizePsnProfile(
      baseProfile,
      baseTrophies,
      basePresence,
      baseRecentGames,
    );

    expect(result.accountId).toBe('1234567890');
    expect(result.onlineId).toBe('ClutchKing254');
    expect(result.avatarUrl).toBe(baseProfile.avatarUrl);
    expect(result.aboutMe).toBe('I play FC 26');
    expect(result.isPlus).toBe(true);
    expect(result.trophyLevel).toBe(300);
    expect(result.trophyCounts).toEqual({
      bronze: 100,
      silver: 50,
      gold: 20,
      platinum: 5,
    });
    expect(result.availability).toBe('public');
    expect(result.shareUrl).toBe(
      'https://psnprofiles.com/ClutchKing254',
    );
    expect(result.fetchedAt).toBeTruthy();
  });

  it('sets presence state to online with platform and title', () => {
    const result = normalizePsnProfile(
      baseProfile,
      baseTrophies,
      basePresence,
      null,
    );

    expect(result.presence?.state).toBe('online');
    expect(result.presence?.platform).toBe('PS5');
    expect(result.presence?.titleName).toBe('EA SPORTS FC 26');
  });

  it('sets presence state to offline', () => {
    const offlinePresence = {
      basicPresence: {
        primaryPlatformInfo: {
          platform: 'PS5',
          onlineStatus: 'offline',
        },
      },
    };
    const result = normalizePsnProfile(baseProfile, null, offlinePresence, null);
    expect(result.presence?.state).toBe('offline');
  });

  it('defaults presence to unknown when no presence data', () => {
    const result = normalizePsnProfile(baseProfile, null, null, null);
    expect(result.presence?.state).toBe('unknown');
  });

  it('handles partial data — profile only, no trophies or presence', () => {
    const result = normalizePsnProfile(baseProfile, null, null, null);

    expect(result.availability).toBe('partial');
    expect(result.trophyLevel).toBeNull();
    expect(result.trophyCounts).toBeNull();
  });

  it('handles minimal profile with missing optional fields', () => {
    const minimal = {
      accountId: '999',
      onlineId: 'MinimalUser',
    };
    const result = normalizePsnProfile(minimal, null, null, null);

    expect(result.accountId).toBe('999');
    expect(result.onlineId).toBe('MinimalUser');
    expect(result.avatarUrl).toBeNull();
    expect(result.aboutMe).toBeNull();
    expect(result.isPlus).toBeNull();
    expect(result.availability).toBe('partial');
  });

  it('resolves FC 26 recent activity', () => {
    const result = normalizePsnProfile(
      baseProfile,
      null,
      null,
      baseRecentGames,
    );

    expect(result.recentActivity?.fc26LastPlayedAt).toBe(
      '2026-03-10T12:00:00Z',
    );
    expect(result.recentActivity?.fc26PlayDuration).toBe('PT5H30M');
  });

  it('returns null FC 26 activity when no matching game', () => {
    const otherGames = [
      {
        titleId: 'PPSA99999',
        name: 'Fortnite',
        lastPlayedDateTime: '2026-03-01T00:00:00Z',
      },
    ];
    const result = normalizePsnProfile(baseProfile, null, null, otherGames);
    expect(result.recentActivity?.fc26LastPlayedAt).toBeNull();
  });

  it('URL-encodes special characters in shareUrl', () => {
    const profile = {
      accountId: '123',
      onlineId: 'User With Spaces',
    };
    const result = normalizePsnProfile(profile, null, null, null);
    expect(result.shareUrl).toBe(
      'https://psnprofiles.com/User%20With%20Spaces',
    );
  });

  it('handles trophy counts with missing individual values', () => {
    const trophies = {
      trophyLevel: 100,
      earnedTrophies: { gold: 10 },
    };
    const result = normalizePsnProfile(baseProfile, trophies, null, null);
    expect(result.trophyCounts).toEqual({
      bronze: 0,
      silver: 0,
      gold: 10,
      platinum: 0,
    });
  });
});
