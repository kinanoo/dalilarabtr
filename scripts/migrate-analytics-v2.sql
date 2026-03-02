-- =====================================================
-- Analytics V2: Content Performance + Period Comparison + Spike Detection
-- Run this in Supabase SQL Editor
-- =====================================================

-- ─── 1. get_content_performance() ──────────────────────
-- Returns top 15 articles by page views (last 30 days)
-- with avg session duration and comment count
CREATE OR REPLACE FUNCTION public.get_content_performance()
RETURNS TABLE(
    article_id TEXT,
    title TEXT,
    slug TEXT,
    page_views BIGINT,
    avg_duration INTEGER,
    comment_count BIGINT,
    published_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH article_views AS (
        -- Count page_view events for article paths in last 30 days
        SELECT
            REPLACE(ae.page_path, '/article/', '') AS matched_slug,
            COUNT(*) AS views
        FROM analytics_events ae
        WHERE ae.event_name = 'page_view'
          AND ae.page_path LIKE '/article/%'
          AND ae.created_at > NOW() - INTERVAL '30 days'
        GROUP BY matched_slug
    ),
    article_durations AS (
        -- Average duration from session_end events for article paths
        SELECT
            REPLACE(ae.page_path, '/article/', '') AS matched_slug,
            COALESCE(AVG(ae.duration_seconds)::INTEGER, 0) AS avg_dur
        FROM analytics_events ae
        WHERE ae.event_name = 'session_end'
          AND ae.page_path LIKE '/article/%'
          AND ae.duration_seconds > 0
          AND ae.created_at > NOW() - INTERVAL '30 days'
        GROUP BY matched_slug
    ),
    article_comments AS (
        -- Count approved comments per article
        SELECT
            c.entity_id AS eid,
            COUNT(*) AS cnt
        FROM comments c
        WHERE c.entity_type = 'article'
          AND c.status = 'approved'
        GROUP BY c.entity_id
    )
    SELECT
        a.id AS article_id,
        a.title,
        COALESCE(a.slug, a.id) AS slug,
        COALESCE(av.views, 0) AS page_views,
        COALESCE(ad.avg_dur, 0) AS avg_duration,
        COALESCE(ac.cnt, 0) AS comment_count,
        a.created_at AS published_at
    FROM articles a
    LEFT JOIN article_views av ON (av.matched_slug = a.slug OR av.matched_slug = a.id)
    LEFT JOIN article_durations ad ON (ad.matched_slug = a.slug OR ad.matched_slug = a.id)
    LEFT JOIN article_comments ac ON (ac.eid = a.id)
    WHERE a.is_active = TRUE
      AND COALESCE(av.views, 0) > 0
    ORDER BY COALESCE(av.views, 0) DESC
    LIMIT 15;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_content_performance() TO anon, authenticated;


-- ─── 2. get_period_comparison() ────────────────────────
-- Compares this week vs last week (visitors, views, avg duration)
CREATE OR REPLACE FUNCTION public.get_period_comparison()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    tw_visitors BIGINT;
    lw_visitors BIGINT;
    tw_views BIGINT;
    lw_views BIGINT;
    tw_duration INTEGER;
    lw_duration INTEGER;
    v_change INTEGER;
    vw_change INTEGER;
    d_change INTEGER;
BEGIN
    -- This week: from start of current week (Monday) to now
    SELECT
        COUNT(DISTINCT COALESCE(ip_hash, visitor_id)),
        COUNT(*)
    INTO tw_visitors, tw_views
    FROM analytics_events
    WHERE event_name = 'page_view'
      AND created_at >= date_trunc('week', NOW());

    -- Last week: Monday to Sunday of previous week
    SELECT
        COUNT(DISTINCT COALESCE(ip_hash, visitor_id)),
        COUNT(*)
    INTO lw_visitors, lw_views
    FROM analytics_events
    WHERE event_name = 'page_view'
      AND created_at >= date_trunc('week', NOW()) - INTERVAL '7 days'
      AND created_at < date_trunc('week', NOW());

    -- Avg duration this week
    SELECT COALESCE(AVG(duration_seconds)::INTEGER, 0) INTO tw_duration
    FROM analytics_events
    WHERE event_name = 'session_end'
      AND duration_seconds > 0
      AND created_at >= date_trunc('week', NOW());

    -- Avg duration last week
    SELECT COALESCE(AVG(duration_seconds)::INTEGER, 0) INTO lw_duration
    FROM analytics_events
    WHERE event_name = 'session_end'
      AND duration_seconds > 0
      AND created_at >= date_trunc('week', NOW()) - INTERVAL '7 days'
      AND created_at < date_trunc('week', NOW());

    -- Calculate percentage changes (avoid division by zero)
    v_change := CASE WHEN lw_visitors > 0 THEN ROUND(((tw_visitors - lw_visitors)::NUMERIC / lw_visitors) * 100) ELSE 0 END;
    vw_change := CASE WHEN lw_views > 0 THEN ROUND(((tw_views - lw_views)::NUMERIC / lw_views) * 100) ELSE 0 END;
    d_change := CASE WHEN lw_duration > 0 THEN ROUND(((tw_duration - lw_duration)::NUMERIC / lw_duration) * 100) ELSE 0 END;

    result := json_build_object(
        'this_week_visitors', tw_visitors,
        'last_week_visitors', lw_visitors,
        'visitors_change_pct', v_change,
        'this_week_views', tw_views,
        'last_week_views', lw_views,
        'views_change_pct', vw_change,
        'this_week_avg_duration', tw_duration,
        'last_week_avg_duration', lw_duration,
        'duration_change_pct', d_change
    );

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_period_comparison() TO anon, authenticated;


-- ─── 3. get_spike_metrics() ────────────────────────────
-- Detects if current traffic is spiking (> 2x average hourly)
CREATE OR REPLACE FUNCTION public.get_spike_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    v_active_now BIGINT;
    v_avg_hourly NUMERIC;
    v_is_spiking BOOLEAN;
    v_spike_pct INTEGER;
BEGIN
    -- Active visitors in last 5 minutes
    SELECT COUNT(DISTINCT COALESCE(ip_hash, visitor_id)) INTO v_active_now
    FROM analytics_events
    WHERE event_name = 'page_view'
      AND created_at > NOW() - INTERVAL '5 minutes';

    -- Average unique visitors per hour over last 30 days
    SELECT COALESCE(AVG(hourly_count), 0) INTO v_avg_hourly
    FROM (
        SELECT
            date_trunc('hour', created_at) AS hr,
            COUNT(DISTINCT COALESCE(ip_hash, visitor_id)) AS hourly_count
        FROM analytics_events
        WHERE event_name = 'page_view'
          AND created_at > NOW() - INTERVAL '30 days'
          AND created_at <= NOW() - INTERVAL '1 hour'
        GROUP BY hr
    ) hourly_stats;

    -- Is spiking: current rate projected to hourly is > 2x average
    -- (active_now is 5-min window, so multiply by 12 for hourly estimate)
    v_is_spiking := CASE
        WHEN v_avg_hourly > 0 THEN (v_active_now * 12) > (v_avg_hourly * 2)
        ELSE FALSE
    END;

    v_spike_pct := CASE
        WHEN v_avg_hourly > 0 THEN ROUND(((v_active_now * 12 - v_avg_hourly) / v_avg_hourly) * 100)
        ELSE 0
    END;

    result := json_build_object(
        'active_now', v_active_now,
        'avg_hourly_30d', ROUND(v_avg_hourly),
        'is_spiking', v_is_spiking,
        'spike_pct', v_spike_pct
    );

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_spike_metrics() TO anon, authenticated;


-- =====================================================
-- ✅ Done! 3 RPCs created:
--   1. get_content_performance() — top 15 articles by views
--   2. get_period_comparison()   — this week vs last week
--   3. get_spike_metrics()       — real-time spike detection
-- =====================================================
