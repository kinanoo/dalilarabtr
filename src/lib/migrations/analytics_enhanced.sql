-- ==============================================
-- 📊 Enhanced Analytics RPC Functions
-- تشغيل هذا الكود مرة واحدة في Supabase SQL Editor
-- ==============================================

-- 1. تحديث دالة الإحصاءات الرئيسية (إضافة today_unique, week, month)
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
        -- زوار اليوم (فريدين)
        'today_unique_visitors', (
            SELECT COUNT(DISTINCT visitor_id)
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at::DATE = CURRENT_DATE
        ),
        -- زيارات اليوم (صفحات)
        'today_page_views', (
            SELECT COUNT(*)
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at::DATE = CURRENT_DATE
        ),
        -- زوار هذا الأسبوع
        'week_visitors', (
            SELECT COUNT(DISTINCT visitor_id)
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at > DATE_TRUNC('week', CURRENT_DATE)
        ),
        -- زوار هذا الشهر
        'month_visitors', (
            SELECT COUNT(DISTINCT visitor_id)
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at > DATE_TRUNC('month', CURRENT_DATE)
        ),
        -- متوسط وقت الجلسة بالثواني (آخر 30 يوم)
        'avg_session_duration', (
            SELECT COALESCE(ROUND(AVG(duration_seconds))::INTEGER, 0)
            FROM public.analytics_events
            WHERE event_name = 'session_end'
              AND created_at > NOW() - INTERVAL '30 days'
              AND duration_seconds BETWEEN 5 AND 3600
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
-- 2. دالة توزيع الأجهزة (آخر 30 يوم)
-- ==============================================
CREATE OR REPLACE FUNCTION public.get_device_stats()
RETURNS TABLE(device TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(ae.meta->>'device', 'unknown') AS device,
        COUNT(DISTINCT ae.visitor_id) AS count
    FROM public.analytics_events ae
    WHERE ae.event_name = 'page_view'
      AND ae.created_at > NOW() - INTERVAL '30 days'
      AND ae.meta->>'device' IS NOT NULL
    GROUP BY ae.meta->>'device'
    ORDER BY count DESC;
END;
$$;

-- ==============================================
-- 3. دالة توزيع الدول (آخر 30 يوم)
-- ==============================================
CREATE OR REPLACE FUNCTION public.get_country_stats()
RETURNS TABLE(country TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(ae.meta->>'country', 'Unknown') AS country,
        COUNT(DISTINCT ae.visitor_id) AS count
    FROM public.analytics_events ae
    WHERE ae.event_name = 'page_view'
      AND ae.created_at > NOW() - INTERVAL '30 days'
      AND ae.meta->>'country' IS NOT NULL
      AND ae.meta->>'country' != 'Unknown'
    GROUP BY ae.meta->>'country'
    ORDER BY count DESC
    LIMIT 15;
END;
$$;

-- ==============================================
-- 4. دالة مصادر الزيارات (آخر 30 يوم)
-- ==============================================
CREATE OR REPLACE FUNCTION public.get_referrer_stats()
RETURNS TABLE(source TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN ae.meta->>'referrer' IS NULL OR ae.meta->>'referrer' = '' THEN 'direct'
            WHEN ae.meta->>'referrer' LIKE '%google%' THEN 'google'
            WHEN ae.meta->>'referrer' LIKE '%bing%' THEN 'bing'
            WHEN ae.meta->>'referrer' LIKE '%yandex%' THEN 'yandex'
            WHEN ae.meta->>'referrer' LIKE '%facebook%' OR ae.meta->>'referrer' LIKE '%fb.%' THEN 'facebook'
            WHEN ae.meta->>'referrer' LIKE '%instagram%' THEN 'instagram'
            WHEN ae.meta->>'referrer' LIKE '%twitter%' OR ae.meta->>'referrer' LIKE '%t.co%' THEN 'twitter'
            WHEN ae.meta->>'referrer' LIKE '%whatsapp%' OR ae.meta->>'referrer' LIKE '%wa.me%' THEN 'whatsapp'
            WHEN ae.meta->>'referrer' LIKE '%telegram%' OR ae.meta->>'referrer' LIKE '%t.me%' THEN 'telegram'
            WHEN ae.meta->>'referrer' LIKE '%youtube%' THEN 'youtube'
            WHEN ae.meta->>'referrer' LIKE '%tiktok%' THEN 'tiktok'
            WHEN ae.meta->>'referrer' LIKE '%reddit%' THEN 'reddit'
            ELSE 'other'
        END AS source,
        COUNT(*) AS count
    FROM public.analytics_events ae
    WHERE ae.event_name = 'page_view'
      AND ae.created_at > NOW() - INTERVAL '30 days'
    GROUP BY source
    ORDER BY count DESC;
END;
$$;

-- ==============================================
-- 5. دالة توزيع المتصفحات (آخر 30 يوم)
-- ==============================================
CREATE OR REPLACE FUNCTION public.get_browser_stats()
RETURNS TABLE(browser TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(ae.meta->>'browser', 'Unknown') AS browser,
        COUNT(DISTINCT ae.visitor_id) AS count
    FROM public.analytics_events ae
    WHERE ae.event_name = 'page_view'
      AND ae.created_at > NOW() - INTERVAL '30 days'
      AND ae.meta->>'browser' IS NOT NULL
    GROUP BY ae.meta->>'browser'
    ORDER BY count DESC;
END;
$$;

-- ==============================================
-- 6. منح صلاحيات الاستدعاء
-- ==============================================
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_visits()    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_pages()       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_device_stats()    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_country_stats()   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_referrer_stats()  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_browser_stats()   TO anon, authenticated;
