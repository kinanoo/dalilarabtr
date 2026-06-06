-- ============================================================================
-- newsletter_subscribers — email list for the site's newsletter
-- ============================================================================
-- Schema
--   id            uuid PK
--   email         citext — case-insensitive uniqueness
--   confirmed     boolean — flips to true after a (future) double opt-in flow
--   source        text — where the signup happened (home, article-footer, etc.)
--   unsub_token   text — opaque token used by future unsubscribe links
--   user_id       uuid → auth.users — populated when the subscriber is signed in
--   created_at    timestamptz
--   updated_at    timestamptz
--
-- RLS
--   - Public INSERT allowed (so the signup form works without auth)
--   - No public SELECT/UPDATE/DELETE (admins use service-role from the API)
--   - is_admin() bypass policy lets the admin UI list/clean subscribers
--
-- Apply via Supabase SQL Editor → New query → paste in full → Run.
-- Idempotent — safe to re-run.
-- ============================================================================

-- citext makes emails compare case-insensitively at the DB level so
-- "User@Example.com" and "user@example.com" can't both subscribe.
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        citext NOT NULL,
  confirmed    boolean NOT NULL DEFAULT false,
  source       text,
  unsub_token  text NOT NULL DEFAULT encode(gen_random_bytes(18), 'hex'),
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_uniq
  ON public.newsletter_subscribers (email);

CREATE INDEX IF NOT EXISTS newsletter_subscribers_created_idx
  ON public.newsletter_subscribers (created_at DESC);

-- updated_at trigger so we know the last time a row changed (re-confirmation,
-- email update, etc.).
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS newsletter_subscribers_updated_at ON public.newsletter_subscribers;
CREATE TRIGGER newsletter_subscribers_updated_at
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname='public' AND tablename='newsletter_subscribers' LOOP
    EXECUTE format('DROP POLICY %I ON public.newsletter_subscribers', r.policyname);
  END LOOP;
END $$;

-- Anyone may submit a signup. The API layer hashes-into-uniqueness and
-- rate-limits, so we don't need a WITH CHECK clause beyond accepting INSERTs.
CREATE POLICY "newsletter_subscribers_public_insert"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admin reads/updates/deletes via the is_admin() helper.
CREATE POLICY "newsletter_subscribers_admin_all"
  ON public.newsletter_subscribers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
