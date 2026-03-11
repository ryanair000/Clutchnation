export type {
  NormalizedPsnProfile,
  PsnVerifiedStatus,
  PsnSyncStatus,
  PsnAvailability,
} from '@/types';

/** PSN lookup API response shape */
export interface PsnLookupResponse {
  found: boolean;
  data: import('@/types').NormalizedPsnProfile | null;
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

/** PSN link request body */
export interface PsnLinkRequest {
  accountId: string;
  onlineId: string;
}

/** PSN sync response */
export interface PsnSyncResponse {
  success: boolean;
  processed: number;
  updated: number;
  failed: number;
}
