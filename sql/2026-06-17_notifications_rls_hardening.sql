-- =====================================================================
-- NOTIFICATIONS RLS HARDENING — 2026-06-17
-- =====================================================================
-- Forensic audit found the existing notifications_select_policy looser
-- than the comment suggests: when auth.uid() is NULL (unauthenticated
-- caller), the policy still tests `target_user_id = (auth.uid())::TEXT`.
-- If a future code path or a bug renders any personal notification
-- whose target_user_id happens to match the same NULL coercion,
-- unauthenticated users could be served personal payloads they were
-- never meant to see.
--
-- Fix: make the personal-notification clause explicit about the
-- "auth.uid() IS NOT NULL" precondition. Global notifications stay
-- public (target_user_id IS NULL) as before.
--
-- Safe to re-run: DROP IF EXISTS + CREATE.
-- =====================================================================

DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;

CREATE POLICY "notifications_select_policy" ON public.notifications
    FOR SELECT
    USING (
        is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (
            -- Global notification: target_user_id IS NULL — visible to
            -- everyone, including anonymous visitors.
            target_user_id IS NULL
            OR
            -- Personal notification: caller MUST be authenticated AND the
            -- target id must match. The explicit IS NOT NULL guard
            -- prevents an unauthenticated caller (auth.uid() = NULL)
            -- from accidentally satisfying the equality through SQL
            -- NULL semantics.
            (
                auth.uid() IS NOT NULL
                AND target_user_id = (auth.uid())::TEXT
            )
        )
    );

-- =====================================================================
-- Verify
-- =====================================================================
SELECT polname, polcmd
FROM pg_policy
WHERE polrelid = 'public.notifications'::regclass
  AND polname = 'notifications_select_policy';
