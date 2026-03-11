import { describe, it, expect } from 'vitest';
import { isCacheStale } from '@/lib/psn/cache';

describe('isCacheStale', () => {
  it('returns true when fetchedAt is null', () => {
    expect(isCacheStale(null, 60_000)).toBe(true);
  });

  it('returns true when cache has expired', () => {
    const staleTime = new Date(Date.now() - 120_000).toISOString(); // 2 min ago
    expect(isCacheStale(staleTime, 60_000)).toBe(true); // TTL = 1 min
  });

  it('returns false when cache is still fresh', () => {
    const freshTime = new Date(Date.now() - 30_000).toISOString(); // 30s ago
    expect(isCacheStale(freshTime, 60_000)).toBe(false); // TTL = 1 min
  });

  it('returns false when cache was just set', () => {
    const now = new Date().toISOString();
    expect(isCacheStale(now, 86_400_000)).toBe(false); // TTL = 24h
  });

  it('returns false when TTL is 0 and just set (> comparison)', () => {
    // isCacheStale uses > not >=, so 0ms elapsed vs 0 TTL is not stale
    const now = new Date().toISOString();
    expect(isCacheStale(now, 0)).toBe(false);
  });

  it('returns true when TTL is 0 and time has passed', () => {
    const past = new Date(Date.now() - 1).toISOString();
    expect(isCacheStale(past, 0)).toBe(true);
  });

  it('handles edge case at exact expiry boundary', () => {
    // Exactly at TTL boundary — should be stale since > is used
    const exactBoundary = new Date(Date.now() - 60_000).toISOString();
    // At exactly TTL, Date.now() - fetchedAt === TTL, so > TTL is false
    // It's technically not stale yet
    expect(isCacheStale(exactBoundary, 60_000)).toBe(false);
  });
});
