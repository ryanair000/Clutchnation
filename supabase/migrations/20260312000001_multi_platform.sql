-- Multi-platform support: platform_accounts, platform_profile_cache, platform_link_events
-- Generalises PSN-only linking to support PSN, Steam, Xbox, and Epic Games

-- 1. Platform accounts table (one per user per platform)
CREATE TABLE IF NOT EXISTS public.platform_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('psn', 'steam', 'xbox', 'epic')),
  platform_account_id text NOT NULL,
  platform_username text NOT NULL,
  verified_status text NOT NULL DEFAULT 'none'
    CHECK (verified_status IN ('none','lookup_matched','confirmed_by_user','private_or_unavailable','sync_failed')),
  sync_status text NOT NULL DEFAULT 'never'
    CHECK (sync_status IN ('never','ok','stale','error')),
  profile_url text,
  last_synced_at timestamptz,
  last_lookup_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, platform_account_id),
  UNIQUE (user_id, platform)
);

ALTER TABLE public.platform_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_accounts_select_public"
  ON public.platform_accounts FOR SELECT USING (true);

CREATE POLICY "platform_accounts_insert_own"
  ON public.platform_accounts FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "platform_accounts_update_own"
  ON public.platform_accounts FOR UPDATE
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "platform_accounts_delete_own"
  ON public.platform_accounts FOR DELETE
  TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_platform_accounts_user_id ON public.platform_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_accounts_platform ON public.platform_accounts(platform);

-- 2. Platform profile cache (stores enriched profile data per platform account)
CREATE TABLE IF NOT EXISTS public.platform_profile_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('psn', 'steam', 'xbox', 'epic')),
  platform_account_id text NOT NULL,
  username text,
  avatar_url text,
  about_me text,
  profile_data jsonb,
  presence jsonb,
  share_url text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, platform_account_id)
);

ALTER TABLE public.platform_profile_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_profile_cache_select_authenticated"
  ON public.platform_profile_cache FOR SELECT
  TO authenticated USING (true);

-- 3. Platform link events (audit log)
CREATE TABLE IF NOT EXISTS public.platform_link_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('psn', 'steam', 'xbox', 'epic')),
  platform_account_id text,
  event_type text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_link_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_link_events_select_admin"
  ON public.platform_link_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE INDEX IF NOT EXISTS idx_platform_link_events_user_id ON public.platform_link_events(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_link_events_event_type ON public.platform_link_events(event_type);

-- 4. Migrate existing PSN data into platform_accounts
INSERT INTO public.platform_accounts (user_id, platform, platform_account_id, platform_username, verified_status, sync_status, profile_url, last_synced_at, last_lookup_error)
SELECT
  p.id,
  'psn',
  p.psn_account_id,
  p.psn_online_id,
  p.psn_verified_status,
  p.psn_sync_status,
  p.psn_profile_url,
  p.psn_public_last_synced_at,
  p.psn_last_lookup_error
FROM public.profiles p
WHERE p.psn_account_id IS NOT NULL
  AND p.psn_online_id IS NOT NULL
ON CONFLICT (platform, platform_account_id) DO NOTHING;

-- 5. Migrate PSN profile cache into platform_profile_cache
INSERT INTO public.platform_profile_cache (platform, platform_account_id, username, avatar_url, about_me, profile_data, presence, share_url, fetched_at)
SELECT
  'psn',
  c.psn_account_id,
  c.online_id,
  c.avatar_url,
  c.about_me,
  jsonb_build_object(
    'isPlus', c.is_plus,
    'trophyLevel', c.trophy_level,
    'trophyProgress', c.trophy_progress,
    'trophyCounts', c.trophy_counts,
    'currentTitleName', c.current_title_name,
    'currentTitleId', c.current_title_id,
    'currentPlatform', c.current_platform,
    'fc26LastPlayedAt', c.fc26_last_played_at,
    'fc26PlayDuration', c.fc26_play_duration
  ),
  c.presence,
  c.share_url,
  c.fetched_at
FROM public.psn_profile_cache c
ON CONFLICT (platform, platform_account_id) DO NOTHING;

-- 6. Migrate PSN link events
INSERT INTO public.platform_link_events (user_id, platform, platform_account_id, event_type, metadata, created_at)
SELECT
  e.user_id,
  'psn',
  e.psn_account_id,
  e.event_type,
  e.metadata,
  e.created_at
FROM public.psn_link_events e;

-- 7. Seed new feature flags for other platforms
INSERT INTO public.feature_flags (key, enabled) VALUES
  ('steam_lookup_enabled', true),
  ('xbox_lookup_enabled', true),
  ('epic_lookup_enabled', false)
ON CONFLICT (key) DO NOTHING;
