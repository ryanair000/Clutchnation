import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatTime, formatDateTime, getInitials, isSafeRedirect } from '@/lib/utils';

describe('cn', () => {
  it('merges tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });
});

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2026-03-11T12:00:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    // Should contain year
    expect(result).toContain('2026');
  });

  it('formats a Date object', () => {
    const result = formatDate(new Date('2026-01-15T00:00:00Z'));
    expect(result).toContain('2026');
  });
});

describe('formatTime', () => {
  it('formats time from a date string', () => {
    const result = formatTime('2026-03-11T12:00:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});

describe('formatDateTime', () => {
  it('returns date and time combined', () => {
    const result = formatDateTime('2026-03-11T12:00:00Z');
    expect(result).toContain('2026');
  });
});

describe('getInitials', () => {
  it('gets initials from a two-word name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('gets initials from a single word', () => {
    expect(getInitials('ClutchKing')).toBe('C');
  });

  it('limits to 2 characters', () => {
    expect(getInitials('John Michael Doe').length).toBeLessThanOrEqual(2);
  });
});

describe('isSafeRedirect', () => {
  it('allows simple relative paths', () => {
    expect(isSafeRedirect('/dashboard')).toBe(true);
    expect(isSafeRedirect('/settings/profile')).toBe(true);
  });

  it('rejects protocol-relative URLs', () => {
    expect(isSafeRedirect('//evil.com')).toBe(false);
  });

  it('rejects URLs with protocol', () => {
    expect(isSafeRedirect('https://evil.com')).toBe(false);
    expect(isSafeRedirect('javascript:alert(1)')).toBe(false);
  });

  it('rejects paths with colons', () => {
    expect(isSafeRedirect('/path:something')).toBe(false);
  });

  it('rejects paths not starting with /', () => {
    expect(isSafeRedirect('dashboard')).toBe(false);
  });
});
