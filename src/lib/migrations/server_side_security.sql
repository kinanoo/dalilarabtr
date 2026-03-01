-- =====================================================
-- Server-Side Security Enhancements
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Admin Login Rate Limiting Table
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT NOT NULL,
    email TEXT,
    success BOOLEAN DEFAULT false,
    attempted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;
-- No policies = no public access. Only service_role key can read/write.

-- Index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time
    ON admin_login_attempts (ip_address, success, attempted_at DESC);

-- Auto-cleanup: delete records older than 24 hours on every insert
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


-- 2. Voting System — Server-Side Deduplication
-- =====================================================

-- Add visitor_id column for tracking who voted
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
-- Only enforced when visitor_id is provided (old records without it are unaffected)
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_votes_unique_vote
    ON content_votes (entity_type, entity_id, visitor_id)
    WHERE visitor_id IS NOT NULL;
