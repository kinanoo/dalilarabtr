-- =====================================================================
-- Fix: "تم نشر N مقالات جديدة" notification landed on /updates (news page),
--      which lists ONLY `updates` rows — never articles → empty landing.
-- Run once in: Supabase Dashboard → SQL Editor
--
-- Two parts:
--   1. Replace notify_on_new_content(): grouped ARTICLE notifications now
--      link to /articles (the new latest-articles hub). Grouped UPDATE
--      notifications keep /updates (correct — news lives there).
--   2. Repoint the existing grouped-article rows already in the table so the
--      notifications the user already received work immediately.
--
-- Nothing else in the function changed. Individual (first-of-day) article
-- notifications already link to /article/<slug> and are untouched.
-- =====================================================================

-- ── 1. Replace the trigger function ──────────────────────────────────
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
        WHEN 'new_code'     THEN '/codes/' || COALESCE(NEW.entity_id, '')
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
                    -- FIX: articles → /articles hub (news page lists only
                    -- `updates`, so /updates was empty of the promised articles).
                    WHEN 'new_article' THEN '/articles'
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

-- Trigger already exists (on_new_content_notify) and points at this function
-- by name, so CREATE OR REPLACE is enough — no need to re-create the trigger.

-- ── 2. Repoint existing grouped-article rows already in the table ─────
UPDATE notifications
SET link = '/articles'
WHERE type = 'article'
  AND target_user_id IS NULL
  AND group_key LIKE 'new_article_%'
  AND link = '/updates';

-- ── 3. Verify (optional) ─────────────────────────────────────────────
-- SELECT title, link, group_count FROM notifications
-- WHERE group_key LIKE 'new_article_%' ORDER BY created_at DESC LIMIT 5;
