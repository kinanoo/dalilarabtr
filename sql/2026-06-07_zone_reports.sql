-- ============================================================================
-- zone_reports — crowdsourced neighborhood status verification
-- ============================================================================
-- Visitors report that a "closed" neighborhood actually accepted their
-- address registration. When ≥3 independent reports land on the same
-- zone row, the admin sees a highlight and can flip it to 'reopened'
-- with one click. Until then, the public page shows a "X أشخاص أبلّغوا"
-- nudge but does NOT auto-flip — the admin stays in the loop.
--
-- The threshold (3 by default) is a balance between "don't let one person
-- fabricate a reopen" and "don't wait for 100 reports when only 5 people
-- check this page per week."
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.zone_reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id      uuid NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  reporter_ip  text,                  -- SHA-256(ip + salt) for dedup
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  report_type  text NOT NULL DEFAULT 'reopened'
                 CHECK (report_type IN ('reopened', 'still_closed')),
  note         text,                  -- optional free-text from the reporter
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- One report per IP per zone — prevents duplicate clicks from the same
-- visitor. The IP is hashed so a leak doesn't expose who reported what.
CREATE UNIQUE INDEX IF NOT EXISTS zone_reports_ip_zone_uniq
  ON public.zone_reports (zone_id, reporter_ip)
  WHERE reporter_ip IS NOT NULL;

CREATE INDEX IF NOT EXISTS zone_reports_zone_id_idx
  ON public.zone_reports (zone_id, created_at DESC);

-- Materialized count on the zones row itself so the public page doesn't
-- need to join zone_reports for every tile. Updated via trigger.
ALTER TABLE public.zones
  ADD COLUMN IF NOT EXISTS community_reopened_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.zones
  ADD COLUMN IF NOT EXISTS community_closed_count integer NOT NULL DEFAULT 0;

-- Trigger function: after INSERT on zone_reports, bump the appropriate
-- counter on the parent zones row. Atomic, no race conditions.
CREATE OR REPLACE FUNCTION public.zone_report_counter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.report_type = 'reopened' THEN
    UPDATE public.zones
    SET community_reopened_count = community_reopened_count + 1
    WHERE id = NEW.zone_id;
  ELSIF NEW.report_type = 'still_closed' THEN
    UPDATE public.zones
    SET community_closed_count = community_closed_count + 1
    WHERE id = NEW.zone_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zone_report_counter_trigger ON public.zone_reports;
CREATE TRIGGER zone_report_counter_trigger
  AFTER INSERT ON public.zone_reports
  FOR EACH ROW EXECUTE FUNCTION public.zone_report_counter();

-- ── RLS ──
ALTER TABLE public.zone_reports ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname='public' AND tablename='zone_reports' LOOP
    EXECUTE format('DROP POLICY %I ON public.zone_reports', r.policyname);
  END LOOP;
END $$;

-- Anyone can submit a report (rate-limited in the API layer).
CREATE POLICY "zone_reports_public_insert"
  ON public.zone_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public can read aggregate counts (via the zones.community_*_count
-- columns), but NOT individual reports — those are admin-only.
-- This prevents someone from scraping who reported what.
CREATE POLICY "zone_reports_admin_read"
  ON public.zone_reports
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admin can delete spam reports.
CREATE POLICY "zone_reports_admin_delete"
  ON public.zone_reports
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
