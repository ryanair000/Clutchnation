-- ============================================================
-- Community Feature Tables: activity feed, posts, reactions,
-- comments, groups, and supporting triggers
-- ============================================================

-- 1. GROUPS (clans / teams)
CREATE TABLE groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 50),
  slug        text NOT NULL UNIQUE,
  description text CHECK (char_length(description) <= 500),
  avatar_url  text,
  banner_url  text,
  owner_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_public   boolean NOT NULL DEFAULT true,
  max_members int NOT NULL DEFAULT 50,
  member_count int NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_groups_slug     ON groups (slug);
CREATE INDEX idx_groups_owner_id ON groups (owner_id);

-- 2. GROUP MEMBERS
CREATE TABLE group_members (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role      text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX idx_group_members_user_id ON group_members (user_id);

-- 3. ACTIVITY EVENTS (immutable, system-generated)
CREATE TABLE activity_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type     text NOT NULL CHECK (event_type IN (
    'match_completed','tournament_created','tournament_won',
    'player_joined','streak_milestone','rank_achieved'
  )),
  metadata       jsonb NOT NULL DEFAULT '{}',
  reaction_count int NOT NULL DEFAULT 0,
  comment_count  int NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_events_created  ON activity_events (created_at DESC);
CREATE INDEX idx_activity_events_actor    ON activity_events (actor_id);
CREATE INDEX idx_activity_events_type     ON activity_events (event_type);

-- 4. COMMUNITY POSTS (user-created content)
CREATE TABLE community_posts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_type      text NOT NULL DEFAULT 'text' CHECK (post_type IN ('text','media','discussion')),
  title          text CHECK (char_length(title) <= 150),
  content        text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  media_urls     text[] NOT NULL DEFAULT '{}',
  group_id       uuid REFERENCES groups(id) ON DELETE SET NULL,
  is_pinned      boolean NOT NULL DEFAULT false,
  is_deleted     boolean NOT NULL DEFAULT false,
  reaction_count int NOT NULL DEFAULT 0,
  comment_count  int NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_posts_created   ON community_posts (created_at DESC);
CREATE INDEX idx_community_posts_author    ON community_posts (author_id);
CREATE INDEX idx_community_posts_group     ON community_posts (group_id) WHERE group_id IS NOT NULL;

-- 5. REACTIONS (polymorphic, one per user per target)
CREATE TABLE reactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type   text NOT NULL CHECK (target_type IN ('post','activity','comment')),
  target_id     uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like','fire','gg','clutch')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX idx_reactions_target ON reactions (target_type, target_id);

-- 6. COMMENTS (on posts or activity events)
CREATE TABLE comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('post','activity')),
  target_id   uuid NOT NULL,
  body        text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  is_deleted  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_target ON comments (target_type, target_id, created_at);

-- ============================================================
-- STORAGE BUCKET: community-media
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-media', 'community-media', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Activity Events
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read activity events"
  ON activity_events FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies for authenticated users;
-- only service_role (triggers) can insert.

-- Community Posts
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read non-deleted posts"
  ON community_posts FOR SELECT
  TO authenticated
  USING (is_deleted = false);

CREATE POLICY "Users can create posts"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
  ON community_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Reactions
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read reactions"
  ON reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own reactions"
  ON reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
  ON reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read non-deleted comments"
  ON comments FOR SELECT
  TO authenticated
  USING (is_deleted = false);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can soft-delete own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read public groups"
  ON groups FOR SELECT
  TO authenticated
  USING (
    is_public = true
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can update group"
  ON groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Group Members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read group membership"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id AND g.is_public = true
    )
  );

CREATE POLICY "Users can join public groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM groups g
        WHERE g.id = group_id AND g.is_public = true AND g.member_count < g.max_members
      )
      OR EXISTS (
        SELECT 1 FROM groups g WHERE g.id = group_id AND g.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Storage: community-media
CREATE POLICY "Authenticated users can upload community media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'community-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authenticated users can read community media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'community-media');

-- ============================================================
-- TRIGGERS: Auto-generate activity events
-- ============================================================

-- Match completed → activity event
CREATE OR REPLACE FUNCTION fn_activity_match_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') AND NEW.winner_id IS NOT NULL THEN
    INSERT INTO activity_events (actor_id, event_type, metadata)
    VALUES (
      NEW.winner_id,
      'match_completed',
      jsonb_build_object(
        'match_id', NEW.id,
        'match_type', NEW.match_type,
        'player_home_id', NEW.player_home_id,
        'player_away_id', NEW.player_away_id,
        'score_home', NEW.score_home,
        'score_away', NEW.score_away,
        'winner_id', NEW.winner_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_activity_match_completed
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION fn_activity_match_completed();

-- Tournament created → activity event
CREATE OR REPLACE FUNCTION fn_activity_tournament_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_events (actor_id, event_type, metadata)
  VALUES (
    NEW.host_id,
    'tournament_created',
    jsonb_build_object(
      'tournament_id', NEW.id,
      'title', NEW.title,
      'mode', NEW.mode,
      'size', NEW.size
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_activity_tournament_created
  AFTER INSERT ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION fn_activity_tournament_created();

-- Tournament won → activity event
CREATE OR REPLACE FUNCTION fn_activity_tournament_won()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL
     AND (OLD.winner_id IS NULL OR OLD.status IS DISTINCT FROM 'completed') THEN
    INSERT INTO activity_events (actor_id, event_type, metadata)
    VALUES (
      NEW.winner_id,
      'tournament_won',
      jsonb_build_object(
        'tournament_id', NEW.id,
        'title', NEW.title,
        'winner_id', NEW.winner_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_activity_tournament_won
  AFTER UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION fn_activity_tournament_won();

-- Player joined (username set for first time) → activity event
CREATE OR REPLACE FUNCTION fn_activity_player_joined()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.username IS NULL AND NEW.username IS NOT NULL THEN
    INSERT INTO activity_events (actor_id, event_type, metadata)
    VALUES (
      NEW.id,
      'player_joined',
      jsonb_build_object('username', NEW.username)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_activity_player_joined
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION fn_activity_player_joined();

-- ============================================================
-- TRIGGERS: Denormalized reaction / comment counts
-- ============================================================

CREATE OR REPLACE FUNCTION fn_update_reaction_count()
RETURNS TRIGGER AS $$
DECLARE
  delta int;
  t_type text;
  t_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    delta := 1; t_type := NEW.target_type; t_id := NEW.target_id;
  ELSIF TG_OP = 'DELETE' THEN
    delta := -1; t_type := OLD.target_type; t_id := OLD.target_id;
  END IF;

  IF t_type = 'post' THEN
    UPDATE community_posts SET reaction_count = reaction_count + delta WHERE id = t_id;
  ELSIF t_type = 'activity' THEN
    UPDATE activity_events SET reaction_count = reaction_count + delta WHERE id = t_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_reaction_count
  AFTER INSERT OR DELETE ON reactions
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_reaction_count();

CREATE OR REPLACE FUNCTION fn_update_comment_count()
RETURNS TRIGGER AS $$
DECLARE
  delta int;
  t_type text;
  t_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    delta := 1; t_type := NEW.target_type; t_id := NEW.target_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Soft-delete toggled
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      delta := -1;
    ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
      delta := 1;
    ELSE
      RETURN NEW;
    END IF;
    t_type := NEW.target_type; t_id := NEW.target_id;
  END IF;

  IF t_type = 'post' THEN
    UPDATE community_posts SET comment_count = comment_count + delta WHERE id = t_id;
  ELSIF t_type = 'activity' THEN
    UPDATE activity_events SET comment_count = comment_count + delta WHERE id = t_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_comment_count
  AFTER INSERT OR UPDATE OF is_deleted ON comments
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_comment_count();

-- ============================================================
-- TRIGGER: Update group member_count
-- ============================================================

CREATE OR REPLACE FUNCTION fn_update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_group_member_count
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_group_member_count();

-- ============================================================
-- FUNCTION: Toggle reaction (atomic upsert)
-- ============================================================

CREATE OR REPLACE FUNCTION toggle_reaction(
  p_user_id uuid,
  p_target_type text,
  p_target_id uuid,
  p_reaction_type text
)
RETURNS TABLE(action text, new_count int) AS $$
DECLARE
  existing_id uuid;
  v_count int;
BEGIN
  SELECT r.id INTO existing_id
  FROM reactions r
  WHERE r.user_id = p_user_id
    AND r.target_type = p_target_type
    AND r.target_id = p_target_id;

  IF existing_id IS NOT NULL THEN
    DELETE FROM reactions WHERE id = existing_id;
    action := 'removed';
  ELSE
    INSERT INTO reactions (user_id, target_type, target_id, reaction_type)
    VALUES (p_user_id, p_target_type, p_target_id, p_reaction_type);
    action := 'added';
  END IF;

  -- Return updated count
  IF p_target_type = 'post' THEN
    SELECT reaction_count INTO v_count FROM community_posts WHERE id = p_target_id;
  ELSIF p_target_type = 'activity' THEN
    SELECT reaction_count INTO v_count FROM activity_events WHERE id = p_target_id;
  ELSE
    v_count := 0;
  END IF;

  new_count := v_count;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
