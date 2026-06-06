-- ============================================================================
-- zones — add reopened_at + relax status to allow 'reopened'
-- ============================================================================
-- Tracks which neighborhoods came off the closed list and when, so the
-- public tool can split them into "recently reopened" (highlight) vs
-- "still closed" (warning) vs the older catch-all "closed".
--
-- Apply via Supabase SQL Editor → New query → paste → Run. Idempotent.
-- ============================================================================

ALTER TABLE public.zones
  ADD COLUMN IF NOT EXISTS reopened_at timestamptz;

-- Partial index — only rows that were actually reopened. Keeps the index
-- small (it's used for "recently reopened" sorting + filtering).
CREATE INDEX IF NOT EXISTS zones_reopened_at_idx
  ON public.zones (reopened_at DESC)
  WHERE status = 'reopened';

-- A small helper view that surfaces the latest reopen per (city, district)
-- — useful for the public page banner that says "newest update in your
-- province was on X". Optional but cheap.
CREATE OR REPLACE VIEW public.zones_latest_reopens AS
SELECT
  city,
  COUNT(*) FILTER (WHERE status = 'reopened') AS reopened_count,
  COUNT(*) FILTER (WHERE status = 'closed') AS closed_count,
  MAX(reopened_at) AS last_reopen_at
FROM public.zones
GROUP BY city
ORDER BY last_reopen_at DESC NULLS LAST;

GRANT SELECT ON public.zones_latest_reopens TO anon, authenticated;
