-- ===================================================================
-- Migration: Add parent_id to comments for nested replies (threading)
-- Run this once in: Supabase Dashboard → SQL Editor
-- ===================================================================

-- 1. Add parent_id column (safe: no-op if already exists)
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- 2. Index for faster tree queries
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- 3. Ensure content_votes supports comment likes
--    (entity_type = 'comment', entity_id = comment.id, vote_type = 'up')
--    No schema change needed — content_votes already uses text entity_type.
--    Just verify the table exists (should already exist):
-- SELECT * FROM content_votes LIMIT 1;
