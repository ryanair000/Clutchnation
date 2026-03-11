import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock psn-api before importing auth module
const mockExchangeNpssoForCode = vi.fn();
const mockExchangeCodeForAccessToken = vi.fn();
const mockExchangeRefreshTokenForAuthTokens = vi.fn();

vi.mock('psn-api', () => ({
  exchangeNpssoForCode: (...args: unknown[]) => mockExchangeNpssoForCode(...args),
  exchangeCodeForAccessToken: (...args: unknown[]) => mockExchangeCodeForAccessToken(...args),
  exchangeRefreshTokenForAuthTokens: (...args: unknown[]) =>
    mockExchangeRefreshTokenForAuthTokens(...args),
}));

// Mock supabase service client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: () => ({
      select: (...args: unknown[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs);
            return { single: () => mockSingle() };
          },
        };
      },
      upsert: (...args: unknown[]) => mockUpsert(...args),
    }),
  }),
}));

// Import after mocks
import { getPsnAuthContext, clearPsnAuthCache } from '@/lib/psn/auth';

describe('PSN Auth Module', () => {
  const mockTokenResponse = {
    accessToken: 'mock-access-token',
    expiresIn: 3600,
    idToken: 'mock-id-token',
    refreshToken: 'mock-refresh-token',
    refreshTokenExpiresIn: 5184000,
    scope: 'psn:mobile.v2.core',
    tokenType: 'bearer',
  };

  beforeEach(() => {
    vi.resetAllMocks();
    clearPsnAuthCache();
    // Default: no stored tokens
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    mockUpsert.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    delete process.env.PSN_SERVICE_NPSSO;
  });

  it('authenticates via NPSSO when no stored refresh token', async () => {
    process.env.PSN_SERVICE_NPSSO = 'test-npsso-token';
    mockExchangeNpssoForCode.mockResolvedValue('access-code-123');
    mockExchangeCodeForAccessToken.mockResolvedValue(mockTokenResponse);

    const auth = await getPsnAuthContext();

    expect(auth.accessToken).toBe('mock-access-token');
    expect(mockExchangeNpssoForCode).toHaveBeenCalledWith('test-npsso-token');
    expect(mockExchangeCodeForAccessToken).toHaveBeenCalledWith('access-code-123');
    // Should persist tokens to DB
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        refresh_token: 'mock-refresh-token',
        access_token: 'mock-access-token',
      }),
    );
  });

  it('returns cached token on second call', async () => {
    process.env.PSN_SERVICE_NPSSO = 'test-npsso-token';
    mockExchangeNpssoForCode.mockResolvedValue('access-code-123');
    mockExchangeCodeForAccessToken.mockResolvedValue(mockTokenResponse);

    await getPsnAuthContext();
    const auth2 = await getPsnAuthContext();

    expect(auth2.accessToken).toBe('mock-access-token');
    // NPSSO should only be exchanged once
    expect(mockExchangeNpssoForCode).toHaveBeenCalledTimes(1);
  });

  it('uses stored refresh token from DB', async () => {
    mockSingle.mockResolvedValue({
      data: { refresh_token: 'stored-refresh', access_token: null, access_token_expires_at: null },
      error: null,
    });
    mockExchangeRefreshTokenForAuthTokens.mockResolvedValue({
      ...mockTokenResponse,
      accessToken: 'refreshed-access-token',
    });

    const auth = await getPsnAuthContext();

    expect(auth.accessToken).toBe('refreshed-access-token');
    expect(mockExchangeRefreshTokenForAuthTokens).toHaveBeenCalledWith('stored-refresh');
    // Should NOT use NPSSO
    expect(mockExchangeNpssoForCode).not.toHaveBeenCalled();
  });

  it('falls back to NPSSO when refresh token fails', async () => {
    process.env.PSN_SERVICE_NPSSO = 'fallback-npsso';
    mockSingle.mockResolvedValue({
      data: { refresh_token: 'expired-refresh', access_token: null, access_token_expires_at: null },
      error: null,
    });
    mockExchangeRefreshTokenForAuthTokens.mockRejectedValue(
      new Error('Refresh token expired'),
    );
    mockExchangeNpssoForCode.mockResolvedValue('new-access-code');
    mockExchangeCodeForAccessToken.mockResolvedValue(mockTokenResponse);

    const auth = await getPsnAuthContext();

    expect(auth.accessToken).toBe('mock-access-token');
    expect(mockExchangeRefreshTokenForAuthTokens).toHaveBeenCalledOnce();
    expect(mockExchangeNpssoForCode).toHaveBeenCalledWith('fallback-npsso');
  });

  it('throws when no refresh token and no NPSSO', async () => {
    // No stored tokens, no env var
    delete process.env.PSN_SERVICE_NPSSO;

    await expect(getPsnAuthContext()).rejects.toThrow(
      /No valid PSN refresh token/,
    );
  });

  it('clearPsnAuthCache forces re-auth', async () => {
    process.env.PSN_SERVICE_NPSSO = 'test-npsso';
    mockExchangeNpssoForCode.mockResolvedValue('code');
    mockExchangeCodeForAccessToken.mockResolvedValue(mockTokenResponse);

    await getPsnAuthContext();
    clearPsnAuthCache();

    // Should need to re-auth — will try DB first, then NPSSO
    await getPsnAuthContext();
    expect(mockExchangeNpssoForCode).toHaveBeenCalledTimes(2);
  });

  it('persists tokens even if DB write fails silently', async () => {
    process.env.PSN_SERVICE_NPSSO = 'test-npsso';
    mockExchangeNpssoForCode.mockResolvedValue('code');
    mockExchangeCodeForAccessToken.mockResolvedValue(mockTokenResponse);
    mockUpsert.mockRejectedValue(new Error('DB write failed'));

    // Should not throw — DB persist failure is non-fatal
    const auth = await getPsnAuthContext();
    expect(auth.accessToken).toBe('mock-access-token');
  });
});
