import type { PlatformService } from './types';
import type { NormalizedPlatformProfile } from '@/types';
import { lookupPsnProfile, syncPsnProfile } from '@/lib/psn/service';
import { PLATFORM_PROFILE_URL_TEMPLATES } from '@/lib/constants';

function psnToGeneric(
  psn: Awaited<ReturnType<typeof lookupPsnProfile>>,
): NormalizedPlatformProfile {
  return {
    platform: 'psn',
    accountId: psn.accountId,
    username: psn.onlineId,
    avatarUrl: psn.avatarUrl,
    aboutMe: psn.aboutMe,
    shareUrl: psn.shareUrl,
    presence: psn.presence,
    profileData: {
      isPlus: psn.isPlus,
      trophyLevel: psn.trophyLevel,
      trophyCounts: psn.trophyCounts,
      recentActivity: psn.recentActivity,
    },
    availability: psn.availability,
    fetchedAt: psn.fetchedAt,
  };
}

export const psnAdapter: PlatformService = {
  platform: 'psn',

  async lookup(username: string): Promise<NormalizedPlatformProfile> {
    const psn = await lookupPsnProfile(username);
    return psnToGeneric(psn);
  },

  async sync(accountId: string): Promise<NormalizedPlatformProfile> {
    const psn = await syncPsnProfile(accountId);
    return psnToGeneric(psn);
  },

  getProfileUrl(username: string): string {
    return PLATFORM_PROFILE_URL_TEMPLATES.psn(username);
  },
};
