-- Add favorite_games column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS favorite_games text[] DEFAULT '{}';
