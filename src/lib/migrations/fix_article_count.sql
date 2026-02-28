-- ==============================================================================
-- إصلاح عداد المقالات في get_dashboard_stats
-- المشكلة: WHERE status = 'published' تُرجع 0 لأن الجدول قد لا يحتوي عمود status
-- الحل: عد جميع المقالات + التحديثات بدون فلتر
-- ==============================================================================

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
        'total_comments', (SELECT COUNT(*) FROM public.comments),
        'total_reviews',  (SELECT COUNT(*) FROM public.service_reviews),
        -- عد المقالات بدون فلتر status (الجدول قد لا يحتوي هذا العمود)
        'total_articles',  (
            (SELECT COUNT(*) FROM public.articles) +
            (SELECT COUNT(*) FROM public.updates)
        ),
        'total_services',  (SELECT COUNT(*) FROM public.service_providers),
        'total_scenarios', (SELECT COUNT(*) FROM public.consultant_scenarios WHERE is_active = true),
        'total_zones',     (SELECT COUNT(*) FROM public.zones)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO anon, authenticated;
