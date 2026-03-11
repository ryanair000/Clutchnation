-- Stream Channels: users can link their streaming platform channels
-- Requires PSN verification to link

CREATE TABLE public.user_stream_channels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform    text NOT NULL CHECK (platform IN ('twitch', 'youtube', 'kick', 'tiktok')),
  channel_name text NOT NULL,
  channel_id  text,  -- platform-specific ID (e.g. YouTube channel ID)
  channel_url text NOT NULL,
  is_live     boolean NOT NULL DEFAULT false,
  stream_title text,
  viewer_count integer NOT NULL DEFAULT 0,
  thumbnail_url text,
  game_name   text,
  started_at  timestamptz,
  last_synced_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_stream_platform UNIQUE (user_id, platform)
);

-- Indexes
CREATE INDEX idx_stream_channels_is_live ON public.user_stream_channels (is_live, viewer_count DESC) WHERE is_live = true;
CREATE INDEX idx_stream_channels_user_id ON public.user_stream_channels (user_id);
CREATE INDEX idx_stream_channels_platform ON public.user_stream_channels (platform);

-- Enable RLS
ALTER TABLE public.user_stream_channels ENABLE ROW LEVEL SECURITY;

-- SELECT: anyone can view stream channels
CREATE POLICY "Stream channels are viewable by everyone"
  ON public.user_stream_channels FOR SELECT
  USING (true);

-- INSERT: authenticated + PSN-verified users only
CREATE POLICY "PSN-verified users can link stream channels"
  ON public.user_stream_channels FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND psn_verified_status = 'confirmed_by_user'
        AND is_banned = false
    )
  );

-- UPDATE: own rows only (for channel_name, channel_url, channel_id edits)
-- Service role bypasses RLS for live-status updates from sync cron
CREATE POLICY "Users can update own stream channels"
  ON public.user_stream_channels FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: own rows only
CREATE POLICY "Users can delete own stream channels"
  ON public.user_stream_channels FOR DELETE
  USING (auth.uid() = user_id);

-- Feature flag
INSERT INTO public.feature_flags (key, enabled, metadata)
VALUES ('streams_enabled', true, '{"description": "Enable the streams page and channel linking"}')
ON CONFLICT (key) DO NOTHING;
