-- ClutchNation — RLS Policies
-- Enable RLS on all tables, then define policies.

-- =============================================================================
-- ENABLE RLS
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PROFILES
-- =============================================================================
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id AND is_banned = false)
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- TOURNAMENTS
-- =============================================================================
CREATE POLICY "tournaments_select_public" ON public.tournaments
  FOR SELECT USING (true);

CREATE POLICY "tournaments_insert_auth" ON public.tournaments
  FOR INSERT WITH CHECK (
    auth.uid() = host_id
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true)
  );

CREATE POLICY "tournaments_update_host" ON public.tournaments
  FOR UPDATE USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "tournaments_update_admin" ON public.tournaments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =============================================================================
-- TOURNAMENT PARTICIPANTS
-- =============================================================================
CREATE POLICY "tp_select_public" ON public.tournament_participants
  FOR SELECT USING (true);

-- Insert/delete handled by SECURITY DEFINER functions (join_tournament, leave_tournament)
-- Allow direct insert for the function's SECURITY DEFINER to work
CREATE POLICY "tp_insert_own" ON public.tournament_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tp_delete_own" ON public.tournament_participants
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- MATCHES
-- =============================================================================
CREATE POLICY "matches_select" ON public.matches
  FOR SELECT USING (
    match_type = 'tournament'
    OR player_home_id = auth.uid()
    OR player_away_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "matches_update_players" ON public.matches
  FOR UPDATE USING (
    player_home_id = auth.uid() OR player_away_id = auth.uid()
  ) WITH CHECK (
    player_home_id = auth.uid() OR player_away_id = auth.uid()
  );

CREATE POLICY "matches_update_admin" ON public.matches
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Matches are created by system (SECURITY DEFINER functions), allow insert for service role
CREATE POLICY "matches_insert_auth" ON public.matches
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- MATCH EVIDENCE
-- =============================================================================
CREATE POLICY "evidence_select" ON public.match_evidence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_evidence.match_id
      AND (m.player_home_id = auth.uid() OR m.player_away_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "evidence_insert" ON public.match_evidence
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_evidence.match_id
      AND (m.player_home_id = auth.uid() OR m.player_away_id = auth.uid())
    )
  );

-- =============================================================================
-- MESSAGES (simplified for MVP — full channel membership check in app layer)
-- =============================================================================
CREATE POLICY "messages_select_auth" ON public.messages
  FOR SELECT USING (
    is_deleted = false AND auth.uid() IS NOT NULL
  );

CREATE POLICY "messages_insert_auth" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true)
  );

-- Admin can soft-delete
CREATE POLICY "messages_update_admin" ON public.messages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =============================================================================
-- DM THREADS
-- =============================================================================
CREATE POLICY "dm_threads_select_own" ON public.dm_threads
  FOR SELECT USING (user_a_id = auth.uid() OR user_b_id = auth.uid());

CREATE POLICY "dm_threads_insert_own" ON public.dm_threads
  FOR INSERT WITH CHECK (user_a_id = auth.uid() OR user_b_id = auth.uid());

-- =============================================================================
-- REPORTS
-- =============================================================================
CREATE POLICY "reports_insert_auth" ON public.reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "reports_select_own" ON public.reports
  FOR SELECT USING (
    reporter_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "reports_update_admin" ON public.reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =============================================================================
-- BLOCKS
-- =============================================================================
CREATE POLICY "blocks_select_own" ON public.blocks
  FOR SELECT USING (blocker_id = auth.uid());

CREATE POLICY "blocks_insert_own" ON public.blocks
  FOR INSERT WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "blocks_delete_own" ON public.blocks
  FOR DELETE USING (blocker_id = auth.uid());

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Insert via SECURITY DEFINER triggers/functions
CREATE POLICY "notifications_insert_system" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- =============================================================================
-- LEADERBOARD SNAPSHOTS
-- =============================================================================
CREATE POLICY "leaderboard_select_public" ON public.leaderboard_snapshots
  FOR SELECT USING (true);

-- Insert/update via service role only (no user policy needed)

-- =============================================================================
-- AUDIT LOGS
-- =============================================================================
CREATE POLICY "audit_select_admin" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Insert via SECURITY DEFINER functions
CREATE POLICY "audit_insert_system" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- =============================================================================
-- FEATURE FLAGS
-- =============================================================================
CREATE POLICY "feature_flags_select_public" ON public.feature_flags
  FOR SELECT USING (true);

CREATE POLICY "feature_flags_update_admin" ON public.feature_flags
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
