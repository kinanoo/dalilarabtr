-- ==============================================================================
-- 🔧 ملف شامل — شغّل هذا مرة واحدة في Supabase SQL Editor
-- يحتوي على: إصلاح RLS للبنرات + شريط الأخبار + تحليلات محسّنة
-- ==============================================================================

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  1. إصلاح RLS — جدول site_banners (البنرات)                ║
-- ╚══════════════════════════════════════════════════════════════╝

ALTER TABLE IF EXISTS public.site_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read All" ON public.site_banners;
DROP POLICY IF EXISTS "Admin Full Access" ON public.site_banners;
DROP POLICY IF EXISTS "anon_full_access_banners" ON public.site_banners;

CREATE POLICY "Public Read All"
    ON public.site_banners FOR SELECT USING (true);

CREATE POLICY "anon_full_access_banners"
    ON public.site_banners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  2. إصلاح RLS — جدول news_ticker (شريط الأخبار)           ║
-- ╚══════════════════════════════════════════════════════════════╝

ALTER TABLE IF EXISTS public.news_ticker ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read news_ticker" ON public.news_ticker;
DROP POLICY IF EXISTS "Allow authenticated insert news_ticker" ON public.news_ticker;
DROP POLICY IF EXISTS "Allow authenticated update news_ticker" ON public.news_ticker;
DROP POLICY IF EXISTS "Allow authenticated delete news_ticker" ON public.news_ticker;
DROP POLICY IF EXISTS "anon_full_access_ticker" ON public.news_ticker;

CREATE POLICY "Allow public read news_ticker"
    ON public.news_ticker FOR SELECT USING (true);

CREATE POLICY "anon_full_access_ticker"
    ON public.news_ticker FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  3. تحديث دالة الإحصاءات الرئيسية (زوار فريدين + أسبوع + شهر) ║
-- ╚══════════════════════════════════════════════════════════════╝

DROP FUNCTION IF EXISTS public.get_dashboard_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN json_build_object(
        'active_users_now', (
            SELECT COUNT(DISTINCT visitor_id)
            FROM public.analytics_events
            WHERE created_at > NOW() - INTERVAL '5 minutes'
              AND event_name = 'page_view'
        ),
        'total_visitors_all_time', (
            SELECT COUNT(DISTINCT visitor_id)
            FROM public.analytics_events
            WHERE event_name = 'page_view'
        ),
        'today_unique_visitors', (
            SELECT COUNT(DISTINCT visitor_id)
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at::DATE = CURRENT_DATE
        ),
        'today_page_views', (
            SELECT COUNT(*)
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at::DATE = CURRENT_DATE
        ),
        'week_visitors', (
            SELECT COUNT(DISTINCT visitor_id)
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at > DATE_TRUNC('week', CURRENT_DATE)
        ),
        'month_visitors', (
            SELECT COUNT(DISTINCT visitor_id)
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at > DATE_TRUNC('month', CURRENT_DATE)
        ),
        'avg_session_duration', (
            SELECT COALESCE(ROUND(AVG(duration_seconds))::INTEGER, 0)
            FROM public.analytics_events
            WHERE event_name = 'session_end'
              AND created_at > NOW() - INTERVAL '30 days'
              AND duration_seconds BETWEEN 5 AND 3600
        ),
        'total_comments', (SELECT COUNT(*) FROM public.comments WHERE status = 'approved'),
        'total_reviews',  (SELECT COUNT(*) FROM public.service_reviews),
        'total_articles',  (SELECT COUNT(*) FROM public.articles  WHERE status = 'published'),
        'total_services',  (SELECT COUNT(*) FROM public.service_providers WHERE status = 'approved'),
        'total_scenarios', (SELECT COUNT(*) FROM public.consultant_scenarios WHERE is_active = true),
        'total_zones',     (SELECT COUNT(*) FROM public.zones)
    );
END;
$$;

-- إعادة إنشاء get_daily_visits (لا تتأثر، لكن نعيدها بأمان)
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

-- إعادة إنشاء get_top_pages
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

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  4. دوال التحليلات المتقدمة (أجهزة + دول + مصادر + متصفحات) ║
-- ╚══════════════════════════════════════════════════════════════╝

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

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  5. منح الصلاحيات لجميع الدوال                             ║
-- ╚══════════════════════════════════════════════════════════════╝

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_visits()    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_pages()       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_device_stats()    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_country_stats()   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_referrer_stats()  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_browser_stats()   TO anon, authenticated;

-- ==============================================================================
-- ✅ انتهى! جميع الإصلاحات تم تطبيقها.
-- ==============================================================================
