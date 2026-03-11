import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StreamCard } from '@/components/streams/stream-card';
import { PlatformFilter } from '@/components/streams/platform-filter';
import { STREAM_PLATFORMS } from '@/lib/constants';

export const metadata: Metadata = { title: 'Live Streams' };

interface Props {
  searchParams: Promise<{ platform?: string }>;
}

export default async function StreamsPage({ searchParams }: Props) {
  const { platform: platformParam } = await searchParams;
  const platform = platformParam && STREAM_PLATFORMS.includes(platformParam as any) ? platformParam : 'all';

  const supabase = await createClient();

  let query = supabase
    .from('user_stream_channels')
    .select(`
      *,
      profile:profiles!user_stream_channels_user_id_fkey(username, avatar_url, psn_online_id)
    `)
    .order('is_live', { ascending: false })
    .order('viewer_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  if (platform !== 'all') {
    query = query.eq('platform', platform);
  }

  const { data: streams } = await query;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if current user has PSN verified (for showing "Link Channel" button)
  let canLink = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('psn_verified_status')
      .eq('id', user.id)
      .single();
    canLink = profile?.psn_verified_status === 'confirmed_by_user';
  }

  const liveStreams = streams?.filter((s) => s.is_live) ?? [];
  const offlineStreams = streams?.filter((s) => !s.is_live) ?? [];

  return (
    <div className="container-app py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Live Streams</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Watch ClutchNation community members streaming live
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PlatformFilter currentPlatform={platform} />
          {canLink && (
            <Link
              href="/settings/profile#streaming"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Link Channel
            </Link>
          )}
        </div>
      </div>

      {/* Live streams */}
      {liveStreams.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <h2 className="font-heading text-lg font-semibold">
              Live Now ({liveStreams.length})
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveStreams.map((stream) => (
              <StreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        </section>
      )}

      {/* Offline streams */}
      {offlineStreams.length > 0 && (
        <section className={liveStreams.length > 0 ? 'mt-8' : 'mt-6'}>
          <h2 className="font-heading text-lg font-semibold mb-4">
            Offline ({offlineStreams.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offlineStreams.map((stream) => (
              <StreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        </section>
      )}

      {(!streams || streams.length === 0) && (
        <div className="mt-8 rounded-lg border border-surface-200 bg-white p-12 text-center">
          <p className="text-ink-muted text-sm">No streamers found.</p>
          <p className="mt-2 text-xs text-ink-light">
            Verify your PSN account and link your streaming channel to appear here.
          </p>
        </div>
      )}
    </div>
  );
}
