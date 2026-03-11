'use client';

import { createContext, useContext } from 'react';
import type { PlayerDetailedStats } from '@/types';
import type { Database } from '@/types/database';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type PsnCacheRow = Database['public']['Tables']['psn_profile_cache']['Row'];

export interface MatchRow {
  id: string;
  player_home_id: string | null;
  player_away_id: string | null;
  score_home: number | null;
  score_away: number | null;
  winner_id: string | null;
  status: string;
  scheduled_at: string;
  match_type: string | null;
  tournament_id: string | null;
}

export interface RecentMatchRow {
  id: string;
  match_type: string | null;
  tournament_id: string | null;
  status: string;
  score_home: number | null;
  score_away: number | null;
  winner_id: string | null;
  scheduled_at: string;
  player_home: { username: string | null } | null;
  player_away: { username: string | null } | null;
}

export interface TournamentRow {
  id: string;
  title: string;
  status: string;
  mode: string;
  size: number;
  starts_at: string;
  winner_id: string | null;
}

export interface ProfileContextValue {
  profile: ProfileRow;
  stats: PlayerDetailedStats;
  allMatches: MatchRow[];
  recentMatches: RecentMatchRow[];
  tournaments: TournamentRow[];
  isOwnProfile: boolean;
  currentUserId: string | null;
  psnCache: PsnCacheRow | null;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({
  value,
  children,
}: {
  value: ProfileContextValue;
  children: React.ReactNode;
}) {
  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return ctx;
}
