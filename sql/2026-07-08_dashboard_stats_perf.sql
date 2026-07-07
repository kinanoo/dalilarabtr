-- ============================================================================
-- Dashboard stats performance fix — get_dashboard_stats() was timing out
-- ============================================================================
-- Symptom: SELECT public.get_dashboard_stats() → 57014 "canceling statement due
-- to statement timeout". The admin dashboard KPI cards (SitePulse) therefore
-- silently degraded to blanks/zeros as analytics_events grew.
--
-- Two causes, both fixed here:
--   1. No supporting indexes → every metric full-scanned analytics_events.
--   2. The "today" metrics used `(created_at AT TIME ZONE 'Europe/Istanbul')::DATE = today`
--      — a function on the column, so NO index could ever be used. Rewritten as a
--      sargable range on created_at (>= today_start AND < today_end).
--
-- Semantics are UNCHANGED (same Istanbul-day boundaries, same honest counts) —
-- only the execution plan changes. Safe + idempotent. Run once in Supabase → SQL Editor.
-- ============================================================================

-- 1) Indexes (partial — only the page_view / session_end rows the RPC reads).
CREATE INDEX IF NOT EXISTS idx_ae_pageview_created
    ON public.analytics_events (created_at)
    WHERE event_name = 'page_view';

CREATE INDEX IF NOT EXISTS idx_ae_pageview_visitor
    ON public.analytics_events (visitor_id)
    WHERE event_name = 'page_view' AND visitor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ae_session_created
    ON public.analytics_events (created_at)
    WHERE event_name = 'session_end';

-- 2) Rebuild the function with a sargable "today" predicate.
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    today_ist   DATE        := ((NOW() AT TIME ZONE 'Europe/Istanbul')::DATE);
    -- UTC instants of Istanbul midnight today / tomorrow — sargable bounds.
    today_start TIMESTAMPTZ := (today_ist::timestamp)       AT TIME ZONE 'Europe/Istanbul';
    today_end   TIMESTAMPTZ := ((today_ist + 1)::timestamp) AT TIME ZONE 'Europe/Istanbul';
    week_start  TIMESTAMPTZ := date_trunc('week',  NOW() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
    month_start TIMESTAMPTZ := date_trunc('month', NOW() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
BEGIN
    RETURN json_build_object(
        'active_users_now', (
            SELECT COUNT(DISTINCT COALESCE(ip_hash, visitor_id))
            FROM public.analytics_events
            WHERE created_at > NOW() - INTERVAL '5 minutes'
              AND event_name = 'page_view'
        ),
        'total_visitors_all_time', (
            SELECT COUNT(DISTINCT visitor_id)
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND visitor_id IS NOT NULL
              AND visitor_id <> ''
        ),
        'total_page_views_all_time', (
            SELECT COUNT(*)
            FROM public.analytics_events
            WHERE event_name = 'page_view'
        ),
        'today_unique_visitors', (
            SELECT COUNT(DISTINCT COALESCE(ip_hash, visitor_id))
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at >= today_start AND created_at < today_end
        ),
        'today_page_views', (
            SELECT COUNT(*)
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at >= today_start AND created_at < today_end
        ),
        'week_visitors', (
            SELECT COUNT(DISTINCT COALESCE(ip_hash, visitor_id))
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at >= week_start
        ),
        'month_visitors', (
            SELECT COUNT(DISTINCT COALESCE(ip_hash, visitor_id))
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at >= month_start
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
        -- FIX: articles use status='approved' (not 'published') — the old value
        -- made the dashboard show 0 articles despite hundreds being live.
        'total_articles',  (SELECT COUNT(*) FROM public.articles  WHERE status = 'approved'),
        'total_services',  (SELECT COUNT(*) FROM public.service_providers WHERE status = 'approved'),
        'total_scenarios', (SELECT COUNT(*) FROM public.consultant_scenarios WHERE is_active = true),
        'total_zones',     (SELECT COUNT(*) FROM public.zones)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO anon, authenticated;

-- 3) Refresh planner stats so the new indexes are used immediately.
ANALYZE public.analytics_events;
