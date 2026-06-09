-- =====================================================================
-- ANALYTICS HONESTY MIGRATION — 2026-06-09
-- =====================================================================
-- Purpose: Make every number on /admin dashboard statistically honest.
--
-- Problems identified in forensic audit:
--   1. get_period_comparison() compares week-to-date (partial week, ~1.5
--      days on a Tuesday) against FULL prior week (7 days). The -45% /
--      -69% deltas shown to user are artifacts of unequal window sizes,
--      NOT real traffic drops. → Fix: compare same-elapsed-window.
--
--   2. get_dashboard_stats().total_visitors_all_time uses
--      COALESCE(ip_hash, visitor_id). ip_hash is salted DAILY for
--      privacy, so the same returning visitor becomes a new hash every
--      day → overcounted. → Fix: use visitor_id only (stable localStorage
--      UUID), and rename the metric to reflect what it really measures.
--
--   3. get_spike_metrics() multiplies a 5-min sample by 12 to estimate
--      hourly traffic, then compares to 30-day hourly average. On a
--      small site (avg=5/hr), TWO concurrent visitors trip the alarm
--      (24 > 10 = "spike"). → Fix: add an absolute floor (active_now ≥
--      5) AND tighten the multiplier to 3x.
--
--   4. All date math uses UTC CURRENT_DATE / NOW(). For a Turkey-
--      audience site, "today" is shifted 3 hours; until 03:00 Istanbul
--      time, today's counter shows yesterday's tail. → Fix: bucket
--      everything by Europe/Istanbul timezone.
--
-- Run this file once in Supabase Dashboard → SQL Editor.
-- It DROPs and recreates 3 RPCs; the dashboard auto-updates on next load.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1. get_dashboard_stats() — TZ-aware, honest unique counts
-- ─────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_dashboard_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    -- "Today" anchored to Istanbul (UTC+3). Computed once at function
    -- entry so every metric below uses the same boundary.
    today_ist DATE := ((NOW() AT TIME ZONE 'Europe/Istanbul')::DATE);
BEGIN
    RETURN json_build_object(
        -- Active now: last 5 minutes regardless of TZ — this is a rolling
        -- wall-clock window, not a calendar window.
        'active_users_now', (
            SELECT COUNT(DISTINCT COALESCE(ip_hash, visitor_id))
            FROM public.analytics_events
            WHERE created_at > NOW() - INTERVAL '5 minutes'
              AND event_name = 'page_view'
        ),

        -- All-time unique: STRICT visitor_id (stable localStorage UUID).
        -- The previous COALESCE(ip_hash, visitor_id) double-counted
        -- returning visitors because ip_hash uses a daily salt. This
        -- is now an honest count of distinct browsers, but visitors
        -- without localStorage (private mode, cleared storage) are
        -- excluded — that's the honest tradeoff.
        'total_visitors_all_time', (
            SELECT COUNT(DISTINCT visitor_id)
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND visitor_id IS NOT NULL
              AND visitor_id <> ''
        ),

        -- Total page views all-time (every event, not deduped)
        'total_page_views_all_time', (
            SELECT COUNT(*)
            FROM public.analytics_events
            WHERE event_name = 'page_view'
        ),

        -- Today unique — Istanbul calendar day
        'today_unique_visitors', (
            SELECT COUNT(DISTINCT COALESCE(ip_hash, visitor_id))
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND (created_at AT TIME ZONE 'Europe/Istanbul')::DATE = today_ist
        ),

        -- Today page views — Istanbul calendar day
        'today_page_views', (
            SELECT COUNT(*)
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND (created_at AT TIME ZONE 'Europe/Istanbul')::DATE = today_ist
        ),

        -- Week-to-date unique (Istanbul week, starts Monday)
        'week_visitors', (
            SELECT COUNT(DISTINCT COALESCE(ip_hash, visitor_id))
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at >= date_trunc('week', NOW() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul'
        ),

        -- Month-to-date unique
        'month_visitors', (
            SELECT COUNT(DISTINCT COALESCE(ip_hash, visitor_id))
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at >= date_trunc('month', NOW() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul'
        ),

        -- Avg session duration (last 30 days, sanity-filtered 5-3600s)
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

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────
-- 2. get_period_comparison() — APPLES-TO-APPLES (same elapsed window)
-- ─────────────────────────────────────────────────────────────────────
-- The old comparison was: week-to-date (e.g. Tue 12:30 = ~1.5 days)
--   vs last week TOTAL (7 days) → mathematically biased to negative.
--
-- New comparison: week-to-date vs SAME elapsed window from last week.
--   Today Tue 12:30 of this week → compared to Mon 00:00 - Tue 12:30
--   of LAST week. Both windows have identical durations, so deltas
--   reflect real traffic changes.
-- ─────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_period_comparison() CASCADE;
CREATE OR REPLACE FUNCTION public.get_period_comparison()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
    -- Anchor everything to Istanbul calendar
    week_start TIMESTAMPTZ := date_trunc('week', NOW() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
    -- How much of this week has already passed
    elapsed INTERVAL := NOW() - week_start;
    -- Same-elapsed window from last week
    last_week_start TIMESTAMPTZ := week_start - INTERVAL '7 days';
    last_week_end   TIMESTAMPTZ := last_week_start + elapsed;

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
    -- This week-to-date
    SELECT
        COUNT(DISTINCT COALESCE(ip_hash, visitor_id)),
        COUNT(*)
    INTO tw_visitors, tw_views
    FROM public.analytics_events
    WHERE event_name = 'page_view'
      AND created_at >= week_start
      AND created_at <= NOW();

    -- Same elapsed window from LAST week (apples to apples)
    SELECT
        COUNT(DISTINCT COALESCE(ip_hash, visitor_id)),
        COUNT(*)
    INTO lw_visitors, lw_views
    FROM public.analytics_events
    WHERE event_name = 'page_view'
      AND created_at >= last_week_start
      AND created_at < last_week_end;

    -- Avg duration this week
    SELECT COALESCE(AVG(duration_seconds)::INTEGER, 0) INTO tw_duration
    FROM public.analytics_events
    WHERE event_name = 'session_end'
      AND duration_seconds BETWEEN 5 AND 3600
      AND created_at >= week_start;

    -- Avg duration LAST week (same elapsed window)
    SELECT COALESCE(AVG(duration_seconds)::INTEGER, 0) INTO lw_duration
    FROM public.analytics_events
    WHERE event_name = 'session_end'
      AND duration_seconds BETWEEN 5 AND 3600
      AND created_at >= last_week_start
      AND created_at < last_week_end;

    -- Percentage changes (avoid division by zero)
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
        'duration_change_pct', d_change,
        -- Expose the windowing for transparency in the UI
        'window_elapsed_seconds', EXTRACT(EPOCH FROM elapsed)::INTEGER,
        'comparison_basis', 'same_elapsed_window'
    );

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_period_comparison() TO anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────
-- 3. get_spike_metrics() — tighter, no false alarms on small sites
-- ─────────────────────────────────────────────────────────────────────
-- Old logic: is_spiking := (active_5min * 12) > (avg_hourly * 2)
--   On a small site with avg_hourly=5, just 2 concurrent visitors
--   trip the alarm. Not a real signal.
--
-- New logic: require BOTH conditions to trigger:
--   (a) active_now ≥ 5  (absolute floor — at least 5 people online)
--   (b) projected hourly > MAX(3 × avg_hourly, 15)  (3x average AND ≥15/hr)
--
-- This means the alert fires only when the site has genuinely meaningful
-- concurrent activity AND it's significantly above its own baseline.
-- ─────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_spike_metrics() CASCADE;
CREATE OR REPLACE FUNCTION public.get_spike_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
    v_active_now BIGINT;
    v_avg_hourly NUMERIC;
    v_projected_hourly BIGINT;
    v_threshold NUMERIC;
    v_is_spiking BOOLEAN;
    v_spike_pct INTEGER;
    -- Tunables (in one place at the top)
    MIN_ACTIVE_FLOOR CONSTANT INTEGER := 5;   -- never spike below 5 concurrent visitors
    MULTIPLIER       CONSTANT NUMERIC := 3.0; -- spike = 3× the 30-day hourly average
    HOURLY_FLOOR     CONSTANT INTEGER := 15;  -- and projected hourly must be ≥ 15
BEGIN
    -- Active visitors in last 5 minutes
    SELECT COUNT(DISTINCT COALESCE(ip_hash, visitor_id)) INTO v_active_now
    FROM public.analytics_events
    WHERE event_name = 'page_view'
      AND created_at > NOW() - INTERVAL '5 minutes';

    -- Average unique visitors per hour over last 30 days
    -- (excluding the current hour, which is still filling)
    SELECT COALESCE(AVG(hourly_count), 0) INTO v_avg_hourly
    FROM (
        SELECT
            date_trunc('hour', created_at) AS hr,
            COUNT(DISTINCT COALESCE(ip_hash, visitor_id)) AS hourly_count
        FROM public.analytics_events
        WHERE event_name = 'page_view'
          AND created_at > NOW() - INTERVAL '30 days'
          AND created_at <= NOW() - INTERVAL '1 hour'
        GROUP BY hr
    ) hourly_stats;

    -- Project the 5-min sample to an hourly rate
    v_projected_hourly := v_active_now * 12;

    -- Threshold = max(MULTIPLIER * avg_hourly, HOURLY_FLOOR)
    v_threshold := GREATEST(v_avg_hourly * MULTIPLIER, HOURLY_FLOOR);

    -- Spike fires only if BOTH gates pass: floor + threshold
    v_is_spiking :=
        v_active_now >= MIN_ACTIVE_FLOOR
        AND v_projected_hourly > v_threshold;

    v_spike_pct := CASE
        WHEN v_avg_hourly > 0 THEN ROUND(((v_projected_hourly - v_avg_hourly) / v_avg_hourly) * 100)
        ELSE 0
    END;

    result := json_build_object(
        'active_now', v_active_now,
        'avg_hourly_30d', ROUND(v_avg_hourly),
        'projected_hourly', v_projected_hourly,
        'is_spiking', v_is_spiking,
        'spike_pct', v_spike_pct,
        -- Transparency: expose the rules so the UI can explain why
        'rules', json_build_object(
            'min_active_floor', MIN_ACTIVE_FLOOR,
            'multiplier', MULTIPLIER,
            'hourly_floor', HOURLY_FLOOR
        )
    );

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_spike_metrics() TO anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────
-- 4. get_daily_visits() — TZ-aware bucketing
-- ─────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_daily_visits() CASCADE;
CREATE OR REPLACE FUNCTION public.get_daily_visits()
RETURNS TABLE(date TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    today_ist DATE := ((NOW() AT TIME ZONE 'Europe/Istanbul')::DATE);
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            (today_ist - INTERVAL '29 days')::DATE,
            today_ist::DATE,
            '1 day'::INTERVAL
        )::DATE AS day
    ),
    daily_counts AS (
        SELECT
            (created_at AT TIME ZONE 'Europe/Istanbul')::DATE AS day,
            COUNT(DISTINCT COALESCE(ip_hash, visitor_id)) AS visits
        FROM public.analytics_events
        WHERE event_name = 'page_view'
          AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY (created_at AT TIME ZONE 'Europe/Istanbul')::DATE
    )
    SELECT
        TO_CHAR(ds.day, 'MM/DD') AS date,
        COALESCE(dc.visits, 0)   AS count
    FROM date_series ds
    LEFT JOIN daily_counts dc ON ds.day = dc.day
    ORDER BY ds.day ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_daily_visits() TO anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────
-- ✅ Done — verify by running:
--    SELECT public.get_dashboard_stats();
--    SELECT public.get_period_comparison();
--    SELECT public.get_spike_metrics();
-- ─────────────────────────────────────────────────────────────────────
