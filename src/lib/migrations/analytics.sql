-- ==============================================
-- 📊 Analytics Events Table + RPC Functions
-- تشغيل هذا الكود مرة واحدة في Supabase SQL Editor
-- ==============================================

-- 1. إنشاء جدول أحداث التحليلات (أو إضافة الأعمدة الناقصة إن كان موجوداً)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id               UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at       TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
    event_name       TEXT         NOT NULL,          -- 'page_view' | 'session_end'
    page_path        TEXT,
    visitor_id       TEXT,                           -- UUID في localStorage
    session_id       TEXT,                           -- UUID في sessionStorage
    duration_seconds INTEGER,                        -- لأحداث session_end فقط
    meta             JSONB        DEFAULT '{}'::jsonb
);

-- إضافة الأعمدة الناقصة إن كان الجدول موجوداً من قبل (آمن تماماً)
ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS session_id       TEXT,
  ADD COLUMN IF NOT EXISTS visitor_id       TEXT,
  ADD COLUMN IF NOT EXISTS meta             JSONB DEFAULT '{}'::jsonb;

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name  ON public.analytics_events (event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_path   ON public.analytics_events (page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor_id  ON public.analytics_events (visitor_id);

-- تفعيل RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- السماح للزوار بالإدراج (تتبع الزيارات)
DROP POLICY IF EXISTS "allow_insert_analytics" ON public.analytics_events;
CREATE POLICY "allow_insert_analytics"
    ON public.analytics_events
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- ==============================================
-- 2. دالة إحصاءات لوحة التحكم الرئيسية
-- ==============================================
DROP FUNCTION IF EXISTS public.get_dashboard_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN json_build_object(
        -- الزوار النشطون خلال آخر 5 دقائق
        'active_users_now', (
            SELECT COUNT(DISTINCT visitor_id)
            FROM public.analytics_events
            WHERE created_at > NOW() - INTERVAL '5 minutes'
              AND event_name = 'page_view'
        ),
        -- إجمالي الزوار الفريدين (كل الوقت)
        'total_visitors_all_time', (
            SELECT COUNT(DISTINCT visitor_id)
            FROM public.analytics_events
            WHERE event_name = 'page_view'
        ),
        -- متوسط وقت الجلسة بالثواني (آخر 30 يوم، تجاهل البقاء أقل من 5 ثوانٍ أو أكثر من ساعة)
        'avg_session_duration', (
            SELECT COALESCE(ROUND(AVG(duration_seconds))::INTEGER, 0)
            FROM public.analytics_events
            WHERE event_name = 'session_end'
              AND created_at > NOW() - INTERVAL '30 days'
              AND duration_seconds BETWEEN 5 AND 3600
        ),
        -- زيارات اليوم
        'today_page_views', (
            SELECT COUNT(*)
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at::DATE = CURRENT_DATE
        ),
        -- إحصاءات المجتمع
        'total_comments', (SELECT COUNT(*) FROM public.comments WHERE status = 'approved'),
        'total_reviews',  (SELECT COUNT(*) FROM public.service_reviews),
        -- إحصاءات المحتوى
        'total_articles',  (SELECT COUNT(*) FROM public.articles  WHERE status = 'published'),
        'total_services',  (SELECT COUNT(*) FROM public.service_providers WHERE status = 'approved'),
        'total_scenarios', (SELECT COUNT(*) FROM public.consultant_scenarios WHERE is_active = true),
        'total_zones',     (SELECT COUNT(*) FROM public.zones)
    );
END;
$$;

-- ==============================================
-- 3. دالة الزيارات اليومية (آخر 30 يوم)
-- ==============================================
DROP FUNCTION IF EXISTS public.get_daily_visits() CASCADE;
CREATE OR REPLACE FUNCTION public.get_daily_visits()
RETURNS TABLE(date TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            (CURRENT_DATE - INTERVAL '29 days')::DATE,
            CURRENT_DATE::DATE,
            '1 day'::INTERVAL
        )::DATE AS day
    ),
    daily_counts AS (
        SELECT
            created_at::DATE AS day,
            COUNT(DISTINCT visitor_id) AS visits
        FROM public.analytics_events
        WHERE event_name = 'page_view'
          AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY created_at::DATE
    )
    SELECT
        TO_CHAR(ds.day, 'MM/DD') AS date,
        COALESCE(dc.visits, 0)   AS count
    FROM date_series ds
    LEFT JOIN daily_counts dc ON ds.day = dc.day
    ORDER BY ds.day ASC;
END;
$$;

-- ==============================================
-- 4. دالة أكثر الصفحات زيارة (آخر 30 يوم)
-- ==============================================
DROP FUNCTION IF EXISTS public.get_top_pages() CASCADE;
CREATE OR REPLACE FUNCTION public.get_top_pages()
RETURNS TABLE(page_path TEXT, views BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ae.page_path,
        COUNT(*) AS views
    FROM public.analytics_events ae
    WHERE ae.event_name = 'page_view'
      AND ae.page_path IS NOT NULL
      AND ae.created_at > NOW() - INTERVAL '30 days'
    GROUP BY ae.page_path
    ORDER BY views DESC
    LIMIT 10;
END;
$$;

-- ==============================================
-- 5. منح صلاحيات الاستدعاء (مطلوب في Supabase)
-- ==============================================
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_visits()    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_pages()       TO anon, authenticated;
