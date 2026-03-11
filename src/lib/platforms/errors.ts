import type { PlatformType } from '@/types';

export type PlatformErrorCode =
  | 'not_found'
  | 'private_or_unavailable'
  | 'upstream_unavailable'
  | 'rate_limited'
  | 'feature_disabled'
  | 'invalid_input'
  | 'auth_failed'
  | 'already_linked';

export class PlatformError extends Error {
  public readonly code: PlatformErrorCode;
  public readonly statusCode: number;
  public readonly platform: PlatformType;

  constructor(platform: PlatformType, code: PlatformErrorCode, message: string) {
    super(message);
    this.name = 'PlatformError';
    this.code = code;
    this.platform = platform;
    this.statusCode = PlatformError.codeToStatus(code);
  }

  private static codeToStatus(code: PlatformErrorCode): number {
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
