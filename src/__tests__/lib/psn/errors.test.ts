import { describe, it, expect } from 'vitest';
import { PsnError, toPsnError } from '@/lib/psn/errors';
import type { PsnErrorCode } from '@/lib/psn/errors';

describe('PsnError', () => {
  it('creates an error with code and message', () => {
    const err = new PsnError('not_found', 'PSN account not found');
    expect(err.message).toBe('PSN account not found');
    expect(err.code).toBe('not_found');
    expect(err.name).toBe('PsnError');
  });

  it('maps codes to correct HTTP status', () => {
    const cases: Array<[PsnErrorCode, number]> = [
      ['not_found', 404],
      ['private_or_unavailable', 200],
      ['upstream_unavailable', 502],
      ['rate_limited', 429],
      ['feature_disabled', 503],
      ['invalid_input', 400],
      ['auth_failed', 502],
      ['already_linked', 409],
    ];

    for (const [code, expected] of cases) {
      const err = new PsnError(code, 'test');
      expect(err.statusCode).toBe(expected);
    }
  });

  it('is an instance of Error', () => {
    const err = new PsnError('not_found', 'test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PsnError);
  });
});

describe('toPsnError', () => {
  it('passes through existing PsnError', () => {
    const original = new PsnError('rate_limited', 'too fast');
    const result = toPsnError(original);
    expect(result).toBe(original);
  });

  it('maps 404 messages to not_found', () => {
    const result = toPsnError(new Error('HTTP 404 not found'));
    expect(result.code).toBe('not_found');
  });

  it('maps 401/403 to auth_failed', () => {
    expect(toPsnError(new Error('401 Unauthorized')).code).toBe('auth_failed');
    expect(toPsnError(new Error('403 Forbidden')).code).toBe('auth_failed');
    expect(toPsnError(new Error('invalid token')).code).toBe('auth_failed');
  });

  it('maps 429/rate to rate_limited', () => {
    expect(toPsnError(new Error('429 Too Many')).code).toBe('rate_limited');
    expect(toPsnError(new Error('rate limit exceeded')).code).toBe('rate_limited');
  });

  it('defaults to upstream_unavailable for unknown errors', () => {
    const result = toPsnError(new Error('some random failure'));
    expect(result.code).toBe('upstream_unavailable');
    expect(result.message).toContain('some random failure');
  });

  it('handles non-Error values', () => {
    const result = toPsnError('string error');
    expect(result).toBeInstanceOf(PsnError);
    expect(result.code).toBe('upstream_unavailable');
  });
});
