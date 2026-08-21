-- أرقام غرفة الأخبار: جميع الأخبار، لا آخر 100 عنصر مختلط فقط.
-- تعرض اللوحة زواراً فريدين اليوم وخلال 7 أيام لكل خبر، مع إجمالي
-- مستقل لغرفة الأخبار. لا تُخزّن هذه الدالة بيانات جديدة ولا تغيّر المحتوى.

CREATE OR REPLACE FUNCTION public.get_update_performance()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    today_start TIMESTAMPTZ := (((NOW() AT TIME ZONE 'Europe/Istanbul')::date)::timestamp) AT TIME ZONE 'Europe/Istanbul';
    week_start  TIMESTAMPTZ := NOW() - INTERVAL '7 days';
    result      JSON;
BEGIN
    WITH
    news_items AS (
        SELECT
            u.id::text AS ref,
            u.title,
            u.created_at AS published_at,
            u.active,
            '/updates/' || u.id::text AS path
        FROM public.updates u
        ORDER BY u.created_at DESC NULLS LAST
        LIMIT 250
    ),
    raw AS (
        SELECT
            ae.page_path,
            COUNT(DISTINCT public.visitor_key(ae.ip_hash, ae.visitor_id, ae.anon_key))
                FILTER (WHERE ae.created_at >= today_start) AS readers_today,
            COUNT(DISTINCT public.visitor_key(ae.ip_hash, ae.visitor_id, ae.anon_key))
                AS readers_week
        FROM public.analytics_events ae
        JOIN news_items n ON n.path = ae.page_path
        WHERE ae.event_name = 'page_view'
          AND ae.created_at >= week_start
        GROUP BY ae.page_path
    ),
    lifetime AS (
        SELECT d.page_path, SUM(d.views) AS views_total
        FROM public.analytics_page_daily d
        JOIN news_items n ON n.path = d.page_path
        GROUP BY d.page_path
    ),
    newsroom AS (
        SELECT
            COUNT(DISTINCT public.visitor_key(ae.ip_hash, ae.visitor_id, ae.anon_key))
                FILTER (WHERE ae.created_at >= today_start) AS readers_today,
            COUNT(DISTINCT public.visitor_key(ae.ip_hash, ae.visitor_id, ae.anon_key))
                AS readers_week
        FROM public.analytics_events ae
        WHERE ae.event_name = 'page_view'
          AND ae.page_path LIKE '/updates/%'
          AND ae.created_at >= week_start
    )
    SELECT json_build_object(
        'generated_at', NOW(),
        'summary', json_build_object(
            'readers_today', COALESCE((SELECT readers_today FROM newsroom), 0),
            'readers_week', COALESCE((SELECT readers_week FROM newsroom), 0)
        ),
        'items', COALESCE((
            SELECT json_agg(row_data ORDER BY row_data.published_at DESC NULLS LAST)
            FROM (
                SELECT
                    n.ref,
                    n.title,
                    n.path,
                    n.published_at,
                    n.active,
                    COALESCE(r.readers_today, 0) AS readers_today,
                    COALESCE(r.readers_week, 0) AS readers_week,
                    COALESCE(l.views_total, 0) AS views_total
                FROM news_items n
                LEFT JOIN raw r ON r.page_path = n.path
                LEFT JOIN lifetime l ON l.page_path = n.path
            ) row_data
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END
$fn$;

COMMENT ON FUNCTION public.get_update_performance() IS
  'أداء جميع أخبار غرفة الأخبار: زوار فريدون اليوم وخلال 7 أيام وإجمالي المشاهدات.';

GRANT EXECUTE ON FUNCTION public.get_update_performance() TO authenticated;

-- فحص صامت يوقف الملف إن كانت النتيجة غير سليمة.
DO $verify$
DECLARE
    probe JSON;
BEGIN
    SELECT public.get_update_performance() INTO probe;
    IF probe IS NULL OR json_typeof(probe->'items') <> 'array' THEN
        RAISE EXCEPTION 'FAILED: get_update_performance لم تُرجع قائمة سليمة.';
    END IF;
END
$verify$;
