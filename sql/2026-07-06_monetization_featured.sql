-- ============================================================================
-- Monetization: "featured/promoted" paid listings for the services directory
-- ============================================================================
-- Adds an `is_featured` flag to service_providers. Featured providers sort to
-- the TOP of /services (and city hubs) with a ⭐ "مميّز" badge — this is the spot
-- you SELL to a provider for a monthly fee. Toggle it on when they pay, off when
-- they stop.
--
-- Run in Supabase → SQL Editor. Safe to run more than once.
-- ============================================================================

ALTER TABLE service_providers
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Optional index so featured-first ordering stays fast as the directory grows.
CREATE INDEX IF NOT EXISTS idx_service_providers_featured
  ON service_providers (is_featured DESC, is_verified DESC, rating DESC);

-- ── HOW TO FEATURE A PROVIDER (after they pay) ──────────────────────────────
-- Option A (admin): open لوحة التحكم → الخدمات, edit the provider, tick
--   "مميّز (مدفوع)" and save.
-- Option B (SQL, one line — replace the id):
--   UPDATE service_providers SET is_featured = true  WHERE id = 'PROVIDER_ID';
-- To un-feature when the subscription ends:
--   UPDATE service_providers SET is_featured = false WHERE id = 'PROVIDER_ID';
-- ============================================================================
