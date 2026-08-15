-- ============================================================================
-- عدّ كل زائر، بلا انتظار موافقته (2026-08-13)
--
-- العَرَض: «مشاهدات اليوم 721» مقابل «زيارات اليوم 20 زائراً فريداً» — أي 36
-- صفحة للزائر الواحد، والمتوسط الحقيقي ~3. الرقم مستحيل، فالعطل في العدّ.
--
-- ── السبب ───────────────────────────────────────────────────────────────────
-- /api/track يكتب ip_hash = NULL و visitor_id = '' لكل زائر لم يوافق على
-- التتبّع، والدوال تعدّ COUNT(DISTINCT COALESCE(ip_hash, visitor_id)) بلا
-- NULLIF. فـCOALESCE(NULL, '') = '' — قيمة واحدة يشترك فيها كل غير الموافقين،
-- فينهارون جميعاً إلى «زائر» واحد. الرقم 20 كان ~19 موافقاً + دلواً واحداً
-- ابتلع المئات.
--
-- وليس خطأً حسابياً فحسب: حتى لو أصلحنا NULLIF، كان غير الموافقين سيسقطون من
-- العدّ كلّياً (كما يحدث في بطاقتَي الأسبوع والشهر، وهما تستعملان NULLIF أصلاً
-- فتبدوان سليمتين وهما تعدّان الموافقين وحدهم). الموقع كان يقيس أقلّيةً
-- ويعرضها كأنها الجمهور.
--
-- ── الحلّ: المعيار العالمي للتحليلات بلا كوكيز ──────────────────────────────
-- عمود جديد anon_key يكتبه الخادم لكل زائر:
--
--     anon_key = sha256(IP | user-agent | ملح | تاريخ اليوم بتوقيت إسطنبول)
--
-- ثلاث خصائص تجعله معفيّاً من الموافقة لا مجرّد غير مُعلَن — وهي نفسها التي
-- تعتمد عليها Plausible و Fathom ووضع Matomo بلا كوكيز:
--   1. لا يُكتب شيء على جهاز الزائر ولا يُقرأ منه ⇒ خارج نطاق توجيه الكوكيز.
--   2. الـIP الخام لا يصل القاعدة إطلاقاً — بصمة أحادية الاتجاه مقتطعة فقط.
--   3. الملح يحمل تاريخ اليوم ⇒ المفتاح يتبدّل عند منتصف الليل، فلا يمكن ربط
--      شخص عبر يومين. يعرّف **زيارة** لا **شخصاً**.
--
-- ما يترتّب على ذلك بصراحة: «الزوّار الفريدون» ليوم واحد دقيق 100%، أمّا على
-- نافذة أسبوع/شهر فالزائر غير الموافق يُحسب مرّة لكل يوم زار فيه. هذه هي مقايضة
-- التحليلات بلا كوكيز في كل أداة تحترم الخصوصية، وهي أدقّ بما لا يقاس من
-- الحالة السابقة (الجميع = 1). ولمن وافق يبقى ip_hash الثابت، فتظلّ بطاقات
-- «العائدون» و«إجمالي الزوار منذ الإطلاق» على دقّتها ولا تتراجع خطوة.
--
-- ── ترتيب الهوية ────────────────────────────────────────────────────────────
-- visitor_key() = أول قيمة غير فارغة من: ip_hash ← visitor_id ← anon_key.
-- الثابت أولاً عمداً: من وافق يحتفظ بهويّته الثابتة عبر الأيام (فلا تتضخّم
-- أرقام الأسبوع)، ومن لم يوافق يُعدّ بمفتاح اليوم بدل أن يُهمَل أو يُدمَج.
-- والأهمّ أنها الترتيب نفسه الذي كانت تستعمله البيانات التاريخية، فالأرقام
-- القديمة تبقى قابلة للمقارنة بالجديدة.
--
-- idempotent — إعادة التشغيل آمنة. لا يحذف بيانات ولا يعدّل صفّاً واحداً.
-- ============================================================================

-- ─── 1) العمود ──────────────────────────────────────────────────────────────
ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS anon_key text;

COMMENT ON COLUMN public.analytics_events.anon_key IS
  'مفتاح زائر بلا كوكيز يتبدّل يومياً: sha256(ip|ua|ملح|اليوم). يُكتب لكل زائر بلا اشتراط موافقة — لا يُخزَّن شيء على الجهاز ولا يربط شخصاً عبر يومين. راجع sql/2026-08-13_universal_visitor_identity.sql';

-- فهرس مغطٍّ لاستعلامات اللوحة: كلها «page_view ضمن مدّة، عُدّ الهويات
-- الفريدة». بهذا تصير مسحاً للفهرس وحده بدل مسح الجدول كاملاً — واللوحة
-- تُحدِّث نفسها كل 30 ثانية ما دامت مفتوحة، فالفرق في قراءات القاعدة يومي لا
-- عابر. جزئي على page_view كي لا يحمل أحداث session_end والنقرات.
CREATE INDEX IF NOT EXISTS idx_analytics_events_pageview_identity
  ON public.analytics_events (created_at DESC, anon_key, ip_hash, visitor_id)
  WHERE event_name = 'page_view';

-- ─── 2) قاعدة الهوية، في مكان واحد ─────────────────────────────────────────
-- كانت منسوخة حرفياً في تسعة استعلامات، فاختلفت نسخة عن أخرى بـNULLIF واحد —
-- وهو بالضبط الخلل الذي أنتج «20». تعريف واحد يمنع تكرار ذلك.
CREATE OR REPLACE FUNCTION public.visitor_key(
  p_ip_hash text, p_visitor_id text, p_anon_key text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $fn$
  SELECT COALESCE(NULLIF(p_ip_hash, ''), NULLIF(p_visitor_id, ''), NULLIF(p_anon_key, ''));
$fn$;

COMMENT ON FUNCTION public.visitor_key(text, text, text) IS
  'هوية الزائر الموحّدة: ثابتة لمن وافق، ومفتاح اليوم لمن لم يوافق، وNULL إن لم تتوفّر أي منها. استعملها في كل عدّ للزوار.';

GRANT EXECUTE ON FUNCTION public.visitor_key(text, text, text) TO anon, authenticated;

-- ─── 3) بطاقات اللوحة ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    today_ist   DATE        := ((NOW() AT TIME ZONE 'Europe/Istanbul')::DATE);
    today_start TIMESTAMPTZ := (today_ist::timestamp)       AT TIME ZONE 'Europe/Istanbul';
    today_end   TIMESTAMPTZ := ((today_ist + 1)::timestamp) AT TIME ZONE 'Europe/Istanbul';
    week_start  TIMESTAMPTZ := date_trunc('week',  NOW() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
    month_start TIMESTAMPTZ := date_trunc('month', NOW() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
BEGIN
    RETURN json_build_object(
        'active_users_now', (
            SELECT COUNT(DISTINCT public.visitor_key(ip_hash, visitor_id, anon_key))
            FROM public.analytics_events
            WHERE created_at > NOW() - INTERVAL '5 minutes'
              AND event_name = 'page_view'
        ),
        -- «منذ الإطلاق» يبقى من الملخّص الدائم analytics_visitors: تريغره
        -- يشترط هوية ثابتة، فلا يتضخّم بمفاتيح يومية متبدّلة. رقم محافظ
        -- (يعدّ الموافقين) لكنه صادق ومتّصل بتاريخه، وتغييره كان سيقطع
        -- سلسلة رقم يتابعه صاحب الموقع منذ الإطلاق.
        'total_visitors_all_time', (
            SELECT COUNT(*) FROM public.analytics_visitors
        ),
        'total_page_views_all_time', (
            SELECT COALESCE(SUM(page_views), 0) FROM public.analytics_visitors
        ),
        'today_unique_visitors', (
            SELECT COUNT(DISTINCT public.visitor_key(ip_hash, visitor_id, anon_key))
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
            SELECT COUNT(DISTINCT public.visitor_key(ip_hash, visitor_id, anon_key))
            FROM public.analytics_events
            WHERE event_name = 'page_view'
              AND created_at >= week_start
        ),
        'month_visitors', (
            SELECT COUNT(DISTINCT public.visitor_key(ip_hash, visitor_id, anon_key))
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
        'total_articles',  (SELECT COUNT(*) FROM public.articles  WHERE status = 'approved'),
        'total_services',  (SELECT COUNT(*) FROM public.service_providers WHERE status = 'approved'),
        'total_scenarios', (SELECT COUNT(*) FROM public.consultant_scenarios WHERE is_active = true),
        'total_zones',     (SELECT COUNT(*) FROM public.zones)
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO anon, authenticated;

-- ─── 4) مقارنة الأسبوع ──────────────────────────────────────────────────────
-- ملاحظة على قراءة النتيجة في أول أسبوع: هذا الأسبوع سيُقاس بالعدّ الكامل
-- والأسبوع الماضي بالعدّ المنهار، فترتفع النسبة ارتفاعاً كاذباً مرّة واحدة.
-- تعود المقارنة إلى معناها الحقيقي بعد سبعة أيام من نشر هذا الملف.
CREATE OR REPLACE FUNCTION public.get_period_comparison()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    week_start      TIMESTAMPTZ := date_trunc('week', NOW() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul';
    elapsed         INTERVAL    := NOW() - week_start;
    last_week_start TIMESTAMPTZ := week_start - INTERVAL '7 days';
    last_week_end   TIMESTAMPTZ := last_week_start + elapsed;

    tw_visitors BIGINT;  lw_visitors BIGINT;
    tw_views    BIGINT;  lw_views    BIGINT;
    tw_duration INTEGER; lw_duration INTEGER;
    v_change INTEGER; vw_change INTEGER; d_change INTEGER;
BEGIN
    SELECT COUNT(DISTINCT public.visitor_key(ip_hash, visitor_id, anon_key)), COUNT(*)
    INTO tw_visitors, tw_views
    FROM public.analytics_events
    WHERE event_name = 'page_view'
      AND created_at >= week_start AND created_at <= NOW();

    SELECT COUNT(DISTINCT public.visitor_key(ip_hash, visitor_id, anon_key)), COUNT(*)
    INTO lw_visitors, lw_views
    FROM public.analytics_events
    WHERE event_name = 'page_view'
      AND created_at >= last_week_start AND created_at < last_week_end;

    SELECT COALESCE(AVG(duration_seconds)::INTEGER, 0) INTO tw_duration
    FROM public.analytics_events
    WHERE event_name = 'session_end'
      AND duration_seconds BETWEEN 5 AND 3600
      AND created_at >= week_start;

    SELECT COALESCE(AVG(duration_seconds)::INTEGER, 0) INTO lw_duration
    FROM public.analytics_events
    WHERE event_name = 'session_end'
      AND duration_seconds BETWEEN 5 AND 3600
      AND created_at >= last_week_start AND created_at < last_week_end;

    v_change  := CASE WHEN lw_visitors > 0 THEN ROUND(((tw_visitors - lw_visitors)::NUMERIC / lw_visitors) * 100) ELSE 0 END;
    vw_change := CASE WHEN lw_views    > 0 THEN ROUND(((tw_views    - lw_views)::NUMERIC    / lw_views)    * 100) ELSE 0 END;
    d_change  := CASE WHEN lw_duration > 0 THEN ROUND(((tw_duration - lw_duration)::NUMERIC / lw_duration) * 100) ELSE 0 END;

    RETURN json_build_object(
        'this_week_visitors', tw_visitors,
        'last_week_visitors', lw_visitors,
        'visitors_change_pct', v_change,
        'this_week_views', tw_views,
        'last_week_views', lw_views,
        'views_change_pct', vw_change,
        'this_week_avg_duration', tw_duration,
        'last_week_avg_duration', lw_duration,
        'duration_change_pct', d_change,
        'window_elapsed_seconds', EXTRACT(EPOCH FROM elapsed)::INTEGER,
        'comparison_basis', 'same_elapsed_window'
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.get_period_comparison() TO anon, authenticated;

-- ─── 5) إحصاءات الفترة (بطاقتا «آخر 7 أيام» و«آخر 30 يوم») ─────────────────
-- page_views و active_visitors تشملان الجميع الآن. أمّا returning_visitors
-- (ظهر في يومين مختلفين) فيبقى حكراً على أصحاب الهوية الثابتة بحكم التصميم:
-- المفتاح اليومي لا يمكنه أن يظهر في يومين. هذا صحيح لا ناقص — «العائد» سؤال
-- عن شخص عبر الزمن، وهو بالضبط ما تشترط الموافقة لأجله.
CREATE OR REPLACE FUNCTION public._visitor_period_stats(p_start TIMESTAMPTZ)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $fn$
    WITH visits AS (
        SELECT
            public.visitor_key(ip_hash, visitor_id, anon_key)  AS vkey,
            (created_at AT TIME ZONE 'Europe/Istanbul')::date  AS day
        FROM public.analytics_events
        WHERE event_name = 'page_view'
          AND created_at >= p_start
          AND public.visitor_key(ip_hash, visitor_id, anon_key) IS NOT NULL
    ),
    per_visitor AS (
        SELECT vkey, COUNT(DISTINCT day) AS days_active, COUNT(*) AS views
        FROM visits GROUP BY vkey
    )
    SELECT json_build_object(
        'page_views',        (SELECT COALESCE(SUM(views), 0) FROM per_visitor),
        'active_visitors',   (SELECT COUNT(*) FROM per_visitor),
        'returning_visitors',(SELECT COUNT(*) FROM per_visitor WHERE days_active >= 2),
        'one_day_visitors',  (SELECT COUNT(*) FROM per_visitor WHERE days_active = 1),
        'engaged_visitors',  (SELECT COUNT(*) FROM per_visitor WHERE views >= 5)
    );
$fn$;

GRANT EXECUTE ON FUNCTION public._visitor_period_stats(TIMESTAMPTZ) TO anon, authenticated;

-- ─── 6) «أين دخلوا»: أهمّ الصفحات بزوارها الفريدين ─────────────────────────
CREATE OR REPLACE FUNCTION public.get_visitor_insights()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $fn$
    SELECT json_build_object(
        'tracking_since',  '2026-07-18',
        'week',            public._visitor_period_stats(NOW() - INTERVAL '7 days'),
        'month',           public._visitor_period_stats(NOW() - INTERVAL '30 days'),
        'today',           public._visitor_period_stats(date_trunc('day', NOW() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul'),
        'top_pages_week', (
            SELECT COALESCE(json_agg(t), '[]'::json) FROM (
                SELECT ae.page_path,
                       COUNT(*) AS views,
                       COUNT(DISTINCT public.visitor_key(ae.ip_hash, ae.visitor_id, ae.anon_key)) AS uniques
                FROM public.analytics_events ae
                WHERE ae.event_name = 'page_view'
                  AND ae.created_at >= NOW() - INTERVAL '7 days'
                  AND ae.page_path IS NOT NULL
                GROUP BY ae.page_path
                ORDER BY views DESC
                LIMIT 10
            ) t
        ),
        'top_pages_month', (
            SELECT COALESCE(json_agg(t), '[]'::json) FROM (
                SELECT ae.page_path,
                       COUNT(*) AS views,
                       COUNT(DISTINCT public.visitor_key(ae.ip_hash, ae.visitor_id, ae.anon_key)) AS uniques
                FROM public.analytics_events ae
                WHERE ae.event_name = 'page_view'
                  AND ae.created_at >= NOW() - INTERVAL '30 days'
                  AND ae.page_path IS NOT NULL
                GROUP BY ae.page_path
                ORDER BY views DESC
                LIMIT 10
            ) t
        )
    );
$fn$;

GRANT EXECUTE ON FUNCTION public.get_visitor_insights() TO anon, authenticated;

-- ─── 7) التجميع اليومي الدائم ───────────────────────────────────────────────
-- منحنى «الزوّار يومياً» هو الأهمّ هنا: مفتاح اليوم ثابت داخل اليوم الواحد،
-- فالرقم اليومي دقيق 100% لكل زائر من اليوم فصاعداً.
CREATE OR REPLACE FUNCTION public.rollup_analytics_daily(p_days INT DEFAULT 3)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    since TIMESTAMPTZ := NOW() - make_interval(days => GREATEST(p_days, 1));
    n     BIGINT;
BEGIN
    INSERT INTO public.analytics_daily (day, page_views, unique_visitors, new_visitors)
    SELECT d.day, d.page_views, d.unique_visitors, COALESCE(nv.new_visitors, 0)
    FROM (
        SELECT
            (ae.created_at AT TIME ZONE 'Europe/Istanbul')::date AS day,
            COUNT(*)                                             AS page_views,
            COUNT(DISTINCT public.visitor_key(ae.ip_hash, ae.visitor_id, ae.anon_key)) AS unique_visitors
        FROM public.analytics_events ae
        WHERE ae.event_name = 'page_view'
          AND ae.created_at >= since
        GROUP BY 1
    ) d
    LEFT JOIN (
        SELECT (av.first_seen AT TIME ZONE 'Europe/Istanbul')::date AS day, COUNT(*) AS new_visitors
        FROM public.analytics_visitors av
        WHERE av.first_seen >= since
        GROUP BY 1
    ) nv ON nv.day = d.day
    ON CONFLICT (day) DO UPDATE SET
        page_views      = GREATEST(public.analytics_daily.page_views,      EXCLUDED.page_views),
        unique_visitors = GREATEST(public.analytics_daily.unique_visitors, EXCLUDED.unique_visitors),
        new_visitors    = GREATEST(public.analytics_daily.new_visitors,    EXCLUDED.new_visitors);

    GET DIAGNOSTICS n = ROW_COUNT;
    RETURN n;
END
$fn$;

-- ─── 8) رسم آخر 30 يوماً ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_daily_visits()
RETURNS TABLE(date TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    today_ist DATE := ((NOW() AT TIME ZONE 'Europe/Istanbul')::DATE);
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series((today_ist - INTERVAL '29 days')::DATE, today_ist::DATE, '1 day'::INTERVAL)::DATE AS day
    ),
    daily_counts AS (
        SELECT
            (created_at AT TIME ZONE 'Europe/Istanbul')::DATE AS day,
            COUNT(DISTINCT public.visitor_key(ip_hash, visitor_id, anon_key)) AS visits
        FROM public.analytics_events
        WHERE event_name = 'page_view'
          AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY (created_at AT TIME ZONE 'Europe/Istanbul')::DATE
    )
    SELECT TO_CHAR(ds.day, 'MM/DD') AS date, COALESCE(dc.visits, 0) AS count
    FROM date_series ds
    LEFT JOIN daily_counts dc ON ds.day = dc.day
    ORDER BY ds.day ASC;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.get_daily_visits() TO anon, authenticated;

-- ─── 9) إنذار الذروة ────────────────────────────────────────────────────────
-- عتباته مضبوطة على أرقام العدّ القديم المنهار. العدّ الكامل يرفع «النشطون
-- الآن» أضعافاً، فتصير كل ساعة عادية «ذروة». المتوسط المرجعي والقياس الحالي
-- كلاهما يُحسب بالمفتاح الجديد، لكن المتوسط يُبنى من 30 يوماً أغلبها بالعدّ
-- القديم — لذا تُرفع الأرضيات المطلقة مؤقتاً حتى يمتلئ المرجع بالعدّ الجديد.
CREATE OR REPLACE FUNCTION public.get_spike_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_active_now BIGINT;
    v_avg_hourly NUMERIC;
    v_projected_hourly BIGINT;
    v_threshold NUMERIC;
    v_is_spiking BOOLEAN;
    v_spike_pct INTEGER;
    MIN_ACTIVE_FLOOR CONSTANT INTEGER := 15;   -- كان 5، والعدّ الكامل يضاعفه
    MULTIPLIER       CONSTANT NUMERIC := 3.0;
    HOURLY_FLOOR     CONSTANT INTEGER := 60;   -- كان 15، للسبب نفسه
BEGIN
    SELECT COUNT(DISTINCT public.visitor_key(ip_hash, visitor_id, anon_key)) INTO v_active_now
    FROM public.analytics_events
    WHERE event_name = 'page_view'
      AND created_at > NOW() - INTERVAL '5 minutes';

    SELECT COALESCE(AVG(hourly_count), 0) INTO v_avg_hourly
    FROM (
        SELECT date_trunc('hour', created_at) AS hr,
               COUNT(DISTINCT public.visitor_key(ip_hash, visitor_id, anon_key)) AS hourly_count
        FROM public.analytics_events
        WHERE event_name = 'page_view'
          AND created_at > NOW() - INTERVAL '30 days'
          AND created_at <= NOW() - INTERVAL '1 hour'
        GROUP BY hr
    ) hourly_stats;

    v_projected_hourly := v_active_now * 12;
    v_threshold := GREATEST(v_avg_hourly * MULTIPLIER, HOURLY_FLOOR);
    v_is_spiking := v_active_now >= MIN_ACTIVE_FLOOR AND v_projected_hourly > v_threshold;
    v_spike_pct := CASE
        WHEN v_avg_hourly > 0 THEN ROUND(((v_projected_hourly - v_avg_hourly) / v_avg_hourly) * 100)
        ELSE 0 END;

    RETURN json_build_object(
        'active_now', v_active_now,
        'projected_hourly', v_projected_hourly,
        'avg_hourly_30d', ROUND(v_avg_hourly, 1),
        'threshold', ROUND(v_threshold, 1),
        'is_spiking', v_is_spiking,
        'spike_pct', v_spike_pct
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.get_spike_metrics() TO anon, authenticated;

-- ─── 10) إعادة تجميع اليوم فوراً بالقاعدة الجديدة ──────────────────────────
SELECT public.rollup_analytics_daily(2) AS أيام_أُعيد_تجميعها;

-- ─── 11) مراجعة: النسبة هي الحكم ────────────────────────────────────────────
-- «صفحات لكل زائر» هو المؤشّر الذي كشف العطل (36 صفحة للزائر). بعد الإصلاح
-- يجب أن يهبط إلى المدى الطبيعي 1-6. الأيام السابقة لهذا الملف تبقى كما هي:
-- anon_key فارغ فيها، ولا سبيل لاختراعه بأثر رجعي.
SELECT
  (created_at AT TIME ZONE 'Europe/Istanbul')::date AS اليوم,
  COUNT(*)                                          AS مشاهدات,
  COUNT(DISTINCT public.visitor_key(ip_hash, visitor_id, anon_key)) AS زوار_فريدون,
  ROUND(COUNT(*)::numeric
        / GREATEST(COUNT(DISTINCT public.visitor_key(ip_hash, visitor_id, anon_key)), 1), 1)
                                                    AS صفحات_لكل_زائر
FROM public.analytics_events
WHERE event_name = 'page_view'
  AND created_at >= now() - interval '7 days'
GROUP BY 1
ORDER BY 1 DESC;

-- ─── 12) تحقّق ──────────────────────────────────────────────────────────────
DO $check$
DECLARE
  has_col  boolean;
  probe    json;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns cols
    WHERE cols.table_schema = 'public'
      AND cols.table_name   = 'analytics_events'
      AND cols.column_name  = 'anon_key'
  ) INTO has_col;

  IF NOT has_col THEN
    RAISE EXCEPTION 'FAILED: العمود anon_key لم يُنشأ.';
  END IF;

  IF public.visitor_key(NULL, '', 'abc') IS DISTINCT FROM 'abc' THEN
    RAISE EXCEPTION 'FAILED: visitor_key لا تلتقط الزائر بلا موافقة — وهو جوهر الإصلاح.';
  END IF;
  IF public.visitor_key('stable', '', 'daily') IS DISTINCT FROM 'stable' THEN
    RAISE EXCEPTION 'FAILED: visitor_key لا تُقدّم الهوية الثابتة على مفتاح اليوم.';
  END IF;
  IF public.visitor_key(NULL, '', NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'FAILED: هوية فارغة تماماً يجب أن تكون NULL لا سلسلة فارغة — وإلا انهار الجميع إلى دلو واحد من جديد.';
  END IF;

  -- الدوال تُنفَّذ فعلاً، لا مجرّد أنها موجودة.
  SELECT public.get_dashboard_stats() INTO probe;
  IF probe IS NULL THEN
    RAISE EXCEPTION 'FAILED: get_dashboard_stats لم تُرجع شيئاً.';
  END IF;
  PERFORM public.get_period_comparison();
  PERFORM public.get_visitor_insights();
  PERFORM public.get_spike_metrics();

  RAISE NOTICE 'OK: العدّ الشامل مفعَّل. مشاهدات اليوم % وزوار اليوم %.',
    probe->>'today_page_views', probe->>'today_unique_visitors';
  RAISE NOTICE 'ملاحظة: رقم زوار اليوم يبقى بالعدّ القديم حتى يُنشر تعديل /api/track ويبدأ الموقع بكتابة anon_key.';
END
$check$;
