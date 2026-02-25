-- ===================================================================
-- Fix RLS policies for comments table — ensure INSERT & SELECT work
-- Run in: Supabase Dashboard → SQL Editor
-- ===================================================================

-- 1. Enable RLS (idempotent — no harm if already enabled)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 2. SELECT: everyone can read approved comments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'comments_select_approved' AND tablename = 'comments'
    ) THEN
        CREATE POLICY "comments_select_approved" ON comments
            FOR SELECT USING (status = 'approved' OR is_official = true);
    END IF;
END $$;

-- 3. INSERT: anyone (anon or authenticated) can post comments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'comments_insert_anyone' AND tablename = 'comments'
    ) THEN
        CREATE POLICY "comments_insert_anyone" ON comments
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- 4. Also fix service_reviews INSERT if missing
ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'reviews_select_approved' AND tablename = 'service_reviews'
    ) THEN
        CREATE POLICY "reviews_select_approved" ON service_reviews
            FOR SELECT USING (is_approved = true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'reviews_insert_authenticated' AND tablename = 'service_reviews'
    ) THEN
        CREATE POLICY "reviews_insert_authenticated" ON service_reviews
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- 5. Quick diagnostic — shows all policies on both tables
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('comments', 'service_reviews')
ORDER BY tablename, policyname;
