import type { PlatformType, NormalizedPlatformProfile } from '@/types';

/** Platform lookup API response shape */
export interface PlatformLookupResponse {
  found: boolean;
  data: NormalizedPlatformProfile | null;
  reason?:
    | 'not_found'
    | 'private_or_unavailable'
    | 'upstream_unavailable'
    | 'rate_limited'
    | 'feature_disabled'
    | 'invalid_input';
  cached: boolean;
  error: string | null;
}

/** Platform link request body */
export interface PlatformLinkRequest {
  platform: PlatformType;
  accountId: string;
  username: string;
}

/** Platform sync response */
export interface PlatformSyncResponse {
  success: boolean;
  processed: number;
  updated: number;
  failed: number;
}

/**
 * Interface that each platform adapter must implement.
 * PSN, Steam, Xbox adapters implement lookup + sync.
 * Epic adapter only implements the manual `getProfileUrl`.
 */
export interface PlatformService {
  readonly platform: PlatformType;

  /**
   * Look up a user profile by platform-specific username/ID.
   * Throws PlatformError on failure.
   */
  lookup(username: string): Promise<NormalizedPlatformProfile>;

  /**
   * Refresh cached data for a known linked account.
   * Used by background sync. Throws PlatformError on failure.
   */
  sync(accountId: string): Promise<NormalizedPlatformProfile>;

  /**
   * Build a shareable profile URL for the platform.
   */
  getProfileUrl(username: string): string;
}
