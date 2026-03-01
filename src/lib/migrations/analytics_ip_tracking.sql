-- ===================================================================
-- Analytics IP Tracking — Add IP hash + geolocation columns
-- ===================================================================
-- Adds ip_hash, ip_country, ip_city columns to analytics_events
-- Updates ALL RPC functions to use ip_hash for unique visitor counts
-- and ip_country for accurate country stats
-- Run in: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ===================================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Add new columns (safe — IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS ip_hash    TEXT,
  ADD COLUMN IF NOT EXISTS ip_country TEXT,
  ADD COLUMN IF NOT EXISTS ip_city    TEXT;

-- Index for fast IP-based unique counts
CREATE INDEX IF NOT EXISTS idx_analytics_ip_hash    ON public.analytics_events (ip_hash);
CREATE INDEX IF NOT EXISTS idx_analytics_ip_country ON public.analytics_events (ip_country);

-- ─────────────────────────────────────────────────────────────
-- 2. Update get_dashboard_stats() — use ip_hash for unique counts
-- ─────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_dashboard_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN json_build_object(
        -- Active now (last 5 min) — prefer ip_hash, fallback to visitor_id
        'active_users_now', (
            SELECT COUNT(DISTINCT COALESCE(ip_hash, visitor_id))
            FROM public.analytics_events
            WHERE created_at > NOW() - INTERVAL '5 minutes'
              AND event_name = 'page_view'
        ),
        -- Total unique (all time)
        'total_visitors_all_time', (
            SELECT COUNT(DISTINCT COALESCE(ip_hash, visitor_id))
            FROM public.analytics_events
            WHERE event_name = 'page_view'
        ),
        -- Today unique
        'today_unique_visitors', (
            SELECT COUNT(DISTINCT COALESCE(ip_hash, visitor_id))
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at::DATE = CURRENT_DATE
        ),
        -- Today page views (total, not unique)
        'today_page_views', (
            SELECT COUNT(*)
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at::DATE = CURRENT_DATE
        ),
        -- This week unique
        'week_visitors', (
            SELECT COUNT(DISTINCT COALESCE(ip_hash, visitor_id))
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at > DATE_TRUNC('week', CURRENT_DATE)
        ),
        -- This month unique
        'month_visitors', (
            SELECT COUNT(DISTINCT COALESCE(ip_hash, visitor_id))
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at > DATE_TRUNC('month', CURRENT_DATE)
        ),
        -- Avg session duration (last 30 days)
        'avg_session_duration', (
            SELECT COALESCE(ROUND(AVG(duration_seconds))::INTEGER, 0)
            FROM public.analytics_events
            WHERE event_name = 'session_end'
              AND created_at > NOW() - INTERVAL '30 days'
              AND duration_seconds BETWEEN 5 AND 3600
        ),
        -- Community stats
        'total_comments', (SELECT COUNT(*) FROM public.comments WHERE status = 'approved'),
        'total_reviews',  (SELECT COUNT(*) FROM public.service_reviews),
        -- Content stats
        'total_articles',  (SELECT COUNT(*) FROM public.articles  WHERE status = 'published'),
        'total_services',  (SELECT COUNT(*) FROM public.service_providers WHERE status = 'approved'),
        'total_scenarios', (SELECT COUNT(*) FROM public.consultant_scenarios WHERE is_active = true),
        'total_zones',     (SELECT COUNT(*) FROM public.zones)
    );
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. Update get_daily_visits() — use ip_hash
-- ─────────────────────────────────────────────────────────────
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
            COUNT(DISTINCT COALESCE(ip_hash, visitor_id)) AS visits
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

-- ─────────────────────────────────────────────────────────────
-- 4. Update get_top_pages()
-- ─────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────
-- 5. Update get_device_stats() — use ip_hash
-- ─────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_device_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.get_device_stats()
RETURNS TABLE(device TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(ae.meta->>'device', 'unknown') AS device,
        COUNT(DISTINCT COALESCE(ae.ip_hash, ae.visitor_id)) AS count
    FROM public.analytics_events ae
    WHERE ae.event_name = 'page_view'
      AND ae.created_at > NOW() - INTERVAL '30 days'
      AND ae.meta->>'device' IS NOT NULL
    GROUP BY ae.meta->>'device'
    ORDER BY count DESC;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 6. Update get_country_stats() — use ip_country (accurate!)
-- ─────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_country_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.get_country_stats()
RETURNS TABLE(country TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Prefer ip_country (from Vercel geo headers), fallback to timezone-based
        COALESCE(
            NULLIF(ae.ip_country, ''),
            ae.meta->>'tz_country',
            ae.meta->>'country',
            'Unknown'
        ) AS country,
        COUNT(DISTINCT COALESCE(ae.ip_hash, ae.visitor_id)) AS count
    FROM public.analytics_events ae
    WHERE ae.event_name = 'page_view'
      AND ae.created_at > NOW() - INTERVAL '30 days'
    GROUP BY country
    HAVING COALESCE(
            NULLIF(ae.ip_country, ''),
            ae.meta->>'tz_country',
            ae.meta->>'country',
            'Unknown'
        ) != 'Unknown'
    ORDER BY count DESC
    LIMIT 15;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 7. Update get_referrer_stats()
-- ─────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_referrer_stats() CASCADE;
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

-- ─────────────────────────────────────────────────────────────
-- 8. Update get_browser_stats() — use ip_hash
-- ─────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_browser_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.get_browser_stats()
RETURNS TABLE(browser TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(ae.meta->>'browser', 'Unknown') AS browser,
        COUNT(DISTINCT COALESCE(ae.ip_hash, ae.visitor_id)) AS count
    FROM public.analytics_events ae
    WHERE ae.event_name = 'page_view'
      AND ae.created_at > NOW() - INTERVAL '30 days'
      AND ae.meta->>'browser' IS NOT NULL
    GROUP BY ae.meta->>'browser'
    ORDER BY count DESC;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 9. NEW: City stats (top 15 cities)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_city_stats()
RETURNS TABLE(city TEXT, country TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ae.ip_city AS city,
        ae.ip_country AS country,
        COUNT(DISTINCT COALESCE(ae.ip_hash, ae.visitor_id)) AS count
    FROM public.analytics_events ae
    WHERE ae.event_name = 'page_view'
      AND ae.created_at > NOW() - INTERVAL '30 days'
      AND ae.ip_city IS NOT NULL
      AND ae.ip_city != ''
    GROUP BY ae.ip_city, ae.ip_country
    ORDER BY count DESC
    LIMIT 15;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 10. Grant permissions
-- ─────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_visits()    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_pages()       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_device_stats()    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_country_stats()   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_referrer_stats()  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_browser_stats()   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_city_stats()      TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 11. Verify
-- ─────────────────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'analytics_events'
  AND column_name IN ('ip_hash', 'ip_country', 'ip_city')
ORDER BY column_name;
