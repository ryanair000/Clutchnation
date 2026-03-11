'use client';

import { STREAM_PLATFORM_LABELS } from '@/lib/constants';
import type { StreamPlatform } from '@/types';

interface StreamEmbedProps {
  platform: StreamPlatform;
  channelName: string;
  channelId?: string | null;
}

export function StreamEmbed({ platform, channelName, channelId }: StreamEmbedProps) {
  const parentDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  const embedUrl = getEmbedUrl(platform, channelName, channelId ?? undefined, parentDomain);

  if (!embedUrl) {
    const platformLabel = STREAM_PLATFORM_LABELS[platform] ?? platform;
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg border border-surface-200 bg-surface-50">
        <div className="text-center">
          <p className="text-ink-muted text-sm font-medium">
            {platformLabel} does not support embedding
          </p>
          <a
            href={`https://tiktok.com/@${encodeURIComponent(channelName)}/live`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Watch on {platformLabel}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-surface-200 bg-black">
      <iframe
        src={embedUrl}
        title={`${channelName} stream`}
        className="absolute inset-0 h-full w-full"
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}

function getEmbedUrl(
  platform: StreamPlatform,
  channelName: string,
  channelId: string | undefined,
  parentDomain: string,
): string | null {
  const name = encodeURIComponent(channelName);
  const parent = encodeURIComponent(parentDomain);

  switch (platform) {
    case 'twitch':
      return `https://player.twitch.tv/?channel=${name}&parent=${parent}`;
    case 'youtube':
      if (channelId) {
        return `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(channelId)}`;
      }
      return null;
    case 'kick':
      return `https://player.kick.com/${name}`;
    case 'tiktok':
      return null;
    default:
      return null;
  }
}
