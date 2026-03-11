import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { PLATFORMS } from '@/lib/constants';
import type { PlatformType } from '@/types';

export async function POST(
  _request: Request,
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

  const serviceClient = createServiceClient();

  // Get current platform account for audit log
  const { data: account } = await serviceClient
    .from('platform_accounts')
    .select('id, platform_account_id')
    .eq('user_id', user.id)
    .eq('platform', platform)
    .maybeSingle();

  if (!account) {
    return NextResponse.json(
      { success: false, error: `No ${platform} account linked` },
      { status: 404 },
    );
  }

  const { error: deleteError } = await serviceClient
    .from('platform_accounts')
    .delete()
    .eq('id', account.id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: `Failed to unlink ${platform} account` },
      { status: 500 },
    );
  }

  // Also clear legacy PSN columns for backward compat
  if (platform === 'psn') {
    await serviceClient
      .from('profiles')
      .update({
        psn_account_id: null,
        psn_verified_status: 'none',
        psn_sync_status: 'never',
        psn_profile_url: null,
        psn_public_last_synced_at: null,
        psn_last_lookup_error: null,
      })
      .eq('id', user.id);
  }

  // Log event
  await serviceClient.from('platform_link_events').insert({
    user_id: user.id,
    platform,
    platform_account_id: account.platform_account_id,
    event_type: 'user_unlinked',
  });

  return NextResponse.json({ success: true });
}
