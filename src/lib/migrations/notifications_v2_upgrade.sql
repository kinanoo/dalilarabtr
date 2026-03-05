-- =====================================================================
-- Notifications V2 — Full Upgrade Migration
-- Run in: Supabase Dashboard → SQL Editor
--
-- What this does:
--   1A. Adds is_read, group_key, group_count columns
--   1B. Creates trigger: new review → personal notification to service owner
--   1C. Creates trigger: new comment → personal notification (owner/admin/reply)
--   1D. Creates trigger: new content in admin_activity_log → global notification (with grouping)
--   1E. Updates RLS policies for personal notification filtering
--   1F. Fixes existing data
-- =====================================================================

-- ===================
-- 1A. ADD COLUMNS
-- ===================

ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS group_key TEXT;

ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS group_count INTEGER DEFAULT 1;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_personal_unread
    ON notifications(target_user_id, is_read)
    WHERE target_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_group_key
    ON notifications(group_key, created_at DESC)
    WHERE group_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_global_active
    ON notifications(created_at DESC)
    WHERE target_user_id IS NULL AND is_active = true;


-- ========================================
-- 1B. TRIGGER: Review → Service Owner
-- ========================================

CREATE OR REPLACE FUNCTION notify_on_new_review()
RETURNS TRIGGER AS $$
DECLARE
    v_owner_id UUID;
    v_service_name TEXT;
BEGIN
    -- Get the service owner
    SELECT user_id, name INTO v_owner_id, v_service_name
    FROM service_providers
    WHERE id::TEXT = NEW.service_id;

    -- Only notify if service has an owner AND reviewer is not the owner
    IF v_owner_id IS NOT NULL
       AND (NEW.user_id IS NULL OR NEW.user_id != v_owner_id)
    THEN
        INSERT INTO notifications
            (type, title, message, link, icon, priority, target_user_id, target_audience, is_active)
        VALUES (
            'review',
            'تقييم جديد على خدمتك',
            COALESCE(NEW.client_name, 'مجهول') || ' أعطى ' || NEW.rating || ' نجوم'
                || CASE
                    WHEN NEW.comment IS NOT NULL AND length(NEW.comment) > 0
                    THEN ': "' || left(NEW.comment, 80)
                         || CASE WHEN length(NEW.comment) > 80 THEN '...' ELSE '' END
                         || '"'
                    ELSE ''
                   END,
            '/services/' || NEW.service_id || '#reviews-section',
            '⭐',
            'medium',
            v_owner_id::TEXT,
            'personal',
            true
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_review_notify ON service_reviews;
CREATE TRIGGER on_new_review_notify
    AFTER INSERT ON service_reviews
    FOR EACH ROW EXECUTE FUNCTION notify_on_new_review();


-- ========================================
-- 1C. TRIGGER: Comment → Owner / Admin / Reply
-- ========================================

CREATE OR REPLACE FUNCTION notify_on_new_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_author_id UUID;
    v_admin_id UUID;
    v_service_owner_id UUID;
    v_entity_path TEXT;
    v_null_uuid UUID := '00000000-0000-0000-0000-000000000000';
    v_commenter_id UUID;
BEGIN
    v_commenter_id := COALESCE(NEW.user_id, v_null_uuid);

    -- Build the entity link
    v_entity_path := CASE NEW.entity_type
        WHEN 'article' THEN '/article/' || NEW.entity_id
        WHEN 'service' THEN '/services/' || NEW.entity_id
        WHEN 'update'  THEN '/updates/'  || NEW.entity_id
        ELSE '/'
    END || '#comments';

    -- ─── Case 1: Reply to another comment → notify parent author ───
    IF NEW.parent_id IS NOT NULL THEN
        SELECT user_id INTO v_parent_author_id
        FROM comments WHERE id = NEW.parent_id;

        IF v_parent_author_id IS NOT NULL
           AND v_parent_author_id != v_commenter_id
        THEN
            INSERT INTO notifications
                (type, title, message, link, icon, priority, target_user_id, target_audience, is_active)
            VALUES (
                'reply',
                'رد جديد على تعليقك',
                COALESCE(NEW.author_name, 'مجهول') || ' ردّ: "'
                    || left(COALESCE(NEW.content, ''), 80)
                    || CASE WHEN length(COALESCE(NEW.content, '')) > 80 THEN '...' ELSE '' END
                    || '"',
                v_entity_path,
                '💬',
                'medium',
                v_parent_author_id::TEXT,
                'personal',
                true
            );
        END IF;
    END IF;

    -- ─── Case 2: Comment on a service → notify service owner ───
    IF NEW.entity_type = 'service' THEN
        SELECT user_id INTO v_service_owner_id
        FROM service_providers WHERE id::TEXT = NEW.entity_id;

        IF v_service_owner_id IS NOT NULL
           AND v_service_owner_id != v_commenter_id
           -- Don't duplicate: if we already notified the parent author who is also the owner
           AND (v_parent_author_id IS NULL OR v_service_owner_id != v_parent_author_id)
        THEN
            INSERT INTO notifications
                (type, title, message, link, icon, priority, target_user_id, target_audience, is_active)
            VALUES (
                'comment',
                'تعليق جديد على خدمتك',
                COALESCE(NEW.author_name, 'مجهول') || ' علّق: "'
                    || left(COALESCE(NEW.content, ''), 80)
                    || CASE WHEN length(COALESCE(NEW.content, '')) > 80 THEN '...' ELSE '' END
                    || '"',
                v_entity_path,
                '🗨️',
                'medium',
                v_service_owner_id::TEXT,
                'personal',
                true
            );
        END IF;
    END IF;

    -- ─── Case 3: Top-level comment on an article → notify admin(s) ───
    IF NEW.entity_type = 'article' AND NEW.parent_id IS NULL THEN
        FOR v_admin_id IN
            SELECT id FROM member_profiles WHERE role = 'admin' LIMIT 3
        LOOP
            IF v_admin_id != v_commenter_id THEN
                INSERT INTO notifications
                    (type, title, message, link, icon, priority, target_user_id, target_audience, is_active)
                VALUES (
                    'comment',
                    'تعليق جديد على مقال',
                    COALESCE(NEW.author_name, 'مجهول') || ' علّق: "'
                        || left(COALESCE(NEW.content, ''), 80)
                        || CASE WHEN length(COALESCE(NEW.content, '')) > 80 THEN '...' ELSE '' END
                        || '"',
                    v_entity_path,
                    '🗨️',
                    'medium',
                    v_admin_id::TEXT,
                    'personal',
                    true
                );
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_comment_notify ON comments;
CREATE TRIGGER on_new_comment_notify
    AFTER INSERT ON comments
    FOR EACH ROW EXECUTE FUNCTION notify_on_new_comment();


-- ========================================================
-- 1D. TRIGGER: admin_activity_log → Global Notifications
--     (replaces the /api/public-events frontend fetch)
-- ========================================================

CREATE OR REPLACE FUNCTION notify_on_new_content()
RETURNS TRIGGER AS $$
DECLARE
    v_notif_type TEXT;
    v_icon TEXT;
    v_link TEXT;
    v_group_key TEXT;
    v_existing_id UUID;
    v_current_count INTEGER;
    v_admin_id UUID;
BEGIN
    -- ─── new_service: personal notification to admin(s), NOT global ───
    IF NEW.event_type = 'new_service' THEN
        FOR v_admin_id IN
            SELECT id FROM member_profiles WHERE role = 'admin' LIMIT 3
        LOOP
            INSERT INTO notifications
                (type, title, message, link, icon, priority, target_user_id, target_audience, is_active)
            VALUES (
                'service',
                'خدمة جديدة بحاجة مراجعة',
                COALESCE(NEW.title, 'خدمة جديدة'),
                '/admin/services',
                '💼',
                'high',
                v_admin_id::TEXT,
                'personal',
                true
            );
        END LOOP;
        RETURN NEW;
    END IF;

    -- ─── Skip non-public event types ───
    IF NEW.event_type NOT IN (
        'new_article', 'new_update', 'new_scenario',
        'new_faq', 'new_code', 'new_zone', 'new_tool', 'new_source'
    ) THEN
        RETURN NEW;
    END IF;

    -- Map event_type → notification fields
    v_notif_type := CASE NEW.event_type
        WHEN 'new_article'  THEN 'article'
        WHEN 'new_update'   THEN 'update'
        WHEN 'new_scenario' THEN 'article'
        WHEN 'new_faq'      THEN 'article'
        WHEN 'new_code'     THEN 'alert'
        WHEN 'new_zone'     THEN 'alert'
        WHEN 'new_tool'     THEN 'service'
        WHEN 'new_source'   THEN 'article'
    END;

    v_icon := CASE NEW.event_type
        WHEN 'new_article'  THEN '📄'
        WHEN 'new_update'   THEN '📰'
        WHEN 'new_scenario' THEN '🧠'
        WHEN 'new_faq'      THEN '❓'
        WHEN 'new_code'     THEN '🛡️'
        WHEN 'new_zone'     THEN '📍'
        WHEN 'new_tool'     THEN '🔧'
        WHEN 'new_source'   THEN '🔗'
    END;

    v_link := CASE NEW.event_type
        WHEN 'new_article'  THEN '/article/' || COALESCE(NEW.entity_id, '')
        WHEN 'new_update'   THEN '/updates/' || COALESCE(NEW.entity_id, '')
        WHEN 'new_scenario' THEN '/consultant?scenario=' || COALESCE(NEW.entity_id, '')
        WHEN 'new_faq'      THEN '/faq'
        WHEN 'new_code'     THEN '/security-codes'
        WHEN 'new_zone'     THEN '/zones'
        WHEN 'new_tool'     THEN '/tools'
        WHEN 'new_source'   THEN '/sources'
    END;

    -- ─── Grouping logic: articles & updates published in batches ───
    IF NEW.event_type IN ('new_article', 'new_update') THEN
        v_group_key := NEW.event_type || '_' || to_char(NOW(), 'YYYY-MM-DD');

        -- Check if a grouped notification already exists (within last 6 hours)
        SELECT id, group_count INTO v_existing_id, v_current_count
        FROM notifications
        WHERE group_key = v_group_key
          AND target_user_id IS NULL
          AND created_at > NOW() - INTERVAL '6 hours'
        ORDER BY created_at DESC
        LIMIT 1;

        IF v_existing_id IS NOT NULL THEN
            -- Increment existing group
            v_current_count := v_current_count + 1;
            UPDATE notifications
            SET group_count = v_current_count,
                title = CASE NEW.event_type
                    WHEN 'new_article' THEN 'تم نشر ' || v_current_count || ' مقالات جديدة'
                    WHEN 'new_update'  THEN 'تم نشر ' || v_current_count || ' أخبار جديدة'
                END,
                message = 'اطّلع على آخر المحتوى المنشور',
                link = CASE NEW.event_type
                    WHEN 'new_article' THEN '/'
                    WHEN 'new_update'  THEN '/updates'
                END,
                created_at = NOW()  -- Bump to top
            WHERE id = v_existing_id;

            RETURN NEW;
        END IF;
    END IF;

    -- ─── Insert new global notification ───
    INSERT INTO notifications
        (type, title, message, link, icon, priority, target_user_id, target_audience, is_active, group_key, group_count)
    VALUES (
        v_notif_type,
        COALESCE(NEW.title, 'محتوى جديد'),
        COALESCE(NEW.detail, ''),
        v_link,
        v_icon,
        'medium',
        NULL,       -- Global (broadcast to all)
        'all',
        true,
        v_group_key,
        1
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_content_notify ON admin_activity_log;
CREATE TRIGGER on_new_content_notify
    AFTER INSERT ON admin_activity_log
    FOR EACH ROW EXECUTE FUNCTION notify_on_new_content();


-- ========================================
-- 1E. RLS POLICIES
-- ========================================

-- Drop old overly-permissive policy
DROP POLICY IF EXISTS "allow_read_notifications" ON notifications;
DROP POLICY IF EXISTS "allow_read_active_notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_public_read" ON notifications;

-- New SELECT policy: see global + your own personal
CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT USING (
        is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (
            target_user_id IS NULL                          -- Global
            OR target_user_id = (auth.uid())::TEXT          -- Personal (your own)
        )
    );

-- UPDATE policy: only mark YOUR personal notifications as read
DROP POLICY IF EXISTS "notifications_update_read" ON notifications;
CREATE POLICY "notifications_update_read" ON notifications
    FOR UPDATE USING (
        target_user_id = (auth.uid())::TEXT
    ) WITH CHECK (
        target_user_id = (auth.uid())::TEXT
    );

-- Keep existing INSERT policy for triggers (SECURITY DEFINER bypasses RLS)
-- but ensure the admin insert policy still works
DROP POLICY IF EXISTS "allow_admin_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_admin_insert" ON notifications;
CREATE POLICY "notifications_admin_insert" ON notifications
    FOR INSERT WITH CHECK (true);  -- Triggers use SECURITY DEFINER, API uses service role


-- ========================================
-- 1F. FIX EXISTING DATA
-- ========================================

-- Mark old broadcast review notifications as inactive (they shouldn't have been broadcast)
UPDATE notifications
SET is_active = false
WHERE type = 'review'
  AND target_user_id IS NULL;

-- Mark old broadcast comment notifications as inactive
UPDATE notifications
SET is_active = false
WHERE type IN ('comment', 'reply')
  AND target_user_id IS NULL;

-- Ensure all existing global notifications have correct target_audience
UPDATE notifications
SET target_audience = 'all'
WHERE target_user_id IS NULL
  AND target_audience IS DISTINCT FROM 'all';

-- Ensure all existing personal notifications have correct target_audience
UPDATE notifications
SET target_audience = 'personal'
WHERE target_user_id IS NOT NULL
  AND target_audience IS DISTINCT FROM 'personal';


-- =====================================================================
-- DONE. After running this:
-- 1. New reviews → personal notification to service owner (automatic)
-- 2. New comments → personal notification to relevant user (automatic)
-- 3. New articles/updates → global notification with grouping (automatic)
-- 4. New services → personal notification to admin (automatic)
-- 5. RLS ensures users only see their own personal + all global
-- 6. Frontend can mark personal notifications as read via UPDATE
-- =====================================================================
