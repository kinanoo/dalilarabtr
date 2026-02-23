-- ===================================================================
-- Fix v2: Drop ALL triggers on service_reviews (regardless of name)
-- Run this in: Supabase Dashboard → SQL Editor
-- ===================================================================

-- Step 1: Drop EVERY trigger on service_reviews table
DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN
        SELECT DISTINCT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'service_reviews'
          AND trigger_schema = 'public'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS "' || t.trigger_name || '" ON public.service_reviews CASCADE';
        RAISE NOTICE 'Dropped trigger: %', t.trigger_name;
    END LOOP;
END;
$$;

-- Step 2: Drop any old function versions
DROP FUNCTION IF EXISTS update_service_provider_rating() CASCADE;
DROP FUNCTION IF EXISTS update_service_rating() CASCADE;
DROP FUNCTION IF EXISTS recalculate_service_rating() CASCADE;
DROP FUNCTION IF EXISTS sync_service_rating() CASCADE;

-- Step 3: Create the correct function using service_id (not provider_id)
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

-- Step 4: Re-create the trigger
CREATE TRIGGER trigger_update_service_rating
  AFTER INSERT OR UPDATE ON service_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_service_provider_rating();

-- Verify: show remaining triggers on service_reviews
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'service_reviews';
