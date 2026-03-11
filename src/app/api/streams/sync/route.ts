import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { STREAM_STALE_THRESHOLD_MIN } from '@/lib/constants';

/**
 * POST /api/streams/sync
 * Polls streaming platform APIs to update live status for all linked channels.
 * Protected by STREAM_SYNC_SECRET bearer token or admin session.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const syncSecret = process.env.STREAM_SYNC_SECRET;

  if (syncSecret && authHeader !== `Bearer ${syncSecret}`) {
    const { createClient: createUserClient } = await import('@/lib/supabase/server');
    const userSupabase = await createUserClient();
    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await userSupabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createServiceClient();

  // Fetch all linked channels
  const { data: channels, error: fetchErr } = await supabase
    .from('user_stream_channels')
    .select('id, platform, channel_name, channel_id, channel_url, is_live');

  if (fetchErr || !channels) {
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }

  if (channels.length === 0) {
    return NextResponse.json({ success: true, updated: 0, message: 'No channels to sync' });
  }

  const now = new Date().toISOString();
  let updated = 0;
  const errors: string[] = [];

  // Group channels by platform
  const byPlatform = new Map<string, typeof channels>();
  for (const ch of channels) {
    const list = byPlatform.get(ch.platform) ?? [];
    list.push(ch);
    byPlatform.set(ch.platform, list);
  }

  // --- Twitch ---
  const twitchChannels = byPlatform.get('twitch') ?? [];
  if (twitchChannels.length > 0) {
    try {
      const twitchResults = await fetchTwitchLiveStatus(
        twitchChannels.map((c) => c.channel_name),
      );
      for (const ch of twitchChannels) {
        const live = twitchResults.get(ch.channel_name.toLowerCase());
        const { error } = await supabase
          .from('user_stream_channels')
          .update({
            is_live: !!live,
            stream_title: live?.title ?? null,
            viewer_count: live?.viewer_count ?? 0,
            thumbnail_url: live?.thumbnail_url ?? null,
            game_name: live?.game_name ?? null,
            started_at: live?.started_at ?? null,
            last_synced_at: now,
          })
          .eq('id', ch.id);
        if (!error) updated++;
        else errors.push(`twitch/${ch.channel_name}: ${error.message}`);
      }
    } catch (e) {
      errors.push(`twitch: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }

  // --- YouTube ---
  const youtubeChannels = byPlatform.get('youtube') ?? [];
  if (youtubeChannels.length > 0) {
    try {
      const ytResults = await fetchYouTubeLiveStatus(
        youtubeChannels.filter((c) => c.channel_id).map((c) => c.channel_id!),
      );
      for (const ch of youtubeChannels) {
        if (!ch.channel_id) {
          await supabase
            .from('user_stream_channels')
            .update({ last_synced_at: now })
            .eq('id', ch.id);
          updated++;
          continue;
        }
        const live = ytResults.get(ch.channel_id);
        const { error } = await supabase
          .from('user_stream_channels')
          .update({
            is_live: !!live,
            stream_title: live?.title ?? null,
            viewer_count: live?.viewer_count ?? 0,
            thumbnail_url: live?.thumbnail_url ?? null,
            started_at: null,
            last_synced_at: now,
          })
          .eq('id', ch.id);
        if (!error) updated++;
        else errors.push(`youtube/${ch.channel_name}: ${error.message}`);
      }
    } catch (e) {
      errors.push(`youtube: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }

  // --- Kick ---
  const kickChannels = byPlatform.get('kick') ?? [];
  for (const ch of kickChannels) {
    try {
      const live = await fetchKickLiveStatus(ch.channel_name);
      const { error } = await supabase
        .from('user_stream_channels')
        .update({
          is_live: !!live,
          stream_title: live?.title ?? null,
          viewer_count: live?.viewer_count ?? 0,
          thumbnail_url: live?.thumbnail_url ?? null,
          started_at: live?.started_at ?? null,
          last_synced_at: now,
        })
        .eq('id', ch.id);
      if (!error) updated++;
      else errors.push(`kick/${ch.channel_name}: ${error.message}`);
    } catch (e) {
      errors.push(`kick/${ch.channel_name}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }

  // --- TikTok --- (no API, just update last_synced_at)
  const tiktokChannels = byPlatform.get('tiktok') ?? [];
  for (const ch of tiktokChannels) {
    await supabase
      .from('user_stream_channels')
      .update({ last_synced_at: now })
      .eq('id', ch.id);
    updated++;
  }

  // Mark stale channels as offline
  const staleThreshold = new Date(Date.now() - STREAM_STALE_THRESHOLD_MIN * 60 * 1000).toISOString();
  await supabase
    .from('user_stream_channels')
    .update({ is_live: false, viewer_count: 0 })
    .eq('is_live', true)
    .lt('last_synced_at', staleThreshold);

  return NextResponse.json({
    success: true,
    total: channels.length,
    updated,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// ─── Platform API Helpers ───────────────────────────────────────────────

interface LiveStreamInfo {
  title: string;
  viewer_count: number;
  thumbnail_url: string | null;
  game_name: string | null;
  started_at: string | null;
}

/**
 * Twitch Helix API — batch check up to 100 channels
 */
async function fetchTwitchLiveStatus(
  logins: string[],
): Promise<Map<string, LiveStreamInfo>> {
  const results = new Map<string, LiveStreamInfo>();

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return results;

  // Get app access token
  const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });
  if (!tokenRes.ok) return results;
  const { access_token } = await tokenRes.json();

  // Batch in groups of 100
  for (let i = 0; i < logins.length; i += 100) {
    const batch = logins.slice(i, i + 100);
    const params = new URLSearchParams();
    batch.forEach((login) => params.append('user_login', login.toLowerCase()));

    const res = await fetch(`https://api.twitch.tv/helix/streams?${params}`, {
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${access_token}`,
      },
    });
    if (!res.ok) continue;

    const { data } = await res.json();
    for (const stream of data ?? []) {
      results.set(stream.user_login.toLowerCase(), {
        title: stream.title,
        viewer_count: stream.viewer_count,
        thumbnail_url: stream.thumbnail_url
          ?.replace('{width}', '440')
          .replace('{height}', '248') ?? null,
        game_name: stream.game_name ?? null,
        started_at: stream.started_at ?? null,
      });
    }
  }

  return results;
}

/**
 * YouTube Data API v3 — check live status per channel
 */
async function fetchYouTubeLiveStatus(
  channelIds: string[],
): Promise<Map<string, LiveStreamInfo>> {
  const results = new Map<string, LiveStreamInfo>();

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return results;

  for (const channelId of channelIds) {
    try {
      const params = new URLSearchParams({
        part: 'snippet',
        channelId,
        type: 'video',
        eventType: 'live',
        key: apiKey,
        maxResults: '1',
      });
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
      if (!res.ok) continue;

      const { items } = await res.json();
      if (items && items.length > 0) {
        const item = items[0];
        results.set(channelId, {
          title: item.snippet.title,
          viewer_count: 0, // Search API doesn't return viewer count
          thumbnail_url: item.snippet.thumbnails?.medium?.url ?? null,
          game_name: null,
          started_at: item.snippet.publishedAt ?? null,
        });
      }
    } catch {
      // Skip failed channels
    }
  }

  return results;
}

/**
 * Kick — individual channel check (undocumented API)
 */
async function fetchKickLiveStatus(
  channelName: string,
): Promise<LiveStreamInfo | null> {
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(channelName)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const livestream = data?.livestream;
    if (!livestream || !livestream.is_live) return null;

    return {
      title: livestream.session_title ?? '',
      viewer_count: livestream.viewer_count ?? 0,
      thumbnail_url: livestream.thumbnail?.url ?? null,
      game_name: livestream.categories?.[0]?.name ?? null,
      started_at: livestream.created_at ?? null,
    };
  } catch {
    return null;
  }
}
