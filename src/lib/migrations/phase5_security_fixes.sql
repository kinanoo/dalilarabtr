-- ===================================================================
-- Phase 5: Security Fixes
-- ===================================================================
-- 1. Drop open INSERT policy on admin_activity_log
-- 2. Fix tools_registry keys with leading dash
-- Run in: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ===================================================================


-- ─────────────────────────────────────────────────────────────
-- 1. Activity Log — remove open INSERT policy
--    Triggers use SECURITY DEFINER → bypass RLS → no policy needed
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_insert_activity_log" ON admin_activity_log;
DROP POLICY IF EXISTS "allow_insert_activity" ON admin_activity_log;


-- ─────────────────────────────────────────────────────────────
-- 2. Fix tools_registry keys with leading dash (e.g. "-ban-calculator")
--    Delete duplicates first (keep the correct one without dash)
-- ─────────────────────────────────────────────────────────────
DELETE FROM tools_registry
WHERE key LIKE '-%'
  AND LTRIM(key, '-') IN (SELECT key FROM tools_registry WHERE key NOT LIKE '-%');

-- Now fix any remaining entries that have a dash but no correct duplicate
UPDATE tools_registry
SET key = LTRIM(key, '-')
WHERE key LIKE '-%';


-- ─────────────────────────────────────────────────────────────
-- Verify
-- ─────────────────────────────────────────────────────────────

-- Activity log: should only show admin_read_activity_log (SELECT)
SELECT 'activity_log_policies' AS check_name, policyname, cmd
FROM pg_policies
WHERE tablename = 'admin_activity_log';

-- Tools: no keys should start with '-'
SELECT 'tools_keys' AS check_name, key, name
FROM tools_registry
ORDER BY key;
