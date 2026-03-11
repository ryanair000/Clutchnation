import { describe, it, expect } from 'vitest';
import {
  PSN_PROFILE_TTL_MS,
  PSN_ACTIVITY_TTL_MS,
  PSN_PRESENCE_TTL_MS,
  PSN_FAILED_LOOKUP_RETRY_MS,
  FC26_TITLE_NAMES,
  PSN_FEATURE_FLAGS,
} from '@/lib/psn/constants';

describe('PSN constants', () => {
  it('has correct TTL values', () => {
    expect(PSN_PROFILE_TTL_MS).toBe(24 * 60 * 60 * 1000);
    expect(PSN_ACTIVITY_TTL_MS).toBe(2 * 60 * 60 * 1000);
    expect(PSN_PRESENCE_TTL_MS).toBe(5 * 60 * 1000);
    expect(PSN_FAILED_LOOKUP_RETRY_MS).toBe(30 * 60 * 1000);
  });

  it('FC26_TITLE_NAMES includes expected titles', () => {
    expect(FC26_TITLE_NAMES).toContain('EA SPORTS FC 26');
    expect(FC26_TITLE_NAMES).toContain('EA SPORTS FC™ 26');
    expect(FC26_TITLE_NAMES.length).toBeGreaterThanOrEqual(2);
  });

  it('defines all expected feature flags', () => {
    expect(PSN_FEATURE_FLAGS.LOOKUP).toBe('psn_lookup_enabled');
    expect(PSN_FEATURE_FLAGS.PRESENCE).toBe('psn_presence_enabled');
    expect(PSN_FEATURE_FLAGS.RECENT_ACTIVITY).toBe('psn_recent_activity_enabled');
    expect(PSN_FEATURE_FLAGS.FC26_EXTERNAL).toBe('fc26_external_results_enabled');
  });
});
