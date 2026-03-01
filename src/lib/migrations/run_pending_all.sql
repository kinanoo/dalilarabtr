-- ===================================================================
-- ALL PENDING MIGRATIONS — Combined Single Run
-- ===================================================================
-- Combines: low_priority_cleanup + server_side_security
--           + phase3_remaining_fixes + autofill_seo_fields
-- Run in: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ===================================================================


-- ═══════════════════════════════════════════════════════════════════
-- PART 1: Low-Priority Cleanup (dead columns, NULL slugs, empty links)
-- ═══════════════════════════════════════════════════════════════════

-- 1a. Drop dead 'tips' column from consultant_scenarios
ALTER TABLE consultant_scenarios DROP COLUMN IF EXISTS tips;

-- 1b. Fix articles with NULL or empty slug
UPDATE articles
SET slug = 'article-' || id::TEXT
WHERE slug IS NULL OR slug = '';

-- 1c. Fix empty-string links/images in updates → NULL
UPDATE updates SET link = NULL WHERE link = '';
UPDATE updates SET image = NULL WHERE image = '';


-- ═══════════════════════════════════════════════════════════════════
-- PART 2: Server-Side Security (login attempts + vote deduplication)
-- ═══════════════════════════════════════════════════════════════════

-- 2a. Admin Login Rate Limiting Table
CREATE TABLE IF NOT EXISTS admin_login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT NOT NULL,
    email TEXT,
    success BOOLEAN DEFAULT false,
    attempted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- Index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time
    ON admin_login_attempts (ip_address, success, attempted_at DESC);

-- Auto-cleanup: delete records older than 24 hours
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM admin_login_attempts WHERE attempted_at < now() - interval '24 hours';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_cleanup_login_attempts ON admin_login_attempts;
CREATE TRIGGER trg_cleanup_login_attempts
    AFTER INSERT ON admin_login_attempts
    FOR EACH STATEMENT
    EXECUTE FUNCTION cleanup_old_login_attempts();

-- 2b. RLS policies for admin_login_attempts
-- (security_rls_enforcement.sql skipped this table because it didn't exist yet)
DO $$
BEGIN
  -- Admin can read login attempts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_login_attempts' AND policyname = 'admin_read_login_attempts'
  ) THEN
    CREATE POLICY "admin_read_login_attempts" ON admin_login_attempts
      FOR SELECT TO authenticated USING (is_admin());
  END IF;

  -- Service role / triggers can insert
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_login_attempts' AND policyname = 'allow_insert_login_attempts'
  ) THEN
    CREATE POLICY "allow_insert_login_attempts" ON admin_login_attempts
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 2c. Voting System — add visitor_id for deduplication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'content_votes' AND column_name = 'visitor_id'
    ) THEN
        ALTER TABLE content_votes ADD COLUMN visitor_id TEXT;
    END IF;
END $$;

-- Unique constraint: one vote per visitor per entity
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_votes_unique_vote
    ON content_votes (entity_type, entity_id, visitor_id)
    WHERE visitor_id IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════
-- PART 3: Fix rating trigger + drop unused table
-- ═══════════════════════════════════════════════════════════════════

-- 3a. Fix rating_avg trigger to fire on INSERT OR UPDATE OR DELETE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_service_provider_rating'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_update_service_rating ON service_reviews;
    DROP TRIGGER IF EXISTS on_review_change ON service_reviews;
    CREATE TRIGGER trigger_update_service_rating
        AFTER INSERT OR UPDATE OR DELETE ON service_reviews
        FOR EACH ROW EXECUTE FUNCTION update_service_provider_rating();
    RAISE NOTICE 'Rating trigger updated to fire on INSERT/UPDATE/DELETE.';
  ELSE
    RAISE NOTICE 'Function update_service_provider_rating() not found — skipping trigger.';
  END IF;
END $$;

-- 3b. Drop unused site_updates table (code uses 'updates' table)
DROP TABLE IF EXISTS site_updates CASCADE;


-- ═══════════════════════════════════════════════════════════════════
-- PART 4: Auto-fill SEO fields for articles
-- ═══════════════════════════════════════════════════════════════════

-- 4a. Fill seo_title where NULL
UPDATE articles
SET seo_title = LEFT(title || ' | دليل العرب في تركيا', 60)
WHERE seo_title IS NULL AND title IS NOT NULL;

-- 4b. Fill seo_description where NULL
UPDATE articles
SET seo_description = LEFT(
    COALESCE(intro, 'دليل شامل حول ' || title || ' في تركيا — معلومات محدثة وموثوقة للعرب المقيمين في تركيا.'),
    160
)
WHERE seo_description IS NULL;

-- 4c. Auto-generate seo_keywords from category + title
UPDATE articles
SET seo_keywords = ARRAY[
    title,
    category,
    'تركيا',
    'دليل العرب',
    CASE category
        WHEN 'الإقامات' THEN 'إقامة تركيا'
        WHEN 'e-Devlet' THEN 'إي دولات'
        WHEN 'السكن والحياة' THEN 'السكن في تركيا'
        WHEN 'العمل والاستثمار' THEN 'العمل في تركيا'
        WHEN 'الصحة والتأمين' THEN 'التأمين الصحي تركيا'
        WHEN 'الفيزا والتأشيرات' THEN 'فيزا تركيا'
        WHEN 'الدراسة والتعليم' THEN 'الدراسة في تركيا'
        WHEN 'المرور والقيادة' THEN 'رخصة القيادة تركيا'
        ELSE 'معلومات تركيا'
    END
]
WHERE seo_keywords IS NULL OR array_length(seo_keywords, 1) IS NULL;


-- ═══════════════════════════════════════════════════════════════════
-- VERIFY ALL
-- ═══════════════════════════════════════════════════════════════════

-- Part 1: tips column gone?
SELECT 'tips_column_exists' AS check_name,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'consultant_scenarios' AND column_name = 'tips'
    )::TEXT AS result;

-- Part 1: no NULL slugs?
SELECT 'articles_without_slug' AS check_name,
    count(*)::TEXT AS result
FROM articles WHERE slug IS NULL OR slug = '';

-- Part 2: login_attempts table exists?
SELECT 'login_attempts_table' AS check_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'admin_login_attempts'
    )::TEXT AS result;

-- Part 3: trigger on service_reviews?
SELECT 'rating_trigger' AS check_name, tgname::TEXT AS result
FROM pg_trigger
WHERE tgrelid = 'service_reviews'::regclass
  AND NOT tgisinternal
  AND tgname = 'trigger_update_service_rating';

-- Part 4: SEO coverage
SELECT
    'seo_coverage' AS check_name,
    count(*)::TEXT || ' total / ' ||
    count(seo_title)::TEXT || ' title / ' ||
    count(seo_description)::TEXT || ' desc / ' ||
    count(CASE WHEN array_length(seo_keywords, 1) > 0 THEN 1 END)::TEXT || ' keywords'
    AS result
FROM articles;
