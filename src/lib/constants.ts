export const APP_NAME = 'ClutchNation';
export const APP_DESCRIPTION = 'FC26 tournaments & matches for PlayStation gamers in Kenya';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const GAME = 'FC26' as const;

export const MODES = ['1v1', '2v2', 'pro_clubs'] as const;
export type GameMode = (typeof MODES)[number];

export const TOURNAMENT_SIZES = [2, 4, 8, 16, 32] as const;
export type TournamentSize = (typeof TOURNAMENT_SIZES)[number];

export const TOURNAMENT_STATUSES = ['registration', 'in_progress', 'completed', 'cancelled'] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export const MATCH_STATUSES = [
  'pending_acceptance',
  'scheduled',
  'in_progress',
  'completed',
  'disputed',
  'cancelled',
  'no_show',
] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const MATCH_TYPES = ['tournament', 'standalone'] as const;
export type MatchType = (typeof MATCH_TYPES)[number];

export const REPORT_REASONS = ['cheating', 'harassment', 'impersonation', 'spam', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** Half length in minutes */
export const HALF_LENGTH_MIN = 6;
/** Slot duration in minutes */
export const SLOT_DURATION_MIN = 30;
/** No-show deadline after slot start (minutes) */
export const NO_SHOW_DEADLINE_MIN = 10;
/** Dispute SLA in minutes */
export const DISPUTE_SLA_MIN = 15;

export const TIMEZONE = 'Africa/Nairobi';

export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
export const PSN_ID_REGEX = /^[a-zA-Z][a-zA-Z0-9_-]{2,15}$/;

export const MAX_AVATAR_SIZE_MB = 2;
export const MAX_EVIDENCE_SIZE_MB = 5;

export const MIN_PASSWORD_LENGTH = 8;

export const ALLOWED_EVIDENCE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

/** Current season identifier */
export const CURRENT_SEASON = '2026-S1';

/** Point system for ranking */
export const POINTS = {
  MATCH_WIN: 3,
  MATCH_DRAW: 1,
  MATCH_LOSS: 0,
  TOURNAMENT_WIN: 25,
  TOURNAMENT_RUNNER_UP: 12,
  TOURNAMENT_SEMIFINAL: 6,
  TOURNAMENT_PARTICIPATION: 2,
} as const;

export const LEADERBOARD_MODES = ['all', '1v1', '2v2', 'pro_clubs'] as const;
export type LeaderboardMode = (typeof LEADERBOARD_MODES)[number];

// -- Community --

export const COMMUNITY_FEED_PAGE_SIZE = 20;
export const MAX_POST_LENGTH = 2000;
export const MAX_COMMENT_LENGTH = 500;
export const MAX_POST_MEDIA = 4;
export const MAX_GROUP_MEMBERS = 50;
export const GROUP_NAME_REGEX = /^[a-zA-Z0-9 _-]{3,50}$/;

// -- Store --

export const ORDER_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;
export const PRODUCT_TYPES = ['physical', 'digital'] as const;
export const SHIPPING_METHODS = ['pickup_mtaani_agent', 'pickup_mtaani_doorstep', 'pickup_mtaani_express', 'digital'] as const;

export const CURRENCY = 'KES';
export const CURRENCY_SYMBOL = 'KSh';

export const MAX_PRODUCT_IMAGE_SIZE_MB = 5;
export const MAX_DIGITAL_FILE_SIZE_MB = 50;

export const MAX_CART_ITEM_QUANTITY = 10;
export const CART_SESSION_COOKIE = 'cn_cart_session';
export const CART_SESSION_MAX_AGE_DAYS = 30;

export const PICKUPMTAANI_API_BASE = 'https://api.pickupmtaani.com/api/v1';
export const ORDER_NUMBER_PREFIX = 'CN';
export const GROUP_SLUG_REGEX = /^[a-z0-9-]{3,60}$/;

export const POST_TYPES = ['text', 'media', 'discussion'] as const;
export type PostType = (typeof POST_TYPES)[number];

export const REACTION_TYPES = [
  { value: 'like', label: 'Like', emoji: '👍' },
  { value: 'fire', label: 'Fire', emoji: '🔥' },
  { value: 'gg', label: 'GG', emoji: '🤝' },
  { value: 'clutch', label: 'Clutch', emoji: '💪' },
] as const;

// -- Streams --

export const STREAM_PLATFORMS = ['twitch', 'youtube', 'kick', 'tiktok'] as const;
export type StreamPlatformConst = (typeof STREAM_PLATFORMS)[number];

export const STREAM_PLATFORM_LABELS: Record<StreamPlatformConst, string> = {
  twitch: 'Twitch',
  youtube: 'YouTube',
  kick: 'Kick',
  tiktok: 'TikTok',
};

export const STREAM_PLATFORM_URLS: Record<StreamPlatformConst, string> = {
  twitch: 'https://twitch.tv/',
  youtube: 'https://youtube.com/',
  kick: 'https://kick.com/',
  tiktok: 'https://tiktok.com/@',
};

export const STREAM_PLATFORM_EMBED: Record<StreamPlatformConst, string | null> = {
  twitch: 'https://player.twitch.tv/?channel={channel}&parent={parent}',
  youtube: 'https://www.youtube.com/embed/live_stream?channel={channel}',
  kick: 'https://player.kick.com/{channel}',
  tiktok: null, // TikTok does not support embedding
};

/** How often the cron syncs live status (minutes) */
export const STREAM_SYNC_INTERVAL_MIN = 3;

/** Mark offline if not synced within this many minutes */
export const STREAM_STALE_THRESHOLD_MIN = 10;

export const COUNTRIES = [
  { code: 'KE', name: 'Kenya' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'GH', name: 'Ghana' },
  { code: 'OTHER', name: 'Other' },
] as const;
