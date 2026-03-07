-- Add unique constraint for upsert support on leaderboard_snapshots
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_user_season_mode
  ON public.leaderboard_snapshots(user_id, season, mode);
