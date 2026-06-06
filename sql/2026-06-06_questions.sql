-- ============================================================================
-- questions — community Q&A system
-- ============================================================================
-- Visitors submit questions about Turkey/residency/etc; admins answer; only
-- answered questions are shown publicly. Backs the new /qa page and admin
-- /admin/questions review queue.
--
-- Apply via Supabase SQL Editor → New query → paste in full → Run.
-- Idempotent — safe to re-run.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.questions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The question itself
  question     text NOT NULL,
  context      text,                  -- optional clarifying context
  category     text,                  -- free-form, e.g. "الإقامة", "الصحة"

  -- Who's asking (we accept anonymous)
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  asker_name   text,                  -- shown publicly (or "زائر")
  asker_email  text,                  -- private — used to notify on answer
  ip_hash      text,                  -- SHA-256(ip + salt) — for rate limit

  -- Moderation + answer
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'answered', 'rejected', 'spam')),
  answer       text,
  answered_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  answered_at  timestamptz,

  -- Engagement
  upvotes      integer NOT NULL DEFAULT 0,
  views        integer NOT NULL DEFAULT 0,
  is_featured  boolean NOT NULL DEFAULT false,

  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS questions_status_created_idx
  ON public.questions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS questions_answered_at_idx
  ON public.questions (answered_at DESC) WHERE status = 'answered';

CREATE INDEX IF NOT EXISTS questions_featured_idx
  ON public.questions (is_featured DESC, answered_at DESC) WHERE status = 'answered';

-- updated_at trigger (re-uses the helper from earlier migrations).
DROP TRIGGER IF EXISTS questions_updated_at ON public.questions;
CREATE TRIGGER questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname='public' AND tablename='questions' LOOP
    EXECUTE format('DROP POLICY %I ON public.questions', r.policyname);
  END LOOP;
END $$;

-- Anyone can submit. Real validation/rate-limit happens in the API layer.
CREATE POLICY "questions_public_insert"
  ON public.questions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public can read ONLY answered, non-rejected questions.
CREATE POLICY "questions_public_read_answered"
  ON public.questions
  FOR SELECT
  TO anon, authenticated
  USING (status = 'answered');

-- Authors of a question can read their own pending question (so a logged-in
-- user can see they submitted one and check its status).
CREATE POLICY "questions_owner_read"
  ON public.questions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins do everything (review queue, answer, delete spam).
CREATE POLICY "questions_admin_all"
  ON public.questions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RPC: increment view counter atomically (avoids read-modify-write races).
CREATE OR REPLACE FUNCTION public.increment_question_views(question_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.questions
  SET views = views + 1
  WHERE id = question_id AND status = 'answered';
$$;

GRANT EXECUTE ON FUNCTION public.increment_question_views(uuid) TO anon, authenticated;
