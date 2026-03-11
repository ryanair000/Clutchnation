/** Domain types derived from DB but used in components */

// -- PSN Types --

export type PsnVerifiedStatus =
  | 'none'
  | 'lookup_matched'
  | 'confirmed_by_user'
  | 'private_or_unavailable'
  | 'sync_failed';

export type PsnSyncStatus = 'never' | 'ok' | 'stale' | 'error';

export type PsnAvailability = 'public' | 'private_or_unavailable' | 'partial';

export interface NormalizedPsnProfile {
  accountId: string;
  onlineId: string;
  avatarUrl: string | null;
  aboutMe: string | null;
  isPlus: boolean | null;
  trophyLevel: number | null;
  trophyCounts: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  } | null;
  shareUrl: string | null;
  presence: {
    state: 'online' | 'offline' | 'unknown';
    platform: string | null;
    titleName: string | null;
    titleId: string | null;
  } | null;
  recentActivity: {
    fc26LastPlayedAt: string | null;
    fc26PlayDuration: string | null;
  } | null;
  availability: PsnAvailability;
  fetchedAt: string;
}

/** @deprecated Use NormalizedPsnProfile instead */
export interface PSNPlayerData {
  accountId: string;
  onlineId: string;
  avatarUrl: string | null;
  aboutMe: string | null;
  isPlus: boolean;
  presenceState: 'online' | 'offline' | 'unknown';
  presenceGame: string | null;
  trophyLevel: number | null;
  trophySummary: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  } | null;
  fetchedAt: string;
}

// -- Profile --

export interface Profile {
  id: string;
  username: string;
  psn_online_id: string;
  avatar_url: string | null;
  bio: string | null;
  country: string;
  timezone: string;
  is_admin: boolean;
  is_banned: boolean;
  /** @deprecated Use psn_profile_cache table instead */
  psn_data: PSNPlayerData | null;
  psn_data_fetched_at: string | null;
  psn_account_id: string | null;
  psn_verified_status: PsnVerifiedStatus;
  psn_profile_url: string | null;
  psn_sync_status: PsnSyncStatus;
  psn_public_last_synced_at: string | null;
  psn_last_lookup_error: string | null;
  stats_matches_played: number;
  stats_matches_won: number;
  stats_tournaments_played: number;
  stats_tournaments_won: number;
  stats_goals_for: number;
  stats_goals_against: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileFormData {
  username: string;
  psn_online_id: string;
  bio: string;
  country: string;
}

/** Tournament with participant count (used on list pages) */
export interface TournamentWithCount {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  mode: string;
  size: number;
  status: string;
  starts_at: string;
  registration_closes_at: string;
  created_at: string;
  host: { username: string | null; avatar_url: string | null } | null;
  participant_count: number;
}

/** Create tournament form data */
export interface CreateTournamentData {
  title: string;
  description: string;
  mode: string;
  size: number;
  rules_half_length_min: number;
  registration_closes_at: string;
  starts_at: string;
}

/** Leaderboard entry with joined profile info */
export interface LeaderboardEntry {
  id: string;
  user_id: string;
  season: string;
  mode: string;
  matches_played: number;
  matches_won: number;
  win_rate: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  tournaments_won: number;
  points: number;
  rank: number | null;
  computed_at: string;
  profile: {
    username: string | null;
    avatar_url: string | null;
    psn_online_id: string | null;
    psn_verified_status: PsnVerifiedStatus | null;
    country: string;
  } | null;
}

// -- Community Types --

export const ACTIVITY_EVENT_TYPES = [
  'match_completed',
  'tournament_created',
  'tournament_won',
  'player_joined',
  'streak_milestone',
  'rank_achieved',
] as const;
export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[number];

export const REACTION_TYPES_ENUM = ['like', 'fire', 'gg', 'clutch'] as const;
export type ReactionType = (typeof REACTION_TYPES_ENUM)[number];

export interface ActivityEvent {
  id: string;
  actor_id: string;
  event_type: ActivityEventType;
  metadata: Record<string, unknown>;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  actor?: { username: string | null; avatar_url: string | null };
}

export interface CommunityPost {
  id: string;
  author_id: string;
  post_type: 'text' | 'media' | 'discussion';
  title: string | null;
  content: string;
  media_urls: string[];
  group_id: string | null;
  is_pinned: boolean;
  is_deleted: boolean;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  author?: { username: string | null; avatar_url: string | null };
}

export type FeedItem =
  | { type: 'activity'; data: ActivityEvent }
  | { type: 'post'; data: CommunityPost };

export interface Reaction {
  id: string;
  user_id: string;
  target_type: 'post' | 'activity' | 'comment';
  target_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface Comment {
  id: string;
  author_id: string;
  target_type: 'post' | 'activity';
  target_id: string;
  body: string;
  is_deleted: boolean;
  created_at: string;
  author?: { username: string | null; avatar_url: string | null };
}

export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  owner_id: string;
  is_public: boolean;
  max_members: number;
  member_count: number;
  created_at: string;
  updated_at: string;
  owner?: { username: string | null; avatar_url: string | null };
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  profile?: { username: string | null; avatar_url: string | null };
}

// -- Stream Types --

export const STREAM_PLATFORMS = ['twitch', 'youtube', 'kick', 'tiktok'] as const;
export type StreamPlatform = (typeof STREAM_PLATFORMS)[number];

export interface StreamChannel {
  id: string;
  user_id: string;
  platform: StreamPlatform;
  channel_name: string;
  channel_id: string | null;
  channel_url: string;
  is_live: boolean;
  stream_title: string | null;
  viewer_count: number;
  thumbnail_url: string | null;
  game_name: string | null;
  started_at: string | null;
  last_synced_at: string | null;
  created_at: string;
}

export interface StreamChannelWithProfile extends StreamChannel {
  profile: {
    username: string | null;
    avatar_url: string | null;
    psn_online_id: string | null;
  } | null;
}

/** Player detailed stats for profile view */
export interface PlayerDetailedStats {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  winRate: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  tournamentsPlayed: number;
  tournamentsWon: number;
  currentStreak: number;
  streakType: 'W' | 'L' | 'D' | null;
  bestStreak: number;
  recentForm: ('W' | 'L' | 'D')[];
  avgGoalsPerMatch: number;
  cleanSheets: number;
  points: number;
  rank: number | null;
}
