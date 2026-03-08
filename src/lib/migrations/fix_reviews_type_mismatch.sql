-- ===================================================================
-- Fix: service_reviews type mismatch (text vs uuid)
-- Run ONCE in: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ===================================================================

-- 1. Fix the trigger function — cast service_id to uuid
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
  WHERE id::text = NEW.service_id::text;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Fix RLS policies that compare auth.uid() (uuid) with user_id (text)
DROP POLICY IF EXISTS "users_update_own_reviews" ON service_reviews;
DROP POLICY IF EXISTS "users_delete_own_reviews" ON service_reviews;

CREATE POLICY "users_update_own_reviews" ON service_reviews
    FOR UPDATE USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "users_delete_own_reviews" ON service_reviews
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Done! Reviews should work now.
