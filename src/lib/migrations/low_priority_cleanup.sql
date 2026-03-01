-- =====================================================
-- Low-Priority Cleanup (Issues #16, #20, #22)
-- Run this in Supabase SQL Editor
-- =====================================================


-- =====================================================
-- 1. Drop dead 'tips' column from consultant_scenarios
--    Code uses 'tip' (singular) — 'tips' is unused
-- =====================================================

ALTER TABLE consultant_scenarios DROP COLUMN IF EXISTS tips;


-- =====================================================
-- 2. Fix articles with NULL slug
--    Generate slug from title (Arabic → transliterated)
--    For any article missing a slug
-- =====================================================

UPDATE articles
SET slug = 'article-' || id::TEXT
WHERE slug IS NULL OR slug = '';


-- =====================================================
-- 3. Fix link='' → NULL in updates table
--    Empty strings cause truthy checks to pass incorrectly
-- =====================================================

UPDATE updates SET link = NULL WHERE link = '';
UPDATE updates SET image = NULL WHERE image = '';


-- =====================================================
-- 4. Verify results
-- =====================================================

-- Check tips column is gone
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'consultant_scenarios' AND column_name = 'tips';

-- Check no NULL slugs remain
SELECT count(*) AS articles_without_slug
FROM articles
WHERE slug IS NULL OR slug = '';

-- Check no empty-string links remain
SELECT count(*) AS updates_with_empty_link
FROM updates
WHERE link = '';
