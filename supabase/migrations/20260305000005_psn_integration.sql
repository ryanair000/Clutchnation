-- PSN Integration: new profile columns, cache table, audit table, feature flags
-- Phase 0 foundation for PSN identity verification and enrichment

-- 1. Add new PSN columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS psn_account_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS psn_verified_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS psn_profile_url text,
  ADD COLUMN IF NOT EXISTS psn_sync_status text NOT NULL DEFAULT 'never',
  ADD COLUMN IF NOT EXISTS psn_public_last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS psn_last_lookup_error text;

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_psn_verified_status CHECK (
    psn_verified_status IN ('none','lookup_matched','confirmed_by_user','private_or_unavailable','sync_failed')
  ),
  ADD CONSTRAINT chk_psn_sync_status CHECK (
    psn_sync_status IN ('never','ok','stale','error')
  );

CREATE INDEX IF NOT EXISTS idx_profiles_psn_account_id ON public.profiles(psn_account_id);

-- 2. PSN profile cache — server-managed, not directly user-writable
CREATE TABLE IF NOT EXISTS public.psn_profile_cache (
  psn_account_id text PRIMARY KEY,
  online_id text NOT NULL,
  avatar_url text,
  about_me text,
  is_plus boolean,
  trophy_level int,
  trophy_progress int,
  trophy_counts jsonb,
  presence jsonb,
  current_title_name text,
  current_title_id text,
  current_platform text,
  fc26_last_played_at timestamptz,
  fc26_play_duration text,
  share_url text,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.psn_profile_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "psn_cache_select_authenticated"
  ON public.psn_profile_cache FOR SELECT
  TO authenticated
  USING (true);

-- 3. PSN link events audit table
CREATE TABLE IF NOT EXISTS public.psn_link_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  psn_account_id text,
  event_type text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.psn_link_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "psn_link_events_select_admin"
  ON public.psn_link_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE INDEX IF NOT EXISTS idx_psn_link_events_user_id ON public.psn_link_events(user_id);
CREATE INDEX IF NOT EXISTS idx_psn_link_events_event_type ON public.psn_link_events(event_type);

-- 4. Seed additional feature flags
INSERT INTO public.feature_flags (key, enabled) VALUES
  ('psn_presence_enabled', false),
  ('psn_recent_activity_enabled', false),
  ('fc26_external_results_enabled', false)
ON CONFLICT (key) DO NOTHING;

-- 5. Enable PSN lookup (was seeded as false in initial migration)
UPDATE public.feature_flags SET enabled = true WHERE key = 'psn_lookup_enabled';
