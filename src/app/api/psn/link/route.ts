import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getCachedProfile } from '@/lib/psn/cache';
import { lookupPsnProfile } from '@/lib/psn/service';
import { PSN_PROFILE_TTL_MS } from '@/lib/psn/constants';

export async function POST(request: Request) {
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

  let body: { accountId?: string; onlineId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 },
    );
  }

  const { accountId, onlineId } = body;

  if (
    !accountId ||
    !onlineId ||
    typeof accountId !== 'string' ||
    typeof onlineId !== 'string'
  ) {
    return NextResponse.json(
      { success: false, error: 'accountId and onlineId are required' },
      { status: 400 },
    );
  }

  const serviceClient = createServiceClient();

  // Verify the PSN account exists in cache or re-lookup
  let cached = await getCachedProfile(accountId, PSN_PROFILE_TTL_MS);
  if (!cached) {
    try {
      cached = await lookupPsnProfile(onlineId);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Could not verify PSN account' },
        { status: 400 },
      );
    }
  }

  if (cached.accountId !== accountId) {
    return NextResponse.json(
      { success: false, error: 'Account ID mismatch' },
      { status: 400 },
    );
  }

  // Check uniqueness — no other user should claim this psn_account_id
  const { data: existing } = await serviceClient
    .from('profiles')
    .select('id')
    .eq('psn_account_id', accountId)
    .neq('id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        success: false,
        error:
          'This PlayStation account is already linked to another ClutchNation profile',
      },
      { status: 409 },
    );
  }

  // Update profile
  const { error: updateError } = await serviceClient
    .from('profiles')
    .update({
      psn_account_id: accountId,
      psn_online_id: cached.onlineId,
      psn_verified_status: 'confirmed_by_user',
      psn_sync_status: 'ok',
      psn_profile_url: cached.shareUrl,
      psn_public_last_synced_at: new Date().toISOString(),
      psn_last_lookup_error: null,
    })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json(
      { success: false, error: 'Failed to link PSN account' },
      { status: 500 },
    );
  }

  // Log event
  await serviceClient.from('psn_link_events').insert({
    user_id: user.id,
    psn_account_id: accountId,
    event_type: 'user_confirmed',
    metadata: { onlineId: cached.onlineId },
  });

  return NextResponse.json({ success: true });
}
