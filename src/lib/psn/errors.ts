export type PsnErrorCode =
  | 'not_found'
  | 'private_or_unavailable'
  | 'upstream_unavailable'
  | 'rate_limited'
  | 'feature_disabled'
  | 'invalid_input'
  | 'auth_failed'
  | 'already_linked';

export class PsnError extends Error {
  public readonly code: PsnErrorCode;
  public readonly statusCode: number;

  constructor(code: PsnErrorCode, message: string) {
    super(message);
    this.name = 'PsnError';
    this.code = code;
    this.statusCode = PsnError.codeToStatus(code);
  }

  private static codeToStatus(code: PsnErrorCode): number {
    switch (code) {
      case 'not_found':
        return 404;
      case 'private_or_unavailable':
        return 200;
      case 'upstream_unavailable':
        return 502;
      case 'rate_limited':
        return 429;
      case 'feature_disabled':
        return 503;
      case 'invalid_input':
        return 400;
      case 'auth_failed':
        return 502;
      case 'already_linked':
        return 409;
      default:
        return 500;
    }
  }
}

/** Map raw psn-api or network errors to PsnError */
export function toPsnError(err: unknown): PsnError {
  if (err instanceof PsnError) return err;

  const message = err instanceof Error ? err.message : String(err);

  if (message.includes('404') || message.includes('not found')) {
    return new PsnError('not_found', 'PSN account not found');
  }
  if (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('token')
  ) {
    return new PsnError('auth_failed', 'PSN service authentication failed');
  }
  if (message.includes('429') || message.includes('rate')) {
    return new PsnError('rate_limited', 'PSN API rate limit reached');
  }

  return new PsnError(
    'upstream_unavailable',
    `PSN service error: ${message}`,
  );
}
