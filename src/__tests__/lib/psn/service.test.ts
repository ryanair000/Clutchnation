import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock psn-api ───────────────────────────────────────────────────
const mockGetAuth = vi.fn();
const mockClearAuth = vi.fn();
const mockGetCached = vi.fn();
const mockSetCached = vi.fn();
const mockMakeUniversalSearch = vi.fn();
const mockGetProfile = vi.fn();
const mockGetTrophySummary = vi.fn();
const mockGetPresence = vi.fn();
const mockGetTitles = vi.fn();

vi.mock('psn-api', () => ({
  makeUniversalSearch: (...args: unknown[]) => mockMakeUniversalSearch(...args),
  getProfileFromAccountId: (...args: unknown[]) => mockGetProfile(...args),
  getUserTrophyProfileSummary: (...args: unknown[]) => mockGetTrophySummary(...args),
  getBasicPresence: (...args: unknown[]) => mockGetPresence(...args),
  getUserTitles: (...args: unknown[]) => mockGetTitles(...args),
}));

vi.mock('@/lib/psn/auth', () => ({
  getPsnAuthContext: () => mockGetAuth(),
  clearPsnAuthCache: () => mockClearAuth(),
}));

vi.mock('@/lib/psn/cache', () => ({
  getCachedProfile: (...args: unknown[]) => mockGetCached(...args),
  setCachedProfile: (...args: unknown[]) => mockSetCached(...args),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({}),
}));

import { lookupPsnProfile, syncPsnProfile } from '@/lib/psn/service';
import { PsnError } from '@/lib/psn/errors';

describe('PSN Service - lookupPsnProfile', () => {
  const mockAuth = { accessToken: 'test-token' };

  beforeEach(() => {
    vi.resetAllMocks();
    mockGetAuth.mockResolvedValue(mockAuth);
    mockGetCached.mockResolvedValue(null);
    mockSetCached.mockResolvedValue(undefined);
    mockGetPresence.mockRejectedValue(new Error('not available'));
    mockGetTitles.mockRejectedValue(new Error('not available'));
  });

  it('resolves a PSN profile by online ID', async () => {
    mockMakeUniversalSearch.mockResolvedValue({
      domainResponses: [
        {
          results: [
            {
              socialMetadata: {
                onlineId: 'Ryanair001',
                accountId: 'acct-123',
              },
            },
          ],
        },
      ],
    });
    mockGetProfile.mockResolvedValue({
      onlineId: 'Ryanair001',
      aboutMe: 'GG',
      isPlus: true,
      avatarUrls: [{ avatarUrl: 'https://img.psn.com/avatar.png' }],
    });
    mockGetTrophySummary.mockResolvedValue({
      trophyLevel: 150,
      progress: 50,
      earnedTrophies: { bronze: 80, silver: 40, gold: 15, platinum: 3 },
    });

    const profile = await lookupPsnProfile('Ryanair001');

    expect(profile.accountId).toBe('acct-123');
    expect(profile.onlineId).toBe('Ryanair001');
    expect(profile.aboutMe).toBe('GG');
    expect(profile.isPlus).toBe(true);
    expect(profile.trophyLevel).toBe(150);
    expect(profile.trophyCounts).toEqual({
      bronze: 80,
      silver: 40,
      gold: 15,
      platinum: 3,
    });
    expect(mockSetCached).toHaveBeenCalledOnce();
  });

  it('returns cached profile when available', async () => {
    const cached = {
      accountId: 'acct-123',
      onlineId: 'CachedUser',
      avatarUrl: null,
      aboutMe: null,
      isPlus: false,
      trophyLevel: 10,
      trophyCounts: null,
      shareUrl: null,
      presence: null,
      recentActivity: null,
      availability: 'public' as const,
      fetchedAt: new Date().toISOString(),
    };

    mockMakeUniversalSearch.mockResolvedValue({
      domainResponses: [
        {
          results: [
            { socialMetadata: { onlineId: 'CachedUser', accountId: 'acct-123' } },
          ],
        },
      ],
    });
    mockGetCached.mockResolvedValue(cached);

    const profile = await lookupPsnProfile('CachedUser');

    expect(profile).toBe(cached);
    expect(mockGetProfile).not.toHaveBeenCalled(); // Shouldn't fetch fresh
  });

  it('throws PsnError not_found when search returns no results', async () => {
    mockMakeUniversalSearch.mockResolvedValue({
      domainResponses: [{ results: [] }],
    });

    await expect(lookupPsnProfile('NonExistent')).rejects.toThrow(PsnError);
    await expect(lookupPsnProfile('NonExistent')).rejects.toThrow(
      /not found/i,
    );
  });

  it('throws PsnError auth_failed when auth fails', async () => {
    mockGetAuth.mockRejectedValue(new Error('Auth failed'));

    await expect(lookupPsnProfile('SomeUser')).rejects.toThrow(PsnError);
    expect(mockClearAuth).toHaveBeenCalled();
  });

  it('handles case-insensitive online ID matching', async () => {
    mockMakeUniversalSearch.mockResolvedValue({
      domainResponses: [
        {
          results: [
            { socialMetadata: { onlineId: 'RYANAIR001', accountId: 'acct-456' } },
            { socialMetadata: { onlineId: 'ryanair002', accountId: 'acct-789' } },
          ],
        },
      ],
    });
    mockGetProfile.mockResolvedValue({
      onlineId: 'RYANAIR001',
      avatarUrls: [],
    });
    mockGetTrophySummary.mockRejectedValue(new Error('unavailable'));

    const profile = await lookupPsnProfile('ryanair001');

    expect(profile.accountId).toBe('acct-456');
    expect(profile.onlineId).toBe('RYANAIR001');
  });

  it('gracefully handles missing trophy/presence data', async () => {
    mockMakeUniversalSearch.mockResolvedValue({
      domainResponses: [
        {
          results: [
            { socialMetadata: { onlineId: 'MinimalUser', accountId: 'acct-min' } },
          ],
        },
      ],
    });
    mockGetProfile.mockResolvedValue({ onlineId: 'MinimalUser' });
    mockGetTrophySummary.mockRejectedValue(new Error('unavailable'));

    const profile = await lookupPsnProfile('MinimalUser');

    expect(profile.accountId).toBe('acct-min');
    expect(profile.trophyLevel).toBeNull();
    expect(profile.trophyCounts).toBeNull();
  });
});

describe('PSN Service - syncPsnProfile', () => {
  const mockAuth = { accessToken: 'test-token' };

  beforeEach(() => {
    vi.resetAllMocks();
    mockGetAuth.mockResolvedValue(mockAuth);
    mockSetCached.mockResolvedValue(undefined);
    mockGetPresence.mockRejectedValue(new Error('not available'));
    mockGetTitles.mockRejectedValue(new Error('not available'));
  });

  it('syncs a known PSN account by accountId', async () => {
    mockGetProfile.mockResolvedValue({
      onlineId: 'SyncedUser',
      aboutMe: 'Updated bio',
      isPlus: false,
      avatarUrls: [{ avatarUrl: 'https://img.psn.com/new-avatar.png' }],
    });
    mockGetTrophySummary.mockResolvedValue({
      trophyLevel: 200,
      progress: 60,
      earnedTrophies: { bronze: 120, silver: 60, gold: 25, platinum: 5 },
    });

    const profile = await syncPsnProfile('acct-sync-1');

    expect(profile.onlineId).toBe('SyncedUser');
    expect(profile.trophyLevel).toBe(200);
    expect(mockSetCached).toHaveBeenCalledOnce();
  });

  it('throws PsnError when profile is unavailable', async () => {
    mockGetProfile.mockRejectedValue(new Error('Profile unavailable'));

    await expect(syncPsnProfile('private-acct')).rejects.toThrow(PsnError);
  });

  it('throws when auth fails during sync', async () => {
    mockGetAuth.mockRejectedValue(new Error('Token expired'));

    await expect(syncPsnProfile('any-acct')).rejects.toThrow(PsnError);
    expect(mockClearAuth).toHaveBeenCalled();
  });
});
