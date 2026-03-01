-- =====================================================
-- Phase 3 Audit Fixes
-- Run this in Supabase SQL Editor
-- =====================================================


-- =====================================================
-- 1. CRITICAL: Lock down admin_activity_log RLS
--    Current: USING(true) = anyone with anon key can read
--    Fix: Only authenticated admins can read
-- =====================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "allow_insert_activity" ON admin_activity_log;
DROP POLICY IF EXISTS "allow_select_activity" ON admin_activity_log;
DROP POLICY IF EXISTS "allow_delete_activity" ON admin_activity_log;

-- Only admins can SELECT
CREATE POLICY "admin_select_activity" ON admin_activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM member_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- No INSERT/DELETE policies needed:
-- Triggers use SECURITY DEFINER which bypasses RLS entirely


-- =====================================================
-- 2. CRITICAL: Remove/deactivate fake test services
--    6 services with test UUIDs and fake phone numbers
-- =====================================================

DELETE FROM service_providers WHERE id IN (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16'
);


-- =====================================================
-- 3. CRITICAL: Scrub existing email data from activity log
--    log_new_member() stores real emails in detail column
-- =====================================================

-- Remove emails from existing records
UPDATE admin_activity_log
SET detail = NULL
WHERE event_type = 'new_member' AND detail LIKE '%@%';

-- Fix the trigger function to NOT store email anymore
CREATE OR REPLACE FUNCTION log_new_member()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES (
        'new_member',
        'عضو جديد: ' || COALESCE(NEW.full_name, 'بدون اسم'),
        NULL,  -- Never store email in activity log
        NEW.id::TEXT,
        'member_profiles'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- 4. Fix rating_avg trigger to also fire on UPDATE
--    (reviews might get approved later)
-- =====================================================

DROP TRIGGER IF EXISTS update_rating_on_review ON service_reviews;
CREATE TRIGGER update_rating_on_review
    AFTER INSERT OR UPDATE OR DELETE ON service_reviews
    FOR EACH ROW EXECUTE FUNCTION update_service_rating();


-- =====================================================
-- 5. Drop unused site_updates table (code now uses 'updates')
-- =====================================================

DROP TABLE IF EXISTS site_updates CASCADE;


-- =====================================================
-- 6. Verify: show results
-- =====================================================

-- Check fake services are gone
SELECT count(*) AS remaining_test_services
FROM service_providers
WHERE id IN (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16'
);

-- Check RLS policies on admin_activity_log
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'admin_activity_log';
