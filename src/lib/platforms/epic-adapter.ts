import type { PlatformService } from './types';
import type { NormalizedPlatformProfile } from '@/types';
import { PlatformError } from './errors';
import { PLATFORM_PROFILE_URL_TEMPLATES } from '@/lib/constants';

/**
 * Epic Games adapter — manual entry only.
 *
 * Epic has no public API for profile lookups.
 * Users enter their display name manually. The platform stores it
 * without server-side verification (verified_status = 'lookup_matched').
 *
 * Future: Add Epic OAuth for verified linking.
 */
export const epicAdapter: PlatformService = {
  platform: 'epic',

  async lookup(username: string): Promise<NormalizedPlatformProfile> {
    // No server-side lookup available — return a minimal profile
    // based on the user-provided display name.
    return {
      platform: 'epic',
      accountId: username.toLowerCase(),
      username,
      avatarUrl: null,
      aboutMe: null,
      shareUrl: PLATFORM_PROFILE_URL_TEMPLATES.epic(username),
      presence: null,
      profileData: {},
      availability: 'partial',
      fetchedAt: new Date().toISOString(),
    };
  },

  async sync(_accountId: string): Promise<NormalizedPlatformProfile> {
    // No sync available for Epic — re-throw as feature not available
    throw new PlatformError('epic', 'feature_disabled', 'Epic Games profile sync is not available');
  },

  getProfileUrl(username: string): string {
    return PLATFORM_PROFILE_URL_TEMPLATES.epic(username);
  },
};
