-- ClutchNation — Full Schema Migration
-- Phase 0: All tables, indexes, constraints, triggers

-- =============================================================================
-- PROFILES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  psn_online_id text UNIQUE,
  avatar_url text,
  bio text CHECK (char_length(bio) <= 280),
  country text NOT NULL DEFAULT 'KE',
  timezone text NOT NULL DEFAULT 'Africa/Nairobi',
  is_admin boolean NOT NULL DEFAULT false,
  is_banned boolean NOT NULL DEFAULT false,
  psn_data jsonb,
  psn_data_fetched_at timestamptz,
  stats_matches_played int NOT NULL DEFAULT 0,
  stats_matches_won int NOT NULL DEFAULT 0,
  stats_tournaments_played int NOT NULL DEFAULT 0,
  stats_tournaments_won int NOT NULL DEFAULT 0,
  stats_goals_for int NOT NULL DEFAULT 0,
  stats_goals_against int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_psn_online_id ON public.profiles(psn_online_id);

-- Username validation: 3-20 chars, alphanumeric + underscore
ALTER TABLE public.profiles ADD CONSTRAINT chk_username_format
  CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_]{3,20}$');

-- PSN ID validation: starts with letter, 3-16 chars
ALTER TABLE public.profiles ADD CONSTRAINT chk_psn_id_format
  CHECK (psn_online_id IS NULL OR psn_online_id ~ '^[a-zA-Z][a-zA-Z0-9_-]{2,15}$');

-- =============================================================================
-- TOURNAMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES public.profiles(id),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 100),
  description text CHECK (char_length(description) <= 1000),
  game text NOT NULL DEFAULT 'FC26',
  mode text NOT NULL CHECK (mode IN ('1v1', '2v2', 'pro_clubs')),
  size int NOT NULL CHECK (size IN (2, 4, 8, 16, 32)),
  format text NOT NULL DEFAULT 'single_elimination',
  rules_half_length_min int NOT NULL DEFAULT 6,
  status text NOT NULL DEFAULT 'registration' CHECK (status IN ('registration', 'in_progress', 'completed', 'cancelled')),
  current_round int NOT NULL DEFAULT 0,
  registration_closes_at timestamptz NOT NULL,
  starts_at timestamptz NOT NULL,
  ended_at timestamptz,
  winner_id uuid REFERENCES public.profiles(id),
  banner_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_starts_at ON public.tournaments(starts_at);
CREATE INDEX IF NOT EXISTS idx_tournaments_host_id ON public.tournaments(host_id);

-- =============================================================================
-- TOURNAMENT PARTICIPANTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  seed int,
  status text NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'checked_in', 'eliminated', 'winner')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- =============================================================================
-- MATCHES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_type text NOT NULL CHECK (match_type IN ('tournament', 'standalone')),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round int,
  bracket_position int,
  player_home_id uuid REFERENCES public.profiles(id),
  player_away_id uuid REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('pending_acceptance', 'scheduled', 'in_progress', 'completed', 'disputed', 'cancelled', 'no_show')),
  scheduled_at timestamptz NOT NULL,
  slot_end_at timestamptz NOT NULL,
  no_show_deadline timestamptz NOT NULL,
  score_home int,
  score_away int,
  home_reported_score_home int,
  home_reported_score_away int,
  away_reported_score_home int,
  away_reported_score_away int,
  winner_id uuid REFERENCES public.profiles(id),
  result_confirmed_at timestamptz,
  dispute_opened_at timestamptz,
  dispute_resolved_at timestamptz,
  dispute_resolved_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON public.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_scheduled_at ON public.matches(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_matches_player_home ON public.matches(player_home_id);
CREATE INDEX IF NOT EXISTS idx_matches_player_away ON public.matches(player_away_id);
CREATE INDEX IF NOT EXISTS idx_matches_match_type ON public.matches(match_type);

-- Standalone matches must NOT reference a tournament
ALTER TABLE public.matches ADD CONSTRAINT chk_standalone_no_tournament
  CHECK (match_type != 'standalone' OR tournament_id IS NULL);

-- Tournament matches must reference a tournament
ALTER TABLE public.matches ADD CONSTRAINT chk_tournament_has_id
  CHECK (match_type != 'tournament' OR tournament_id IS NOT NULL);

-- =============================================================================
-- MATCH EVIDENCE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.match_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id),
  image_path text NOT NULL,
  image_url text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(match_id, uploaded_by)
);

CREATE INDEX IF NOT EXISTS idx_evidence_match_id ON public.match_evidence(match_id);

-- =============================================================================
-- MESSAGES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type text NOT NULL CHECK (channel_type IN ('tournament', 'match', 'dm')),
  channel_id text NOT NULL,
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  body text NOT NULL CHECK (char_length(body) <= 2000),
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_channel ON public.messages(channel_type, channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- =============================================================================
-- DM THREADS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.dm_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id uuid NOT NULL REFERENCES public.profiles(id),
  user_b_id uuid NOT NULL REFERENCES public.profiles(id),
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_a_id, user_b_id),
  CHECK (user_a_id < user_b_id) -- enforce ordering
);

-- =============================================================================
-- REPORTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id),
  reported_user_id uuid NOT NULL REFERENCES public.profiles(id),
  reason text NOT NULL CHECK (reason IN ('cheating', 'harassment', 'impersonation', 'spam', 'other')),
  details text CHECK (char_length(details) <= 1000),
  context_type text,
  context_id uuid,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'actioned', 'dismissed')),
  admin_notes text,
  resolved_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- BLOCKS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.profiles(id),
  blocked_id uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

-- =============================================================================
-- LEADERBOARD SNAPSHOTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  season text NOT NULL,
  mode text NOT NULL,
  matches_played int NOT NULL DEFAULT 0,
  matches_won int NOT NULL DEFAULT 0,
  win_rate numeric(5,4) NOT NULL DEFAULT 0,
  goals_for int NOT NULL DEFAULT 0,
  goals_against int NOT NULL DEFAULT 0,
  goal_diff int NOT NULL DEFAULT 0,
  tournaments_won int NOT NULL DEFAULT 0,
  points int NOT NULL DEFAULT 0,
  rank int,
  computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_season_mode_rank ON public.leaderboard_snapshots(season, mode, rank);

-- =============================================================================
-- AUDIT LOGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON public.audit_logs(target_type, target_id);

-- =============================================================================
-- FEATURE FLAGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  metadata jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed feature flags
INSERT INTO public.feature_flags (key, enabled, metadata) VALUES
  ('psn_lookup_enabled', false, '{}'),
  ('beta_mode', false, '{}'),
  ('maintenance_mode', false, '{}')
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- TRIGGERS: updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- TRIGGER: auto-create profile on user signup
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
