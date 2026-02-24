-- ===================================================================
-- Admin Activity Log — جدول + triggers لمراقبة كل نشاط الموقع
-- Run once in: Supabase Dashboard → SQL Editor
-- ===================================================================

-- 1. Create the activity log table
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,       -- 'new_member', 'new_service', 'new_comment', 'new_review'
    title TEXT NOT NULL,            -- عنوان عربي واضح
    detail TEXT,                    -- تفاصيل إضافية
    entity_id TEXT,                 -- ID الكيان المرتبط
    entity_table TEXT,              -- اسم الجدول المصدر
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON admin_activity_log(event_type);

-- 2. Enable Realtime on this table (for live feed)
ALTER PUBLICATION supabase_realtime ADD TABLE admin_activity_log;

-- 3. RLS: anyone can insert (via triggers), select is open (admin checks in app)
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_insert_activity" ON admin_activity_log
    FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_select_activity" ON admin_activity_log
    FOR SELECT USING (true);

-- ===================================================================
-- TRIGGERS
-- ===================================================================

-- A. New member registered
CREATE OR REPLACE FUNCTION log_new_member()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES (
        'new_member',
        'عضو جديد: ' || COALESCE(NEW.full_name, 'بدون اسم'),
        COALESCE((SELECT email FROM auth.users WHERE id = NEW.id), ''),
        NEW.id::TEXT,
        'member_profiles'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_member_log ON member_profiles;
CREATE TRIGGER on_new_member_log
    AFTER INSERT ON member_profiles
    FOR EACH ROW EXECUTE FUNCTION log_new_member();

-- B. New service provider added
CREATE OR REPLACE FUNCTION log_new_service()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES (
        'new_service',
        'خدمة جديدة: ' || COALESCE(NEW.name, 'بدون اسم'),
        COALESCE(NEW.category, '') || ' — ' || COALESCE(NEW.city, ''),
        NEW.id::TEXT,
        'service_providers'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_service_log ON service_providers;
CREATE TRIGGER on_new_service_log
    AFTER INSERT ON service_providers
    FOR EACH ROW EXECUTE FUNCTION log_new_service();

-- C. New comment posted
CREATE OR REPLACE FUNCTION log_new_comment()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES (
        'new_comment',
        'تعليق جديد من: ' || COALESCE(NEW.author_name, 'مجهول'),
        LEFT(COALESCE(NEW.content, ''), 100),
        NEW.id::TEXT,
        'comments'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_comment_log ON comments;
CREATE TRIGGER on_new_comment_log
    AFTER INSERT ON comments
    FOR EACH ROW EXECUTE FUNCTION log_new_comment();

-- D. New review submitted
CREATE OR REPLACE FUNCTION log_new_review()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table)
    VALUES (
        'new_review',
        'تقييم جديد: ' || NEW.rating || ' نجوم من ' || COALESCE(NEW.client_name, 'مجهول'),
        LEFT(COALESCE(NEW.comment, ''), 100),
        NEW.id::TEXT,
        'service_reviews'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_review_log ON service_reviews;
CREATE TRIGGER on_new_review_log
    AFTER INSERT ON service_reviews
    FOR EACH ROW EXECUTE FUNCTION log_new_review();
