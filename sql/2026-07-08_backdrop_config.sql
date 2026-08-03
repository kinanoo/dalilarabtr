-- ============================================================================
-- Site backdrop config — one JSONB column on the site_settings singleton.
-- Powers /admin/appearance (image list up to 12, opacity, veil, distribution).
-- Safe + idempotent. Run in Supabase → SQL Editor.
-- ============================================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS backdrop jsonb
  DEFAULT '{"enabled":true,"images":["/bg/bg-1.webp","/bg/bg-2.webp","/bg/bg-3.webp","/bg/bg-4.webp"],"opacity":20,"veil":22,"mode":"per-page"}'::jsonb;

-- Backfill the singleton row (id=1) if it exists but the column is still null.
UPDATE public.site_settings
   SET backdrop = '{"enabled":true,"images":["/bg/bg-1.webp","/bg/bg-2.webp","/bg/bg-3.webp","/bg/bg-4.webp"],"opacity":20,"veil":22,"mode":"per-page"}'::jsonb
 WHERE id = 1 AND backdrop IS NULL;

-- Ensure the singleton row exists at all (harmless if it already does).
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
