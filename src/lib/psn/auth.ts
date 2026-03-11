import {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  exchangeRefreshTokenForAuthTokens,
  type AuthorizationPayload,
  type AuthTokensResponse,
} from 'psn-api';
import { createServiceClient } from '@/lib/supabase/service';

// ── In-memory token cache ──────────────────────────────────────────
let cachedAuth: AuthorizationPayload | null = null;
let cachedAuthExpiresAt = 0;

/**
 * Obtain a valid PSN authorization context.
 *
 * Strategy (in order):
 *  1. Return in-memory cached token if still valid
 *  2. Use stored refresh token from Supabase to get a new access token
 *  3. Fall back to NPSSO env var for initial bootstrap
 *
 * After any successful auth the refresh token is persisted to Supabase
 * so the server can keep renewing without a fresh NPSSO cookie.
 *
 * Server-only — never import from client code.
 */
export async function getPsnAuthContext(): Promise<AuthorizationPayload> {
  const now = Date.now();

  // 1. In-memory cache hit
  if (cachedAuth && cachedAuthExpiresAt > now) {
    return cachedAuth;
  }

  // 2. Try refresh token from DB
  const tokens = await loadStoredTokens();
  if (tokens?.refresh_token) {
    try {
      const fresh = await exchangeRefreshTokenForAuthTokens(tokens.refresh_token);
      await persistTokens(fresh);
      setCacheFromTokens(fresh);
      return { accessToken: fresh.accessToken };
    } catch {
      // Refresh token expired or revoked — fall through to NPSSO
    }
  }

  // 3. Fall back to NPSSO (one-time bootstrap)
  const npsso = process.env.PSN_SERVICE_NPSSO;
  if (!npsso) {
    throw new Error(
      'No valid PSN refresh token stored and PSN_SERVICE_NPSSO env var is not set. ' +
      'Go to https://ca.account.sony.com/api/v1/ssocookie to get an NPSSO token, ' +
      'then set PSN_SERVICE_NPSSO in .env.local and restart the server.',
    );
  }

  const accessCode = await exchangeNpssoForCode(npsso);
  const auth = await exchangeCodeForAccessToken(accessCode);
  await persistTokens(auth);
  setCacheFromTokens(auth);
  return { accessToken: auth.accessToken };
}

/** Clear in-memory cache (triggers re-auth on next call) */
export function clearPsnAuthCache(): void {
  cachedAuth = null;
  cachedAuthExpiresAt = 0;
}

// ── Helpers ────────────────────────────────────────────────────────

function setCacheFromTokens(tokens: AuthTokensResponse): void {
  cachedAuth = { accessToken: tokens.accessToken };
  // expiresIn is in seconds; refresh 5 min early
  cachedAuthExpiresAt = Date.now() + (tokens.expiresIn - 300) * 1000;
}

async function loadStoredTokens() {
  try {
    const db = createServiceClient();
    const { data } = await db
      .from('psn_service_tokens')
      .select('refresh_token, access_token, access_token_expires_at')
      .eq('id', 1)
      .single();
    return data;
  } catch {
    return null;
  }
}

async function persistTokens(tokens: AuthTokensResponse): Promise<void> {
  try {
    const db = createServiceClient();
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000).toISOString();
    const refreshExpiresAt = new Date(
      Date.now() + tokens.refreshTokenExpiresIn * 1000,
    ).toISOString();

    await db.from('psn_service_tokens').upsert({
      id: 1,
      refresh_token: tokens.refreshToken,
      access_token: tokens.accessToken,
      access_token_expires_at: expiresAt,
      refresh_token_expires_at: refreshExpiresAt,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Non-fatal — worst case we re-auth next time
  }
}
