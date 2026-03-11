import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StreamEmbed } from '@/components/streams/stream-embed';
import { STREAM_PLATFORM_LABELS } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';
import type { StreamPlatform } from '@/types';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username}'s Stream` };
}

export default async function StreamWatchPage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  // Find the user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, psn_online_id')
    .eq('username', username)
    .single();

  if (!profile) notFound();

  // Find their stream channels, prefer live ones
  const { data: channels } = await supabase
    .from('user_stream_channels')
    .select('*')
    .eq('user_id', profile.id)
    .order('is_live', { ascending: false })
    .order('viewer_count', { ascending: false });

  if (!channels || channels.length === 0) notFound();

  // Show the first live channel, or the first channel if none are live
  const activeChannel = channels.find((c) => c.is_live) ?? channels[0];
  const platform = activeChannel.platform as StreamPlatform;
  const platformLabel = STREAM_PLATFORM_LABELS[platform] ?? platform;

  return (
    <div className="container-app py-8">
      {/* Back link */}
      <Link
        href="/streams"
        className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors mb-4"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to Streams
      </Link>

      {/* Video embed */}
      <StreamEmbed
        platform={platform}
        channelName={activeChannel.channel_name}
        channelId={activeChannel.channel_id}
      />

      {/* Stream info */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username ?? ''}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">
              {(profile.username ?? '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${profile.username}`}
                className="font-heading font-semibold hover:text-brand transition-colors"
              >
                {profile.username}
              </Link>
              {activeChannel.is_live && (
                <span className="flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  LIVE
                </span>
              )}
            </div>
            {activeChannel.stream_title && (
              <p className="mt-0.5 text-sm text-ink-muted">{activeChannel.stream_title}</p>
            )}
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-light">
              <span className="rounded-full bg-surface-100 px-2 py-0.5 font-medium">{platformLabel}</span>
              {activeChannel.game_name && (
                <span className="rounded-full bg-surface-100 px-2 py-0.5">{activeChannel.game_name}</span>
              )}
              {activeChannel.is_live && activeChannel.viewer_count > 0 && (
                <span>{activeChannel.viewer_count.toLocaleString()} viewers</span>
              )}
              {activeChannel.is_live && activeChannel.started_at && (
                <span>Started {formatDateTime(activeChannel.started_at)}</span>
              )}
            </div>
          </div>
        </div>

        <a
          href={activeChannel.channel_url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-surface-300 px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface-50 transition-colors"
        >
          Open on {platformLabel}
        </a>
      </div>

      {/* Other channels from this user */}
      {channels.length > 1 && (
        <div className="mt-6 border-t border-surface-200 pt-4">
          <h3 className="text-sm font-semibold text-ink-muted mb-2">Other Channels</h3>
          <div className="flex gap-2">
            {channels
              .filter((c) => c.id !== activeChannel.id)
              .map((c) => (
                <a
                  key={c.id}
                  href={c.channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink hover:border-brand/30 transition-colors"
                >
                  {STREAM_PLATFORM_LABELS[c.platform as StreamPlatform] ?? c.platform}
                  {c.is_live && (
                    <span className="ml-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                  )}
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
