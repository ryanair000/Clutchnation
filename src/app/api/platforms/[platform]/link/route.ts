import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getPlatformService } from '@/lib/platforms/registry';
import { PlatformError } from '@/lib/platforms/errors';
import { PLATFORMS, PLATFORM_HAS_LOOKUP, PLATFORM_FEATURE_FLAGS } from '@/lib/constants';
import type { PlatformType } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  const { platform: platformParam } = await params;
  const platform = platformParam as PlatformType;

  if (!PLATFORMS.includes(platform)) {
    return NextResponse.json(
      { success: false, error: 'Invalid platform' },
      { status: 400 },
    );
  }

  let body: { accountId?: string; username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 },
    );
  }

  const { accountId, username } = body;

  if (
    !accountId ||
    !username ||
    typeof accountId !== 'string' ||
    typeof username !== 'string'
  ) {
    return NextResponse.json(
      { success: false, error: 'accountId and username are required' },
      { status: 400 },
    );
  }

  const serviceClient = createServiceClient();

  // Feature flag check
  const flagKey = PLATFORM_FEATURE_FLAGS[platform];
  if (flagKey) {
    const { data: flag } = await serviceClient
      .from('feature_flags')
      .select('enabled')
      .eq('key', flagKey)
      .single();

    if (flag && !flag.enabled) {
      return NextResponse.json(
        { success: false, error: `${platform} linking is currently disabled` },
        { status: 503 },
      );
    }
  }

  // Verify the account via lookup if the platform supports it
  if (PLATFORM_HAS_LOOKUP[platform]) {
    try {
      const service = getPlatformService(platform);
      const profile = await service.lookup(username);

      if (profile.accountId !== accountId) {
        return NextResponse.json(
          { success: false, error: 'Account ID mismatch' },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: `Could not verify ${platform} account` },
        { status: 400 },
      );
    }
  }

  // Check uniqueness — no other user should own this platform account
  const { data: existing } = await serviceClient
    .from('platform_accounts')
    .select('user_id')
    .eq('platform', platform)
    .eq('platform_account_id', accountId)
    .neq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        success: false,
        error: `This ${platform} account is already linked to another ClutchNation profile`,
      },
      { status: 409 },
    );
  }

  // Check if user already has an account for this platform
  const { data: ownExisting } = await serviceClient
    .from('platform_accounts')
    .select('id')
    .eq('user_id', user.id)
    .eq('platform', platform)
    .maybeSingle();

  const profileUrl = getPlatformService(platform).getProfileUrl(username);

  if (ownExisting) {
    // Update the existing link
    const { error: updateError } = await serviceClient
      .from('platform_accounts')
      .update({
        platform_account_id: accountId,
        platform_username: username,
        verified_status: 'confirmed_by_user',
        sync_status: 'ok',
        profile_url: profileUrl,
        last_synced_at: new Date().toISOString(),
        last_lookup_error: null,
      })
      .eq('id', ownExisting.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Failed to update ${platform} link` },
        { status: 500 },
      );
    }
  } else {
    // Insert new link
    const { error: insertError } = await serviceClient
      .from('platform_accounts')
      .insert({
        user_id: user.id,
        platform,
        platform_account_id: accountId,
        platform_username: username,
        verified_status: 'confirmed_by_user',
        sync_status: 'ok',
        profile_url: profileUrl,
        last_synced_at: new Date().toISOString(),
      });

    if (insertError) {
      return NextResponse.json(
        { success: false, error: `Failed to link ${platform} account` },
        { status: 500 },
      );
    }
  }

  // Also update legacy PSN columns for backward compat
  if (platform === 'psn') {
    await serviceClient
      .from('profiles')
      .update({
        psn_account_id: accountId,
        psn_online_id: username,
        psn_verified_status: 'confirmed_by_user',
        psn_sync_status: 'ok',
        psn_profile_url: profileUrl,
        psn_public_last_synced_at: new Date().toISOString(),
        psn_last_lookup_error: null,
      })
      .eq('id', user.id);
  }

  // Log event
  await serviceClient.from('platform_link_events').insert({
    user_id: user.id,
    platform,
    platform_account_id: accountId,
    event_type: 'user_confirmed',
    metadata: { username },
  });

  return NextResponse.json({ success: true });
}
