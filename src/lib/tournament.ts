import { SLOT_DURATION_MIN, NO_SHOW_DEADLINE_MIN } from './constants';

/**
 * Shuffle array using Fisher-Yates (used for random seeding).
 */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Calculate total rounds needed for single-elimination bracket.
 */
export function totalRounds(size: number): number {
  return Math.ceil(Math.log2(size));
}

/**
 * Generate first-round matches for single-elimination bracket.
 * Returns pairs of [homeIndex, awayIndex] based on standard seeding.
 * E.g. size=8 → round 1 seeds: 1v8, 4v5, 2v7, 3v6
 */
export function generateBracketPairs(size: number): [number, number][] {
  const rounds = totalRounds(size);
  const slots = Math.pow(2, rounds); // next power of 2

  function seedPairs(numSlots: number): [number, number][] {
    if (numSlots === 2) return [[0, 1]];
    const prev = seedPairs(numSlots / 2);
    const pairs: [number, number][] = [];
    for (const [a, b] of prev) {
      pairs.push([a, numSlots - 1 - a]);
      pairs.push([b, numSlots - 1 - b]);
    }
    return pairs;
  }

  const pairs = seedPairs(slots);
  // Filter out pairs where both seeds exceed actual participant count
  return pairs.filter(([a, b]) => a < size || b < size);
}

/**
 * Generate match schedule timestamps for a round.
 * Spaces matches by SLOT_DURATION_MIN starting from roundStart.
 */
export function generateMatchTimes(
  roundStart: Date,
  matchCount: number
): { scheduledAt: Date; slotEndAt: Date; noShowDeadline: Date }[] {
  const times: { scheduledAt: Date; slotEndAt: Date; noShowDeadline: Date }[] = [];
  for (let i = 0; i < matchCount; i++) {
    const scheduledAt = new Date(roundStart.getTime() + i * SLOT_DURATION_MIN * 60_000);
    const slotEndAt = new Date(scheduledAt.getTime() + SLOT_DURATION_MIN * 60_000);
    const noShowDeadline = new Date(scheduledAt.getTime() + NO_SHOW_DEADLINE_MIN * 60_000);
    times.push({ scheduledAt, slotEndAt, noShowDeadline });
  }
  return times;
}

/**
 * Build all round-1 match inserts for a tournament.
 */
export function buildRound1Matches(
  tournamentId: string,
  seededPlayerIds: string[],
  startsAt: Date
) {
  const size = seededPlayerIds.length;
  const pairs = generateBracketPairs(size);
  const times = generateMatchTimes(startsAt, pairs.length);

  return pairs.map(([homeIdx, awayIdx], i) => {
    const hasHome = homeIdx < size;
    const hasAway = awayIdx < size;
    const isBye = !hasHome || !hasAway;

    return {
      match_type: 'tournament' as const,
      tournament_id: tournamentId,
      round: 1,
      bracket_position: i + 1,
      player_home_id: hasHome ? seededPlayerIds[homeIdx] : null,
      player_away_id: hasAway ? seededPlayerIds[awayIdx] : null,
      status: isBye ? 'completed' : 'scheduled',
      winner_id: isBye ? (hasHome ? seededPlayerIds[homeIdx] : seededPlayerIds[awayIdx]) : null,
      scheduled_at: times[i].scheduledAt.toISOString(),
      slot_end_at: times[i].slotEndAt.toISOString(),
      no_show_deadline: times[i].noShowDeadline.toISOString(),
    };
  });
}
