-- ============================================================================
-- Track digest sends per subscriber so the cron can skip recently-emailed rows
-- and admins can audit who got what.
-- ============================================================================

-- 1. Per-subscriber column: last successful digest timestamp.
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS last_digest_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS newsletter_subscribers_last_digest_idx
  ON public.newsletter_subscribers (last_digest_sent_at NULLS FIRST);

-- 2. Audit table — one row per send batch (not per recipient — that would
--    explode quickly). Records what articles were included, how many
--    recipients, success vs failure totals.
CREATE TABLE IF NOT EXISTS public.newsletter_digest_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_at    timestamptz NOT NULL DEFAULT now(),
  triggered_by    text NOT NULL DEFAULT 'cron',   -- 'cron' | 'admin'
  article_ids     text[] NOT NULL DEFAULT '{}',   -- slugs included this run
  recipient_count integer NOT NULL DEFAULT 0,
  success_count   integer NOT NULL DEFAULT 0,
  failure_count   integer NOT NULL DEFAULT 0,
  error_summary   text,
  duration_ms     integer
);

CREATE INDEX IF NOT EXISTS newsletter_digest_log_triggered_at_idx
  ON public.newsletter_digest_log (triggered_at DESC);

-- 3. RLS — only admins can read the audit log.
ALTER TABLE public.newsletter_digest_log ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname='public' AND tablename='newsletter_digest_log' LOOP
    EXECUTE format('DROP POLICY %I ON public.newsletter_digest_log', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "newsletter_digest_log_admin_only"
  ON public.newsletter_digest_log
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
