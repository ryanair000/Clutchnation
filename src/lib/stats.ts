import { POINTS, CURRENT_SEASON } from './constants';
import type { PlayerDetailedStats } from '@/types';

/**
 * Compute detailed player stats from completed matches.
 */
export function computePlayerStats(
  userId: string,
  matches: {
    id: string;
    player_home_id: string | null;
    player_away_id: string | null;
    score_home: number | null;
    score_away: number | null;
    winner_id: string | null;
    status: string;
    scheduled_at: string;
  }[],
  tournamentsPlayed: number,
  tournamentsWon: number,
  rank: number | null
): PlayerDetailedStats {
  const completed = matches
    .filter((m) => m.status === 'completed')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  let totalWins = 0;
  let totalLosses = 0;
  let totalDraws = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let cleanSheets = 0;
  const results: ('W' | 'L' | 'D')[] = [];

  for (const m of completed) {
    const isHome = m.player_home_id === userId;
    const myGoals = isHome ? (m.score_home ?? 0) : (m.score_away ?? 0);
    const oppGoals = isHome ? (m.score_away ?? 0) : (m.score_home ?? 0);

    goalsFor += myGoals;
    goalsAgainst += oppGoals;

    if (oppGoals === 0) cleanSheets++;

    if (m.winner_id === userId) {
      totalWins++;
      results.push('W');
    } else if (m.winner_id === null) {
      totalDraws++;
      results.push('D');
    } else {
      totalLosses++;
      results.push('L');
    }
  }

  const totalMatches = completed.length;
  const winRate = totalMatches > 0 ? totalWins / totalMatches : 0;
  const avgGoalsPerMatch = totalMatches > 0 ? goalsFor / totalMatches : 0;

  // Compute streaks
  let currentStreak = 0;
  let streakType: 'W' | 'L' | 'D' | null = null;
  let bestStreak = 0;
  let tempStreak = 0;

  if (results.length > 0) {
    streakType = results[results.length - 1];
    for (let i = results.length - 1; i >= 0; i--) {
      if (results[i] === streakType) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Best win streak
    for (const r of results) {
      if (r === 'W') {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }
  }

  // Points calculation
  let points = totalWins * POINTS.MATCH_WIN + totalDraws * POINTS.MATCH_DRAW;
  points += tournamentsWon * POINTS.TOURNAMENT_WIN;
  points += (tournamentsPlayed - tournamentsWon) * POINTS.TOURNAMENT_PARTICIPATION;

  // Recent form (last 5)
  const recentForm = results.slice(-5);

  return {
    totalMatches,
    totalWins,
    totalLosses,
    totalDraws,
    winRate,
    goalsFor,
    goalsAgainst,
    goalDiff: goalsFor - goalsAgainst,
    tournamentsPlayed,
    tournamentsWon,
    currentStreak,
    streakType,
    bestStreak,
    recentForm,
    avgGoalsPerMatch,
    cleanSheets,
    points,
    rank,
  };
}

/** Determine the current season string based on date */
export function getCurrentSeason(): string {
  return CURRENT_SEASON;
}
