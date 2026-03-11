import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { STREAM_PLATFORMS } from '@/lib/constants';

const PLATFORM_URL_PATTERNS: Record<string, RegExp> = {
  twitch: /^https?:\/\/(www\.)?twitch\.tv\/[a-zA-Z0-9_]{1,25}\/?$/,
  youtube: /^https?:\/\/(www\.)?youtube\.com\/(channel\/UC[\w-]{22}|@[\w.-]+)\/?$/,
  kick: /^https?:\/\/(www\.)?kick\.com\/[a-zA-Z0-9_-]{1,25}\/?$/,
  tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]{1,24}\/?$/,
};

const linkSchema = z.object({
  platform: z.enum(STREAM_PLATFORMS),
  channelName: z.string().min(1).max(50),
  channelUrl: z.string().url().max(200),
  channelId: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { platform, channelName, channelUrl, channelId } = parsed.data;

  // Validate URL matches platform pattern
  const pattern = PLATFORM_URL_PATTERNS[platform];
  if (pattern && !pattern.test(channelUrl)) {
    return NextResponse.json(
      { error: `Invalid ${platform} channel URL format` },
      { status: 400 },
    );
  }

  // Check feature flag
  const { data: flag } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('key', 'streams_enabled')
    .single();

  if (flag && !flag.enabled) {
    return NextResponse.json({ error: 'Streams feature is currently disabled' }, { status: 403 });
  }

  // Verify PSN-verified status
  const { data: profile } = await supabase
    .from('profiles')
    .select('psn_verified_status, is_banned')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (profile.is_banned) {
    return NextResponse.json({ error: 'Account is banned' }, { status: 403 });
  }

  if (profile.psn_verified_status !== 'confirmed_by_user') {
    return NextResponse.json(
      { error: 'You must verify your PSN account before linking a stream channel' },
      { status: 403 },
    );
  }

  // Insert (upsert to handle re-linking same platform)
  const { data: channel, error: insertError } = await supabase
    .from('user_stream_channels')
    .upsert(
      {
        user_id: user.id,
        platform,
        channel_name: channelName,
        channel_url: channelUrl,
        channel_id: channelId ?? null,
      },
      { onConflict: 'user_id,platform' },
    )
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, channel });
}
