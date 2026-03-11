-- PSN Service Token Storage
-- Stores refresh tokens so the server can automatically renew PSN API access
-- without needing a fresh NPSSO cookie each time.

CREATE TABLE IF NOT EXISTS public.psn_service_tokens (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- singleton row
  refresh_token text NOT NULL,
  access_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only the service role can read/write this table
ALTER TABLE public.psn_service_tokens ENABLE ROW LEVEL SECURITY;
-- No RLS policies = no client access; only service_role bypasses RLS
