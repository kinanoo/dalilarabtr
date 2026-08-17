-- Optional editorial SEO controls for public.updates.
-- The public page still has safe automatic fallbacks, so these columns never
-- make publishing harder; they only let the newsroom override the snippet.

ALTER TABLE public.updates
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text[] DEFAULT '{}'::text[];

COMMENT ON COLUMN public.updates.seo_title IS
  'Optional search/social title. Falls back to updates.title when blank.';
COMMENT ON COLUMN public.updates.seo_description IS
  'Optional search/social description. Falls back to summary/content when blank.';
COMMENT ON COLUMN public.updates.seo_keywords IS
  'Optional topical phrases used by structured data; not a ranking guarantee.';

-- Existing news gets a clean explicit baseline. Editors can customise later.
UPDATE public.updates
SET
  seo_title = COALESCE(NULLIF(BTRIM(seo_title), ''), LEFT(BTRIM(title), 120)),
  seo_description = COALESCE(
    NULLIF(BTRIM(seo_description), ''),
    LEFT(
      COALESCE(
        NULLIF(BTRIM(summary), ''),
        NULLIF(BTRIM(REGEXP_REPLACE(COALESCE(content, ''), '<[^>]*>', ' ', 'g')), ''),
        BTRIM(title)
      ),
      300
    )
  )
WHERE
  seo_title IS NULL OR BTRIM(seo_title) = ''
  OR seo_description IS NULL OR BTRIM(seo_description) = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'updates'
      AND column_name = 'seo_title'
  ) THEN
    RAISE EXCEPTION 'updates.seo_title was not created';
  END IF;
END $$;
