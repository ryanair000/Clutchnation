'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { STREAM_PLATFORMS, STREAM_PLATFORM_LABELS, STREAM_PLATFORM_URLS } from '@/lib/constants';
import type { Database } from '@/types/database';

type StreamChannel = Database['public']['Tables']['user_stream_channels']['Row'];

interface StreamLinkFormProps {
  channels: StreamChannel[];
}

export function StreamLinkForm({ channels }: StreamLinkFormProps) {
  const [linked, setLinked] = useState<Map<string, StreamChannel>>(new Map());
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const map = new Map<string, StreamChannel>();
    for (const ch of channels) {
      map.set(ch.platform, ch);
    }
    setLinked(map);
  }, [channels]);

  async function handleLink(platform: string, form: FormData) {
    setError('');
    setSuccess('');
    setLoading(platform);

    const channelUrl = (form.get('channelUrl') as string)?.trim();
    if (!channelUrl) {
      setError('Please enter a channel URL');
      setLoading(null);
      return;
    }

    // Extract channel name from URL
    const channelName = extractChannelName(platform, channelUrl);
    if (!channelName) {
      setError(`Could not extract channel name from URL. Use format: ${STREAM_PLATFORM_URLS[platform as keyof typeof STREAM_PLATFORM_URLS]}username`);
      setLoading(null);
      return;
    }

    // For YouTube, try to extract channel ID
    const channelId = platform === 'youtube' ? extractYouTubeChannelId(channelUrl) : undefined;

    const res = await fetch('/api/streams/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, channelName, channelUrl, channelId }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Failed to link channel');
      setLoading(null);
      return;
    }

    setSuccess(`${STREAM_PLATFORM_LABELS[platform as keyof typeof STREAM_PLATFORM_LABELS]} channel linked!`);
    setLoading(null);
    router.refresh();
  }

  async function handleUnlink(platform: string) {
    setError('');
    setSuccess('');
    setLoading(platform);

    const res = await fetch('/api/streams/unlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Failed to unlink channel');
      setLoading(null);
      return;
    }

    setSuccess('Channel unlinked');
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="space-y-4" id="streaming">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-accent-50 px-4 py-3 text-sm text-accent-700">{success}</div>
      )}

      {STREAM_PLATFORMS.map((platform) => {
        const existing = linked.get(platform);
        const label = STREAM_PLATFORM_LABELS[platform];
        const isLoading = loading === platform;

        return (
          <div key={platform} className="rounded-lg border border-surface-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">{label}</span>
              {existing && (
                <span className="text-xs text-ink-muted">{existing.channel_name}</span>
              )}
            </div>

            {existing ? (
              <div className="mt-2 flex items-center gap-2">
                <a
                  href={existing.channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand hover:underline truncate"
                >
                  {existing.channel_url}
                </a>
                <button
                  type="button"
                  onClick={() => handleUnlink(platform)}
                  disabled={isLoading}
                  className="shrink-0 rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Unlinking...' : 'Unlink'}
                </button>
              </div>
            ) : (
              <form
                className="mt-2 flex gap-2"
                action={(formData) => handleLink(platform, formData)}
              >
                <input
                  name="channelUrl"
                  type="url"
                  placeholder={`${STREAM_PLATFORM_URLS[platform]}your-channel`}
                  className="flex-1 rounded-lg border border-surface-300 px-3 py-1.5 text-sm shadow-sm focus:border-brand focus:ring-brand"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Linking...' : 'Link'}
                </button>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}

function extractChannelName(platform: string, url: string): string | null {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    switch (platform) {
      case 'twitch':
        return segments[0] ?? null;
      case 'youtube':
        if (segments[0] === 'channel') return segments[1] ?? null;
        if (segments[0]?.startsWith('@')) return segments[0].slice(1);
        return segments[0] ?? null;
      case 'kick':
        return segments[0] ?? null;
      case 'tiktok':
        if (segments[0]?.startsWith('@')) return segments[0].slice(1);
        return segments[0] ?? null;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function extractYouTubeChannelId(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments[0] === 'channel' && segments[1]?.startsWith('UC')) {
      return segments[1];
    }
    return undefined;
  } catch {
    return undefined;
  }
}
