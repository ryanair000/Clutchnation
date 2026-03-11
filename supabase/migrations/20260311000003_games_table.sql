-- =============================================================================
-- GAMES REFERENCE TABLE & MULTI-GAME SUPPORT
-- =============================================================================

-- Games reference table
CREATE TABLE public.games (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon_url text,
  platform text NOT NULL DEFAULT 'PlayStation',
  is_active boolean NOT NULL DEFAULT true,
  modes jsonb NOT NULL DEFAULT '["1v1"]',
  scoring_type text NOT NULL DEFAULT 'goals'
    CHECK (scoring_type IN ('goals', 'points', 'kills', 'rounds')),
  rules_schema jsonb NOT NULL DEFAULT '{}',
  psn_title_names text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "games_select_public" ON public.games
  FOR SELECT USING (true);

CREATE POLICY "games_admin_insert" ON public.games
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "games_admin_update" ON public.games
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "games_admin_delete" ON public.games
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Seed supported games
INSERT INTO public.games (id, name, slug, platform, is_active, modes, scoring_type, rules_schema, psn_title_names, sort_order) VALUES
  ('fc26', 'EA SPORTS FC 26', 'fc26', 'PlayStation', true,
   '["1v1", "2v2", "pro_clubs"]',
   'goals',
   '{"half_length_min": {"label": "Half Length (minutes)", "type": "number", "min": 4, "max": 20, "default": 6}}',
   ARRAY['EA SPORTS FC 26', 'EA SPORTS FC™ 26'],
   1),
  ('nba2k26', 'NBA 2K26', 'nba2k26', 'PlayStation', true,
   '["1v1", "2v2", "pro_am"]',
   'points',
   '{"quarter_length_min": {"label": "Quarter Length (minutes)", "type": "number", "min": 3, "max": 12, "default": 5}}',
   ARRAY['NBA 2K26'],
   2),
  ('madden26', 'Madden NFL 26', 'madden26', 'PlayStation', true,
   '["1v1", "2v2"]',
   'points',
   '{"quarter_length_min": {"label": "Quarter Length (minutes)", "type": "number", "min": 3, "max": 15, "default": 6}}',
   ARRAY['Madden NFL 26'],
   3),
  ('cod_bo6', 'Call of Duty: Black Ops 6', 'cod-bo6', 'PlayStation', true,
   '["1v1", "2v2", "team_deathmatch", "search_and_destroy"]',
   'kills',
   '{"round_count": {"label": "Rounds", "type": "number", "min": 1, "max": 30, "default": 13}}',
   ARRAY['Call of Duty®: Black Ops 6'],
   4),
  ('tekken8', 'Tekken 8', 'tekken8', 'PlayStation', true,
   '["1v1"]',
   'rounds',
   '{"best_of": {"label": "Best of (rounds)", "type": "number", "min": 1, "max": 7, "default": 3}}',
   ARRAY['TEKKEN 8', 'Tekken™ 8'],
   5),
  ('sf6', 'Street Fighter 6', 'sf6', 'PlayStation', true,
   '["1v1"]',
   'rounds',
   '{"best_of": {"label": "Best of (rounds)", "type": "number", "min": 1, "max": 7, "default": 3}}',
   ARRAY['Street Fighter™ 6', 'Street Fighter 6'],
   6),
  ('gt7', 'Gran Turismo 7', 'gt7', 'PlayStation', true,
   '["1v1", "2v2"]',
   'points',
   '{"race_count": {"label": "Number of Races", "type": "number", "min": 1, "max": 10, "default": 3}}',
   ARRAY['Gran Turismo 7', 'Gran Turismo™ 7'],
   7),
  ('rocketleague', 'Rocket League', 'rocket-league', 'PlayStation', true,
   '["1v1", "2v2", "3v3"]',
   'goals',
   '{"match_length_min": {"label": "Match Length (minutes)", "type": "number", "min": 5, "max": 10, "default": 5}}',
   ARRAY['Rocket League®', 'Rocket League'],
   8);

-- =============================================================================
-- ADD game_id TO MATCHES
-- =============================================================================
ALTER TABLE public.matches
  ADD COLUMN game_id text REFERENCES public.games(id) DEFAULT 'fc26';

-- Backfill existing matches: tournament matches get game from tournament, standalone get fc26
UPDATE public.matches m
SET game_id = COALESCE(
  (SELECT t.game FROM public.tournaments t WHERE t.id = m.tournament_id),
  'fc26'
)
WHERE m.game_id IS NULL OR m.game_id = 'fc26';

CREATE INDEX idx_matches_game ON public.matches(game_id);

-- =============================================================================
-- FK-CONSTRAIN tournaments.game TO games(id)
-- =============================================================================
-- Backfill existing tournaments (uppercase FC26 → lowercase fc26)
UPDATE public.tournaments SET game = 'fc26' WHERE game = 'FC26';

-- Change default
ALTER TABLE public.tournaments ALTER COLUMN game SET DEFAULT 'fc26';

-- Add FK
ALTER TABLE public.tournaments
  ADD CONSTRAINT fk_tournament_game FOREIGN KEY (game) REFERENCES public.games(id);

CREATE INDEX idx_tournaments_game ON public.tournaments(game);

-- =============================================================================
-- ADD game_id TO LEADERBOARD_SNAPSHOTS
-- =============================================================================
ALTER TABLE public.leaderboard_snapshots
  ADD COLUMN game_id text REFERENCES public.games(id) DEFAULT 'fc26';

-- Backfill existing snapshots
UPDATE public.leaderboard_snapshots SET game_id = 'fc26' WHERE game_id IS NULL;

-- Drop old unique constraint and create new one including game_id
DROP INDEX IF EXISTS idx_leaderboard_user_season_mode;

CREATE UNIQUE INDEX idx_leaderboard_user_season_mode_game
  ON public.leaderboard_snapshots(user_id, season, mode, game_id);

-- Update the ranking index to include game_id
DROP INDEX IF EXISTS idx_leaderboard_season_mode_rank;

CREATE INDEX idx_leaderboard_season_mode_game_rank
  ON public.leaderboard_snapshots(season, mode, game_id, rank);

-- =============================================================================
-- GENERALIZE PSN ACTIVITY TRACKING
-- =============================================================================
-- Add a JSONB column for multi-game activity tracking
ALTER TABLE public.psn_profile_cache
  ADD COLUMN game_activity jsonb DEFAULT '{}';

-- Migrate existing FC26 data into game_activity
UPDATE public.psn_profile_cache
SET game_activity = jsonb_build_object(
  'fc26', jsonb_build_object(
    'last_played_at', fc26_last_played_at,
    'play_duration', fc26_play_duration
  )
)
WHERE fc26_last_played_at IS NOT NULL;
