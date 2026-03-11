import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getPlatformService } from '@/lib/platforms/registry';
import { PlatformError } from '@/lib/platforms/errors';
import { PLATFORMS, PLATFORM_ID_REGEX, PLATFORM_FEATURE_FLAGS, PLATFORM_HAS_LOOKUP } from '@/lib/constants';
import type { PlatformType } from '@/types';
import type { PlatformLookupResponse } from '@/lib/platforms/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ platform: string; username: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { found: false, data: null, error: 'Unauthorized', cached: false } satisfies PlatformLookupResponse,
      { status: 401 },
    );
  }

  const { platform: platformParam, username } = await params;
  const platform = platformParam as PlatformType;

  // Validate platform
  if (!PLATFORMS.includes(platform)) {
    return NextResponse.json(
      { found: false, data: null, reason: 'invalid_input' as const, error: 'Invalid platform', cached: false } satisfies PlatformLookupResponse,
      { status: 400 },
    );
  }

  // Feature flag check
  const serviceClient = createServiceClient();
  const flagKey = PLATFORM_FEATURE_FLAGS[platform];
  if (flagKey) {
    const { data: flag } = await serviceClient
      .from('feature_flags')
      .select('enabled')
      .eq('key', flagKey)
      .single();

    if (flag && !flag.enabled) {
      return NextResponse.json(
        { found: false, data: null, reason: 'feature_disabled' as const, error: `${platform} lookup is currently disabled`, cached: false } satisfies PlatformLookupResponse,
        { status: 503 },
      );
    }
  }

  // Input validation
  const regex = PLATFORM_ID_REGEX[platform];
  if (regex && !regex.test(username)) {
    return NextResponse.json(
      { found: false, data: null, reason: 'invalid_input' as const, error: `Invalid ${platform} username format`, cached: false } satisfies PlatformLookupResponse,
      { status: 400 },
    );
  }

  // For platforms without server-side lookup, return a minimal profile
  if (!PLATFORM_HAS_LOOKUP[platform]) {
    const service = getPlatformService(platform);
    const profile = await service.lookup(username);

    return NextResponse.json({
      found: true,
      data: profile,
      cached: false,
      error: null,
    } satisfies PlatformLookupResponse);
  }

  try {
    const service = getPlatformService(platform);
    const profile = await service.lookup(username);

    // Log successful lookup
    await serviceClient.from('platform_link_events').insert({
      user_id: user.id,
      platform,
      platform_account_id: profile.accountId,
      event_type: 'lookup_success',
      metadata: { username, matchedUsername: profile.username },
    });

    return NextResponse.json({
      found: true,
      data: profile,
      cached: false,
      error: null,
    } satisfies PlatformLookupResponse);
  } catch (err) {
    const platErr =
      err instanceof PlatformError
        ? err
        : new PlatformError(platform, 'upstream_unavailable', 'Unexpected error');

    // Log failed lookup
    await serviceClient.from('platform_link_events').insert({
      user_id: user.id,
      platform,
      platform_account_id: null,
      event_type: 'lookup_failed',
      metadata: { username, errorCode: platErr.code, errorMessage: platErr.message },
    });

    if (platErr.code === 'not_found') {
      return NextResponse.json(
        { found: false, data: null, reason: 'not_found' as const, error: null, cached: false } satisfies PlatformLookupResponse,
        { status: 404 },
      );
    }

    if (platErr.code === 'private_or_unavailable') {
      return NextResponse.json({
        found: true,
        data: null,
        reason: 'private_or_unavailable' as const,
        error: null,
        cached: false,
      } satisfies PlatformLookupResponse);
    }

    return NextResponse.json(
      { found: false, data: null, reason: platErr.code as PlatformLookupResponse['reason'], error: platErr.message, cached: false } satisfies PlatformLookupResponse,
      { status: platErr.statusCode },
    );
  }
}
