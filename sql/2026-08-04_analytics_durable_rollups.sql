-- ============================================================================
-- إصلاح «نبض الموقع»: عدّادات دائمة لا تنكمش مع تنظيف السجلّات (2026-08-04)
-- ============================================================================
-- العَرَض الذي بلّغ عنه صاحب الموقع: «إجمالي الزوار — منذ الإطلاق» كان أكثر من
-- 14 ألفاً فصار 10,4xx فجأة. عدّاد «منذ الإطلاق» لا يمكن أن ينقص إلا إذا حُذف
-- تاريخ، فالسبب ليس في الزوار بل في القياس.
--
-- ── السبب الأول (وهو الذي أحدث الهبوط) ──────────────────────────────────────
-- سياسة الاحتفاظ في sql/2026-08-04_data_retention_policy.sql تحذف صفوف
-- analytics_events الأقدم من 90 يوماً. لكن get_dashboard_stats() تحسب:
--
--     total_visitors_all_time  = COUNT(DISTINCT visitor_id) FROM analytics_events
--     total_page_views_all_time = COUNT(*)                  FROM analytics_events
--
-- بلا أي حدّ زمني — أي أنّها تقرأ الجدول نفسه الذي صار يُقلَّم. فصارت «منذ
-- الإطلاق» تعني عملياً «آخر 90 يوماً»، وستنكمش أكثر كل أحد مع كل تشغيل
-- لـpg_cron.
--
-- ملف الاحتفاظ برّر نوافذه بأنّ «أطول نافذة يستعملها أي استعلام هي 30 يوماً».
-- هذا الحصر كان خاطئاً: فُحصت الاستعلامات ذات النوافذ، وفاتت الاستعلامات التي
-- لا نافذة لها أصلاً — وهي بالضبط التي تتأذّى من الحذف.
--
-- ── السبب الثاني (أقدم، ولم ينتبه له أحد) ───────────────────────────────────
-- بطاقة «إجمالي الزوار» كانت تقيس جمهوراً مختلفاً عن كل بطاقة أخرى في اللوحة:
--   • هي تعدّ  DISTINCT visitor_id  بشرط  visitor_id <> ''
--   • وبقية البطاقات تعدّ  DISTINCT COALESCE(ip_hash, visitor_id)
-- و/api/track (السطر 84) يكتب visitor_id = '' لكل زائر لم يوافق على تتبّع
-- التحليلات. أي أنّ «إجمالي الزوار» كان يعدّ الموافقين وحدهم، بينما «زوار
-- اليوم» و«آخر 7 أيام» تعدّ الجميع. رقمان لا يجوز مقارنتهما ببعضهما أصلاً.
--
-- ── الحلّ: قلّم الخام، واحفظ المُجمَّع ───────────────────────────────────────
-- سياسة الاحتفاظ صحيحة في جوهرها؛ الناقص أن يبقى ملخّصٌ دائم بعد حذف الخام.
--
-- 1) analytics_visitors (من sql/2026-07-18_visitor_insights.sql) هو أصلاً
--    ملخّص دائم: صفّ واحد لكل زائر فيه first_seen و last_seen و page_views،
--    ويُحدَّث بتريغر مع كل حدث. لم يُحذف منه شيء في التقليم — وذلك بمحض
--    الصدفة: سياسة الاحتفاظ تستهدفه بعمود اسمه created_at وهو لا يملك عموداً
--    بهذا الاسم، ففحص وجود العمود تخطّاه. صدفةٌ سعيدة أنقذت التاريخ كلّه،
--    ولهذا يزيلها هذا الملف من قائمة الأهداف بدل تركها لغماً.
--
-- 2) جدول جديد analytics_daily: صفّ واحد لكل يوم، لا يُقلَّم أبداً. ~365 صفّاً
--    في السنة، أي لا شيء يُذكر بجانب حدّ 500 ميغابايت — وبه يبقى منحنى النمو
--    قابلاً للرسم بعد سنوات، لا 90 يوماً فقط.
--
-- 3) get_dashboard_stats() تقرأ «منذ الإطلاق» من الملخّص الدائم، وبنفس هوية
--    الزائر التي تستعملها بقية البطاقات — فتصير الأرقام قابلة للمقارنة.
--
-- ── ما فُقد ولا يُسترجَع (بصراحة) ───────────────────────────────────────────
-- تفاصيل الأيام الأقدم من 90 يوماً (مشاهدات كل يوم، أهم صفحات كل يوم) حُذفت
-- ولا نسخة منها. الذي نجا: عدد الزوار الفريدين منذ الإطلاق، ومجموع مشاهداتهم،
-- وتاريخ أول ظهور لكل زائر — ومن هذا الأخير يُعاد بناء منحنى «الزوار الجدد كل
-- يوم» منذ الإطلاق، وهو مضمَّن في التعبئة أدناه.
--
-- آمن لإعادة التشغيل. شغّله مرّة واحدة في Supabase ← SQL Editor.
-- ============================================================================

-- ─── 1) جدول الملخّص اليومي الدائم ──────────────────────────────────────────
-- page_views و unique_visitors تقبلان NULL عمداً: NULL تعني «لم نعد نعرف»
-- (يوم حُذفت أحداثه)، و0 تعني «لا زيارات ذلك اليوم». الخلط بينهما يجعل رسم
-- النمو يكذب.
CREATE TABLE IF NOT EXISTS public.analytics_daily (
    day             DATE PRIMARY KEY,
    page_views      BIGINT,
    unique_visitors BIGINT,
    new_visitors    BIGINT NOT NULL DEFAULT 0
);

COMMENT ON TABLE public.analytics_daily IS
  'ملخّص يومي دائم للزيارات. لا يُقلَّم أبداً — هو ذاكرة الموقع بعد حذف analytics_events. راجع sql/2026-08-04_analytics_durable_rollups.sql';

ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;

-- ─── 2) دالة التجميع اليومي ─────────────────────────────────────────────────
-- تُعيد حساب آخر p_days يوماً (لا اليوم السابق وحده) كي تلتقط الأحداث
-- المتأخّرة، والحدود بتوقيت إسطنبول تطابق ما تستعمله اللوحة.
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
    SELECT
        d.day,
        d.page_views,
        d.unique_visitors,
        COALESCE(nv.new_visitors, 0)
    FROM (
        SELECT
            (ae.created_at AT TIME ZONE 'Europe/Istanbul')::date AS day,
            COUNT(*)                                             AS page_views,
            COUNT(DISTINCT COALESCE(NULLIF(ae.ip_hash, ''), NULLIF(ae.visitor_id, ''))) AS unique_visitors
        FROM public.analytics_events ae
        WHERE ae.event_name = 'page_view'
          AND ae.created_at >= since
        GROUP BY 1
    ) d
    LEFT JOIN (
        SELECT
            (av.first_seen AT TIME ZONE 'Europe/Istanbul')::date AS day,
            COUNT(*)                                             AS new_visitors
        FROM public.analytics_visitors av
        WHERE av.first_seen >= since
        GROUP BY 1
    ) nv ON nv.day = d.day
    -- GREATEST وليس الإسناد المباشر، وهذا مقصود: التجميع يمسح نافذة أوسع من
    -- نافذة الاحتفاظ عمداً، فيمرّ على اليوم الواقع تماماً على حدّ الـ90 يوماً
    -- وقد حُذف نصف أحداثه. الإسناد المباشر كان سيستبدل رقم ذلك اليوم الصحيح
    -- برقم منقوص. عدّاد يوم لا ينقص أبداً — يزيد فقط بأحداث متأخّرة — فأخذ
    -- الأكبر هو الصواب. (GREATEST يتجاهل NULL، فاليوم المجهول يُملأ أوّل مرّة.)
    ON CONFLICT (day) DO UPDATE SET
        page_views      = GREATEST(public.analytics_daily.page_views,      EXCLUDED.page_views),
        unique_visitors = GREATEST(public.analytics_daily.unique_visitors, EXCLUDED.unique_visitors),
        new_visitors    = GREATEST(public.analytics_daily.new_visitors,    EXCLUDED.new_visitors);

    GET DIAGNOSTICS n = ROW_COUNT;
    RETURN n;
END
$fn$;

COMMENT ON FUNCTION public.rollup_analytics_daily(INT) IS
  'تجميع الزيارات اليومية في analytics_daily. تُجدوَل يومياً قبل تشغيل prune_log_tables.';

-- ─── 3) التعبئة التاريخية ───────────────────────────────────────────────────
-- (أ) الزوار الجدد كل يوم — متاح منذ الإطلاق لأن analytics_visitors لم يُقلَّم.
INSERT INTO public.analytics_daily (day, new_visitors)
SELECT
    (av.first_seen AT TIME ZONE 'Europe/Istanbul')::date,
    COUNT(*)
FROM public.analytics_visitors av
GROUP BY 1
ON CONFLICT (day) DO UPDATE SET
    new_visitors = GREATEST(public.analytics_daily.new_visitors, EXCLUDED.new_visitors);

-- (ب) المشاهدات والزوار الفريدون — للأيام التي ما زالت أحداثها موجودة فقط.
--     الأيام الأقدم تبقى NULL: لا نخترع صفراً لتاريخ لا نملكه.
INSERT INTO public.analytics_daily (day, page_views, unique_visitors)
SELECT
    (ae.created_at AT TIME ZONE 'Europe/Istanbul')::date,
    COUNT(*),
    COUNT(DISTINCT COALESCE(NULLIF(ae.ip_hash, ''), NULLIF(ae.visitor_id, '')))
FROM public.analytics_events ae
WHERE ae.event_name = 'page_view'
GROUP BY 1
ON CONFLICT (day) DO UPDATE SET
    page_views      = GREATEST(public.analytics_daily.page_views,      EXCLUDED.page_views),
    unique_visitors = GREATEST(public.analytics_daily.unique_visitors, EXCLUDED.unique_visitors);

-- ─── 4) لوحة الإحصاءات تقرأ الآن من الملخّص الدائم ──────────────────────────
-- الدالة منقولة كما هي من sql/2026-07-08_dashboard_stats_perf.sql عدا
-- الحقلين الأوّلين «منذ الإطلاق». بقية الحقول لم تتغيّر بحرف.
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    today_ist   DATE        := ((NOW() AT TIME ZONE 'Europe/Istanbul')::DATE);
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
        -- كان: COUNT(DISTINCT visitor_id) على analytics_events — يُقلَّم عند
        -- 90 يوماً، ويعدّ الموافقين على التتبّع وحدهم. صار: عدد صفوف الملخّص
        -- الدائم، ومفتاحه COALESCE(ip_hash, visitor_id) — نفس هوية الزائر
        -- التي تستعملها بقية البطاقات، فصار الرقمان قابلين للمقارنة.
        'total_visitors_all_time', (
            SELECT COUNT(*) FROM public.analytics_visitors
        ),
        -- كان: COUNT(*) على analytics_events — يُقلَّم كذلك. صار: مجموع عدّاد
        -- المشاهدات في الملخّص، وهو تراكمي لا ينقص (التريغر يزيد عند الإدراج
        -- ولا شيء يُنقصه عند الحذف).
        'total_page_views_all_time', (
            SELECT COALESCE(SUM(page_views), 0) FROM public.analytics_visitors
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
        'total_articles',  (SELECT COUNT(*) FROM public.articles  WHERE status = 'approved'),
        'total_services',  (SELECT COUNT(*) FROM public.service_providers WHERE status = 'approved'),
        'total_scenarios', (SELECT COUNT(*) FROM public.consultant_scenarios WHERE is_active = true),
        'total_zones',     (SELECT COUNT(*) FROM public.zones)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO anon, authenticated;

-- ─── 5) منحنى النمو للوحة ───────────────────────────────────────────────────
-- يعيد السلسلة اليومية من الملخّص الدائم. p_days افتراضياً 90؛ مرّر 3650
-- لترى المنحنى منذ الإطلاق.
CREATE OR REPLACE FUNCTION public.get_daily_traffic(p_days INT DEFAULT 90)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(json_agg(t ORDER BY t.day), '[]'::json)
    FROM (
        SELECT day, page_views, unique_visitors, new_visitors
        FROM public.analytics_daily
        WHERE day >= (CURRENT_DATE - GREATEST(p_days, 1))
        ORDER BY day
    ) t;
$$;

GRANT EXECUTE ON FUNCTION public.get_daily_traffic(INT) TO anon, authenticated;

-- ─── 6) نزع اللغم من سياسة الاحتفاظ ─────────────────────────────────────────
-- analytics_visitors هو الملخّص الدائم الوحيد للزوار. لا يُقلَّم أبداً: حذف
-- صفّ منه يعني نسيان زائر إلى الأبد وإعادة عدّه «جديداً» إن عاد. كان مُدرَجاً
-- في قائمة الأهداف بعمود created_at، وهو عمود لا وجود له في الجدول — فتخطّاه
-- الفحص صدفةً. تُنزَع الآن صراحةً حتى لا يُفعّلها أحدٌ لاحقاً بإضافة العمود.
-- الدالة منقولة كما هي من sql/2026-08-04_data_retention_policy.sql عدا ذلك.
CREATE OR REPLACE FUNCTION public.prune_log_tables()
RETURNS TABLE(tbl text, deleted bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  -- الجدول، عمود الوقت، عدد أيام الاحتفاظ.
  -- لا تُدرِج هنا أي جدول ملخَّص: analytics_visitors و analytics_daily
  -- هما ذاكرة الموقع الطويلة، وحجمهما لا يُذكر.
  targets CONSTANT text[][] := ARRAY[
    ['analytics_events',     'created_at',   '90'],   -- أضخم جدول سجلّي عادةً
    ['model_link_views',     'created_at',   '90'],
    ['admin_login_attempts', 'attempted_at', '7'],    -- أمني قصير الأجل
    ['admin_activity_log',   'created_at',   '180']   -- أثر تدقيقي: يُحفظ أطول
  ];
  t          text;
  ts_col     text;
  keep_days  int;
  n          bigint;
  i          int;
BEGIN
  -- قبل أي حذف: ثبّت اليوم في الملخّص الدائم. لو فشل التجميع لسبب ما، لا
  -- نريد أن يمضي الحذف على أي حال — لذلك بلا BEGIN/EXCEPTION هنا عمداً.
  PERFORM public.rollup_analytics_daily(95);

  FOR i IN 1 .. array_length(targets, 1) LOOP
    t         := targets[i][1];
    ts_col    := targets[i][2];
    keep_days := targets[i][3]::int;

    CONTINUE WHEN to_regclass('public.' || t) IS NULL;
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns cols
      WHERE cols.table_schema = 'public'
        AND cols.table_name   = t
        AND cols.column_name  = ts_col
    );

    EXECUTE format(
      'DELETE FROM public.%I WHERE %I < now() - interval ''%s days''',
      t, ts_col, keep_days
    );
    GET DIAGNOSTICS n = ROW_COUNT;

    tbl     := t;
    deleted := n;
    RETURN NEXT;
  END LOOP;
END
$fn$;

COMMENT ON FUNCTION public.prune_log_tables() IS
  'حذف صفوف الجداول السجلّية الأقدم من نافذة الاحتفاظ، بعد تثبيت الملخّص اليومي. لا تمسّ جداول المحتوى ولا جداول الملخّصات. راجع sql/2026-08-04_analytics_durable_rollups.sql';

-- ─── 7) جدولة التجميع اليومي ────────────────────────────────────────────────
-- 03:05 UTC يومياً — قبل تنظيف الأحد (03:17) بوقت كافٍ، وخارج الذروة.
DO $sched$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job j WHERE j.jobname = 'rollup-analytics-daily') THEN
      PERFORM cron.unschedule('rollup-analytics-daily');
    END IF;

    PERFORM cron.schedule(
      'rollup-analytics-daily',
      '5 3 * * *',
      $job$SELECT public.rollup_analytics_daily(3);$job$
    );
    RAISE NOTICE 'تمت جدولة التجميع اليومي عبر pg_cron (كل يوم 03:05 UTC).';
  ELSE
    RAISE NOTICE 'pg_cron غير مفعّل — التجميع لن يعمل تلقائياً.';
    RAISE NOTICE 'فعّله: Supabase ← Database ← Extensions ← pg_cron ← Enable، ثم أعد تشغيل هذا الملف.';
    RAISE NOTICE 'ملاحظة: prune_log_tables() تُجمّع قبل الحذف على أي حال، فلا يضيع تاريخ.';
  END IF;
END
$sched$;

-- ─── 8) تحقّق — يرمي خطأً إن لم ينجح الإصلاح ────────────────────────────────
DO $check$
DECLARE
  days_rows   bigint;
  visitors    bigint;
  stats       json;
  all_time    bigint;
  still_target boolean;
BEGIN
  SELECT COUNT(*) INTO days_rows FROM public.analytics_daily;
  SELECT COUNT(*) INTO visitors  FROM public.analytics_visitors;
  stats := public.get_dashboard_stats();
  all_time := (stats->>'total_visitors_all_time')::bigint;

  IF days_rows = 0 THEN
    RAISE EXCEPTION 'فشل: analytics_daily فارغ بعد التعبئة.';
  END IF;

  IF all_time <> visitors THEN
    RAISE EXCEPTION 'فشل: total_visitors_all_time (%) لا يساوي عدد صفوف الملخّص (%).', all_time, visitors;
  END IF;

  -- تأكيد أن analytics_visitors لم يعد هدفاً للتقليم. البحث عن صفّ الهدف
  -- حرفياً «['analytics_visitors'» لا عن الاسم وحده: الاسم يرد في تعليق داخل
  -- الدالة الجديدة، فبحثٌ فضفاض كان سيرمي خطأً على نصٍّ صحيح.
  SELECT p.prosrc LIKE '%[''analytics_visitors''%'
    INTO still_target
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'prune_log_tables';

  IF COALESCE(still_target, false) THEN
    RAISE EXCEPTION 'فشل: analytics_visitors ما زال مُدرَجاً في أهداف التقليم.';
  END IF;

  RAISE NOTICE 'نجح: % يوماً في الملخّص، % زائراً منذ الإطلاق.', days_rows, visitors;
END
$check$;

-- ─── 9) مراجعة ──────────────────────────────────────────────────────────────
-- الأول: الأرقام الدائمة. الثاني: أقدم يوم نعرف مشاهداته مقابل أقدم يوم نعرف
-- فيه زواراً جدداً — الفجوة بينهما هي بالضبط ما فقدناه من تفصيل.
SELECT
  (SELECT COUNT(*)               FROM public.analytics_visitors) AS إجمالي_الزوار_منذ_الإطلاق,
  (SELECT COALESCE(SUM(page_views), 0) FROM public.analytics_visitors) AS إجمالي_المشاهدات_منذ_الإطلاق,
  (SELECT COUNT(*)               FROM public.analytics_daily)     AS أيام_في_الملخص;

SELECT
  MIN(day) FILTER (WHERE page_views IS NOT NULL) AS أقدم_يوم_بتفاصيل_كاملة,
  MIN(day)                                       AS أقدم_يوم_نعرف_زواره_الجدد,
  MAX(day)                                       AS آخر_يوم
FROM public.analytics_daily;
-- ============================================================================
