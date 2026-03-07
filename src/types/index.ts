/** Domain types derived from DB but used in components */

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
  psn_data: PSNPlayerData | null;
  psn_data_fetched_at: string | null;
  stats_matches_played: number;
  stats_matches_won: number;
  stats_tournaments_played: number;
  stats_tournaments_won: number;
  stats_goals_for: number;
  stats_goals_against: number;
  created_at: string;
  updated_at: string;
}

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
    country: string;
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
