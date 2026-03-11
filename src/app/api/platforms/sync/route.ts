import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getPlatformService } from '@/lib/platforms/registry';
import { PlatformError } from '@/lib/platforms/errors';
import { PLATFORM_HAS_LOOKUP } from '@/lib/constants';
import { checkAdminApi } from '@/lib/admin';
import type { PlatformType } from '@/types';

const SYNC_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: Request) {
  // Auth: admin or CRON_SECRET
  const cronSecret = request.headers.get('x-cron-secret');
  const isValidCron = cronSecret && cronSecret === process.env.CRON_SECRET;

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

  // Find linked accounts with stale data across all platforms
  const staleThreshold = new Date(Date.now() - SYNC_TTL_MS).toISOString();
  const { data: staleAccounts } = await serviceClient
    .from('platform_accounts')
    .select('id, user_id, platform, platform_account_id, platform_username')
    .neq('sync_status', 'never')
    .or(
      `last_synced_at.is.null,last_synced_at.lt.${staleThreshold}`,
    )
    .limit(100);

  if (!staleAccounts || staleAccounts.length === 0) {
    return NextResponse.json({
      success: true,
      processed: 0,
      updated: 0,
      failed: 0,
      skipped: 0,
    });
  }

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (const account of staleAccounts) {
    const platform = account.platform as PlatformType;

    // Skip platforms without server-side sync
    if (!PLATFORM_HAS_LOOKUP[platform]) {
      skipped++;
      continue;
    }

    try {
      const service = getPlatformService(platform);
      const refreshed = await service.sync(account.platform_account_id);

      // Detect username change
      if (
        account.platform_username &&
        refreshed.username !== account.platform_username
      ) {
        await serviceClient.from('platform_link_events').insert({
          user_id: account.user_id,
          platform,
          platform_account_id: account.platform_account_id,
          event_type: 'username_changed',
          metadata: {
            oldUsername: account.platform_username,
            newUsername: refreshed.username,
          },
        });
      }

      await serviceClient
        .from('platform_accounts')
        .update({
          platform_username: refreshed.username,
          sync_status: 'ok',
          profile_url: refreshed.shareUrl ?? null,
          last_synced_at: new Date().toISOString(),
          last_lookup_error: null,
        })
        .eq('id', account.id);

      // Also update legacy PSN columns
      if (platform === 'psn') {
        await serviceClient
          .from('profiles')
          .update({
            psn_online_id: refreshed.username,
            psn_sync_status: 'ok',
            psn_profile_url: refreshed.shareUrl ?? null,
            psn_public_last_synced_at: new Date().toISOString(),
            psn_last_lookup_error: null,
          })
          .eq('id', account.user_id);
      }

      await serviceClient.from('platform_link_events').insert({
        user_id: account.user_id,
        platform,
        platform_account_id: account.platform_account_id,
        event_type: 'sync_success',
      });

      updated++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      await serviceClient
        .from('platform_accounts')
        .update({
          sync_status: 'error',
          last_lookup_error: message.slice(0, 200),
        })
        .eq('id', account.id);

      if (platform === 'psn') {
        await serviceClient
          .from('profiles')
          .update({
            psn_sync_status: 'error',
            psn_last_lookup_error: message.slice(0, 200),
          })
          .eq('id', account.user_id);
      }

      await serviceClient.from('platform_link_events').insert({
        user_id: account.user_id,
        platform,
        platform_account_id: account.platform_account_id,
        event_type: 'sync_failed',
        metadata: { error: message.slice(0, 200) },
      });

      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    processed: staleAccounts.length,
    updated,
    failed,
    skipped,
  });
}
