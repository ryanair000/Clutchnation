import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { EditProfileForm } from './edit-profile-form';
import { StreamLinkForm } from './stream-link-form';
import { PlatformAccountsSection } from './platform-accounts-section';
import type { PlatformAccount } from '@/types';

export const metadata: Metadata = { title: 'Edit Profile' };

export default async function SettingsProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.username) redirect('/onboarding');

  // Fetch platform accounts
  const serviceClient = createServiceClient();
  const { data: platformAccountsRaw } = await serviceClient
    .from('platform_accounts')
    .select('*')
    .eq('user_id', user.id);
  const platformAccounts = (platformAccountsRaw ?? []) as PlatformAccount[];

  const hasVerifiedAccount = platformAccounts.some(
    (a) => a.verified_status === 'confirmed_by_user',
  );

  // Fetch linked stream channels if any platform is verified
  let streamChannels: any[] = [];
  if (hasVerifiedAccount) {
    const { data } = await supabase
      .from('user_stream_channels')
      .select('*')
      .eq('user_id', user.id);
    streamChannels = data ?? [];
  }

  return (
    <div className="container-app py-8">
      <h1 className="font-heading text-2xl font-bold">Edit Profile</h1>
      <p className="mt-1 text-sm text-ink-muted">Update your display info and gaming accounts.</p>
      <div className="mt-6 max-w-lg">
        <EditProfileForm profile={profile} />
      </div>

      {/* Platform accounts */}
      <div className="mt-10 max-w-lg">
        <h2 className="font-heading text-xl font-bold">Gaming Platforms</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Link your gaming accounts to verify your identity and help opponents find you.
        </p>
        <div className="mt-4">
          <PlatformAccountsSection accounts={platformAccounts} />
        </div>
      </div>

      {/* Streaming section */}
      <div className="mt-10 max-w-lg">
        <h2 className="font-heading text-xl font-bold">Streaming</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Link your streaming channels to appear on the Streams page.
        </p>
        {hasVerifiedAccount ? (
          <div className="mt-4">
            <StreamLinkForm channels={streamChannels} />
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-surface-200 bg-surface-50 p-6 text-center">
            <p className="text-sm text-ink-muted">
              You need to verify at least one gaming account before you can link streaming channels.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
