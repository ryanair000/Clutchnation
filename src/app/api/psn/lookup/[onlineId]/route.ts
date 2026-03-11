import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { lookupPsnProfile } from '@/lib/psn/service';
import { PsnError } from '@/lib/psn/errors';
import { PSN_ID_REGEX } from '@/lib/constants';
import { PSN_FEATURE_FLAGS } from '@/lib/psn/constants';
import type { PsnLookupResponse } from '@/lib/psn/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ onlineId: string }> },
) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        found: false,
        data: null,
        error: 'Unauthorized',
        cached: false,
      } satisfies PsnLookupResponse,
      { status: 401 },
    );
  }

  // Feature flag check — default to enabled if flag row is missing
  const serviceClient = createServiceClient();
  const { data: flag } = await serviceClient
    .from('feature_flags')
    .select('enabled')
    .eq('key', PSN_FEATURE_FLAGS.LOOKUP)
    .single();

  if (flag && !flag.enabled) {
    return NextResponse.json(
      {
        found: false,
        data: null,
        reason: 'feature_disabled' as const,
        error: 'PSN lookup is currently disabled',
        cached: false,
      } satisfies PsnLookupResponse,
      { status: 503 },
    );
  }

  const { onlineId } = await params;

  // Input validation
  if (!PSN_ID_REGEX.test(onlineId)) {
    return NextResponse.json(
      {
        found: false,
        data: null,
        reason: 'invalid_input' as const,
        error: 'Invalid PSN Online ID format',
        cached: false,
      } satisfies PsnLookupResponse,
      { status: 400 },
    );
  }

  try {
    const profile = await lookupPsnProfile(onlineId);

    // Log successful lookup
    await serviceClient.from('psn_link_events').insert({
      user_id: user.id,
      psn_account_id: profile.accountId,
      event_type: 'lookup_success',
      metadata: {
        onlineId,
        matchedOnlineId: profile.onlineId,
      },
    });

    return NextResponse.json({
      found: true,
      data: profile,
      cached: false,
      error: null,
    } satisfies PsnLookupResponse);
  } catch (err) {
    const psnErr =
      err instanceof PsnError
        ? err
        : new PsnError('upstream_unavailable', 'Unexpected error');

    // Log failed lookup
    await serviceClient.from('psn_link_events').insert({
      user_id: user.id,
      psn_account_id: null,
      event_type: 'lookup_failed',
      metadata: {
        onlineId,
        errorCode: psnErr.code,
        errorMessage: psnErr.message,
      },
    });

    if (psnErr.code === 'not_found') {
      return NextResponse.json(
        {
          found: false,
          data: null,
          reason: 'not_found' as const,
          error: null,
          cached: false,
        } satisfies PsnLookupResponse,
        { status: 404 },
      );
    }

    if (psnErr.code === 'private_or_unavailable') {
      return NextResponse.json({
        found: true,
        data: null,
        reason: 'private_or_unavailable' as const,
        error: null,
        cached: false,
      } satisfies PsnLookupResponse);
    }

    return NextResponse.json(
      {
        found: false,
        data: null,
        reason: psnErr.code as PsnLookupResponse['reason'],
        error: psnErr.message,
        cached: false,
      } satisfies PsnLookupResponse,
      { status: psnErr.statusCode },
    );
  }
}
