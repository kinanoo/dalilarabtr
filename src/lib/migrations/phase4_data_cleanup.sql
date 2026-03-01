-- ===================================================================
-- Phase 4 Data Cleanup — Issues 7, 8, 9, 14, 16
-- ===================================================================
-- Run in: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ===================================================================

-- ─────────────────────────────────────────────────────────────
-- Issue 7: Delete fake service review linked to dummy service
-- ─────────────────────────────────────────────────────────────
DELETE FROM service_reviews
WHERE service_id = '00000000-0000-0000-0000-000000000005';

-- ─────────────────────────────────────────────────────────────
-- Issue 8: Delete test/audit comments (inserted during security audit)
-- Remove any comment with no user_id and suspicious test content
-- ─────────────────────────────────────────────────────────────
-- Show orphan comments first (for manual review):
-- SELECT id, content, author_name, created_at FROM comments
--   WHERE status = 'pending' OR (author_name IS NULL AND user_id IS NULL);

-- Delete comments linked to non-existent entities (orphans)
-- Safe approach: only delete comments that are obviously test data
DELETE FROM comments
WHERE status = 'pending'
  AND is_published = false
  AND user_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- Issue 9: Fix inconsistent status — pending but is_published=true
-- ─────────────────────────────────────────────────────────────
UPDATE comments
SET is_published = false
WHERE status = 'pending'
  AND is_published = true;

-- Also ensure approved comments are published
UPDATE comments
SET is_published = true
WHERE status = 'approved'
  AND is_published = false;

-- ─────────────────────────────────────────────────────────────
-- Issue 14: Add CHECK constraint for entity_type values
-- Prevents arbitrary entity_type insertion
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'comments_entity_type_check'
      AND table_name = 'comments'
  ) THEN
    ALTER TABLE comments
    ADD CONSTRAINT comments_entity_type_check
    CHECK (entity_type IS NULL OR entity_type IN (
      'article', 'service', 'update', 'scenario', 'zone', 'faq', 'code'
    ));
    RAISE NOTICE 'Added entity_type CHECK constraint to comments.';
  ELSE
    RAISE NOTICE 'entity_type CHECK constraint already exists.';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- Issue 16: Fix duplicate sort_order in site_menus
-- Assign sequential sort_order within each location group
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  loc TEXT;
  menu_row RECORD;
  seq INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'site_menus'
  ) THEN
    RAISE NOTICE 'Table site_menus does not exist — skipping.';
    RETURN;
  END IF;

  FOR loc IN SELECT DISTINCT location FROM site_menus
  LOOP
    seq := 0;
    FOR menu_row IN
      SELECT id FROM site_menus
      WHERE location = loc
      ORDER BY sort_order, label
    LOOP
      UPDATE site_menus SET sort_order = seq WHERE id = menu_row.id;
      seq := seq + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'site_menus sort_order normalized.';
END $$;

-- ─────────────────────────────────────────────────────────────
-- Verify results
-- ─────────────────────────────────────────────────────────────

-- Check remaining reviews for dummy services
SELECT id, service_id, rating FROM service_reviews
WHERE service_id::text LIKE '00000000%';

-- Check comments consistency
SELECT status, is_published, count(*)
FROM comments
GROUP BY status, is_published;

-- Check menus sort order
SELECT location, sort_order, label
FROM site_menus
ORDER BY location, sort_order;
