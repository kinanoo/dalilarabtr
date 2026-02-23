-- ===================================================================
-- Fix: service_reviews trigger uses wrong column name (provider_id → service_id)
-- Run this in: Supabase Dashboard → SQL Editor
-- ===================================================================

-- 1. Drop the broken trigger (if exists)
DROP TRIGGER IF EXISTS trigger_update_service_rating ON service_reviews;
DROP TRIGGER IF EXISTS update_service_rating_trigger ON service_reviews;
DROP TRIGGER IF EXISTS after_review_insert ON service_reviews;

-- 2. Recreate the function with the correct column name (service_id)
CREATE OR REPLACE FUNCTION update_service_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE service_providers
  SET
    rating = (
      SELECT ROUND(AVG(rating)::NUMERIC, 1)
      FROM service_reviews
      WHERE service_id = NEW.service_id
        AND is_approved = true
    ),
    review_count = (
      SELECT COUNT(*)
      FROM service_reviews
      WHERE service_id = NEW.service_id
        AND is_approved = true
    )
  WHERE id = NEW.service_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recreate the trigger on INSERT and UPDATE
CREATE TRIGGER trigger_update_service_rating
  AFTER INSERT OR UPDATE ON service_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_service_provider_rating();
