-- =====================================================
-- Phase 3 Remaining Fixes (sections 4-5 that failed)
-- Run this in Supabase SQL Editor
-- =====================================================


-- =====================================================
-- 4. Fix rating_avg trigger to also fire on DELETE
--    Function name: update_service_provider_rating()
--    (renamed in fix_service_reviews_trigger_v2.sql)
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_service_rating ON service_reviews;
DROP TRIGGER IF EXISTS on_review_change ON service_reviews;
CREATE TRIGGER trigger_update_service_rating
    AFTER INSERT OR UPDATE OR DELETE ON service_reviews
    FOR EACH ROW EXECUTE FUNCTION update_service_provider_rating();


-- =====================================================
-- 5. Drop unused site_updates table (code now uses 'updates')
-- =====================================================

DROP TABLE IF EXISTS site_updates CASCADE;


-- =====================================================
-- Verify
-- =====================================================
SELECT tgname, tgtype
FROM pg_trigger
WHERE tgrelid = 'service_reviews'::regclass
  AND NOT tgisinternal;
