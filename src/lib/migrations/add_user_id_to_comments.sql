-- ===================================================================
-- Add user_id to comments table + RLS for edit/delete own comments
-- Run in: Supabase Dashboard → SQL Editor
-- ===================================================================

-- A. Add user_id column (nullable — anonymous comments won't have it)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- B. Index for fast lookup of user's own comments
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id) WHERE user_id IS NOT NULL;

-- C. RLS policies for update/delete own comments
-- Allow authenticated users to update their own comments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'users_update_own_comments' AND tablename = 'comments'
    ) THEN
        CREATE POLICY "users_update_own_comments" ON comments
            FOR UPDATE USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Allow authenticated users to delete their own comments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'users_delete_own_comments' AND tablename = 'comments'
    ) THEN
        CREATE POLICY "users_delete_own_comments" ON comments
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- D. RLS policies for update/delete own reviews
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'users_update_own_reviews' AND tablename = 'service_reviews'
    ) THEN
        CREATE POLICY "users_update_own_reviews" ON service_reviews
            FOR UPDATE USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'users_delete_own_reviews' AND tablename = 'service_reviews'
    ) THEN
        CREATE POLICY "users_delete_own_reviews" ON service_reviews
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
