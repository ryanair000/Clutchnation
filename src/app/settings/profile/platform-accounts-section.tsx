'use client';

import { useRouter } from 'next/navigation';
import { PlatformLinkCard } from '@/components/shared/platform-link-card';
import { PLATFORMS } from '@/lib/constants';
import type { PlatformAccount, PlatformType } from '@/types';

interface PlatformAccountsSectionProps {
  accounts: PlatformAccount[];
}

export function PlatformAccountsSection({ accounts }: PlatformAccountsSectionProps) {
  const router = useRouter();

  function getAccount(platform: PlatformType) {
    return accounts.find((a) => a.platform === platform) ?? null;
  }

  return (
    <div className="space-y-3">
      {PLATFORMS.map((platform) => {
        const account = getAccount(platform);
        return (
          <PlatformLinkCard
            key={platform}
            platform={platform}
            username={account?.platform_username ?? null}
            accountId={account?.platform_account_id ?? null}
            verifiedStatus={account?.verified_status ?? 'none'}
            syncStatus={account?.sync_status ?? 'never'}
            lastSyncedAt={account?.last_synced_at ?? null}
            onLinked={() => router.refresh()}
            onUnlinked={() => router.refresh()}
          />
        );
      })}
    </div>
  );
}
