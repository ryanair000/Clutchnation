/** PSN cache TTLs */
export const PSN_PROFILE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const PSN_ACTIVITY_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
export const PSN_PRESENCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const PSN_FAILED_LOOKUP_RETRY_MS = 30 * 60 * 1000; // 30 minutes

/** FC 26 title identifiers for activity matching */
export const FC26_TITLE_NAMES = ['EA SPORTS FC 26', 'EA SPORTS FC™ 26'] as const;

/** Feature flag keys */
export const PSN_FEATURE_FLAGS = {
  LOOKUP: 'psn_lookup_enabled',
  PRESENCE: 'psn_presence_enabled',
  RECENT_ACTIVITY: 'psn_recent_activity_enabled',
  FC26_EXTERNAL: 'fc26_external_results_enabled',
} as const;
