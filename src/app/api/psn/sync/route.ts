import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { syncPsnProfile } from '@/lib/psn/service';
import { PSN_PROFILE_TTL_MS } from '@/lib/psn/constants';
import { checkAdminApi } from '@/lib/admin';

export async function POST(request: Request) {
  // Auth: admin or CRON_SECRET
  const cronSecret = request.headers.get('x-cron-secret');
  const isValidCron =
    cronSecret && cronSecret === process.env.CRON_SECRET;

  if (!isValidCron) {
    const admin = await checkAdminApi();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }
  }

  const serviceClient = createServiceClient();

  // Find linked users with stale data
  const staleThreshold = new Date(
    Date.now() - PSN_PROFILE_TTL_MS,
  ).toISOString();
  const { data: staleUsers } = await serviceClient
    .from('profiles')
    .select('id, psn_account_id, psn_online_id')
    .not('psn_account_id', 'is', null)
    .neq('psn_sync_status', 'never')
    .or(
      `psn_public_last_synced_at.is.null,psn_public_last_synced_at.lt.${staleThreshold}`,
    )
    .limit(50);

  if (!staleUsers || staleUsers.length === 0) {
    return NextResponse.json({
      success: true,
      processed: 0,
      updated: 0,
      failed: 0,
    });
  }

  let updated = 0;
  let failed = 0;

  for (const user of staleUsers) {
    if (!user.psn_account_id) continue;

    try {
      const refreshed = await syncPsnProfile(user.psn_account_id);

      // Detect online ID change
      if (
        user.psn_online_id &&
        refreshed.onlineId !== user.psn_online_id
      ) {
        await serviceClient.from('psn_link_events').insert({
          user_id: user.id,
          psn_account_id: user.psn_account_id,
          event_type: 'online_id_changed',
          metadata: {
            oldOnlineId: user.psn_online_id,
            newOnlineId: refreshed.onlineId,
          },
        });
      }

      await serviceClient
        .from('profiles')
        .update({
          psn_online_id: refreshed.onlineId,
          psn_sync_status: 'ok',
          psn_profile_url: refreshed.shareUrl,
          psn_public_last_synced_at: new Date().toISOString(),
          psn_last_lookup_error: null,
        })
        .eq('id', user.id);

      await serviceClient.from('psn_link_events').insert({
        user_id: user.id,
        psn_account_id: user.psn_account_id,
        event_type: 'sync_success',
      });

      updated++;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      await serviceClient
        .from('profiles')
        .update({
          psn_sync_status: 'error',
          psn_last_lookup_error: message.slice(0, 200),
        })
        .eq('id', user.id);

      await serviceClient.from('psn_link_events').insert({
        user_id: user.id,
        psn_account_id: user.psn_account_id,
        event_type: 'sync_failed',
        metadata: { error: message.slice(0, 200) },
      });

      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    processed: staleUsers.length,
    updated,
    failed,
  });
}
