-- ============================================================================
-- «كم قرأه الناس؟» — أداء كل منشور على حدة (2026-08-15)
--
-- الطلب: لكل ما يُنشر — خبر أو مقال أو خدمة — رقمُ من دخله وقرأه: اليوم،
-- وآخر أسبوع، والإجمالي. ولوحة التحكم اليوم تعرض أرقاماً للموقع كلّه، فيعرف
-- صاحبه أن الزيارات 900 اليوم ولا يعرف أيُّ خبرٍ جلبها.
--
-- ── لماذا جدول جديد ────────────────────────────────────────────────────────
-- «الإجمالي» يصطدم بنافذة الاحتفاظ: analytics_events يُقلَّم عند 45 يوماً،
-- فمقالٌ عمره ثلاثة أشهر يفقد تاريخه ويبدو كأنه لم يُقرأ. وanalytics_daily
-- يحفظ الإجمال للموقع كلّه لا لكل صفحة.
--
-- فـanalytics_page_daily: صفّ لكل (يوم، مسار). لا يُقلَّم أبداً — عمود التاريخ
-- فيه اسمه day لا created_at، ودالة التنظيف تتخطّى ما لا يملك عمودها، تماماً
-- كما نجا analytics_visitors. وهنا الأمر بالتصميم لا بالمصادفة.
--
-- الحجم: ~300 مسار يومياً => ~110 ألف صفّ سنوياً (~10 ميغابايت). مقابل ذلك
-- يبقى تاريخ كل صفحة إلى الأبد بدل 45 يوماً.
--
-- ── ما هو دقيق وما هو تقريبي (بصراحة) ──────────────────────────────────────
--   * اليوم وآخر 7 أيام: من الأحداث الخام => قرّاء فريدون **حقيقيون**، بهوية
--     visitor_key الشاملة (تشمل من لم يوافق على التتبّع).
--   * الإجمالي: مجموع المشاهدات من الملخّص الدائم => **رقم مضبوط**، لأن
--     المشاهدات تُجمع بلا ازدواج.
--   * ولا يُعرض «قرّاء فريدون منذ النشر»: الزائر نفسه في يومين مختلفين لا
--     يمكن دمجه بعد حذف الخام، وجمع الأيام يعطي «زائر-يوم» لا زائراً. رقمٌ
--     يبدو دقيقاً وهو ليس كذلك أسوأ من رقم غائب.
--
-- ── الأداء ─────────────────────────────────────────────────────────────────
-- المسح الخام محصور بسبعة أيام (~10 آلاف صفّ) لا بثلاثين، والإجمالي يأتي من
-- جدول صغير مفهرس. واللوحة تستدعي RPC واحدة تُرجع الكل في نداء واحد بدل
-- نداء لكل بطاقة — الحصّة على Supabase محدودة والفرق تراكمي.
--
-- idempotent. لا يحذف شيئاً.
-- ============================================================================

-- ─── 1) الملخّص اليومي لكل صفحة ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics_page_daily (
    day        DATE   NOT NULL,
    page_path  TEXT   NOT NULL,
    views      BIGINT NOT NULL DEFAULT 0,
    visitors   BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (day, page_path)
);

COMMENT ON TABLE public.analytics_page_daily IS
  'ملخّص يومي دائم لكل صفحة. لا يُقلَّم أبداً — به يبقى «إجمالي القراءات» لكل منشور بعد حذف الأحداث الخام. راجع sql/2026-08-15_content_performance.sql';

ALTER TABLE public.analytics_page_daily ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_page_daily_path ON public.analytics_page_daily (page_path);

-- ─── 2) دالة التجميع ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.rollup_page_daily(p_days INT DEFAULT 3)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    since TIMESTAMPTZ := NOW() - make_interval(days => GREATEST(p_days, 1));
    n     BIGINT;
BEGIN
    INSERT INTO public.analytics_page_daily (day, page_path, views, visitors)
    SELECT
        (ae.created_at AT TIME ZONE 'Europe/Istanbul')::date,
        ae.page_path,
        COUNT(*),
        COUNT(DISTINCT public.visitor_key(ae.ip_hash, ae.visitor_id, ae.anon_key))
    FROM public.analytics_events ae
    WHERE ae.event_name = 'page_view'
      AND ae.created_at >= since
      AND ae.page_path IS NOT NULL
      AND ae.page_path <> ''
    GROUP BY 1, 2
    -- GREATEST لا الإسناد المباشر: نافذة التجميع أوسع من نافذة الاحتفاظ عمداً،
    -- فتمرّ على يومٍ واقعٍ على حدّ الـ45 يوماً وقد حُذف نصف أحداثه. الإسناد
    -- المباشر كان سيستبدل رقماً صحيحاً بآخر منقوص. عدّاد يومٍ لا ينقص أبداً.
    ON CONFLICT (day, page_path) DO UPDATE SET
        views    = GREATEST(public.analytics_page_daily.views,    EXCLUDED.views),
        visitors = GREATEST(public.analytics_page_daily.visitors, EXCLUDED.visitors);

    GET DIAGNOSTICS n = ROW_COUNT;
    RETURN n;
END
$fn$;

COMMENT ON FUNCTION public.rollup_page_daily(INT) IS
  'تجميع مشاهدات كل صفحة يومياً في analytics_page_daily. تُجدوَل قبل rollup_analytics_daily وقبل التنظيف.';

-- ─── 3) تعبئة تاريخية ممّا تبقّى من الأحداث الخام ───────────────────────────
-- 60 يوماً تغطّي كل ما نجا من نافذة الـ45 مع هامش. ما هو أقدم فقد ولا يُسترجَع
-- — وهذا هو بالضبط سبب وجود هذا الجدول من الآن فصاعداً.
SELECT public.rollup_page_daily(60) AS صفوف_عُبِّئت;

-- ─── 4) الدالة التي تقرأها اللوحة ───────────────────────────────────────────
-- نداء واحد يُرجع: إجماليات الموقع + قائمة آخر المنشورات بأرقام كلٍّ منها.
CREATE OR REPLACE FUNCTION public.get_content_performance(p_limit INT DEFAULT 25)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    today_start TIMESTAMPTZ := (((NOW() AT TIME ZONE 'Europe/Istanbul')::date)::timestamp) AT TIME ZONE 'Europe/Istanbul';
    week_start  TIMESTAMPTZ := NOW() - INTERVAL '7 days';
    lim         INT := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 100);
    result      JSON;
BEGIN
    WITH
    -- المنشورات الثلاثة في جدول واحد، ولكلٍّ مساره كما يراه الزائر.
    items AS (
        SELECT 'article'::text AS kind, a.title, a.created_at AS published_at,
               '/article/' || a.slug AS path, a.slug AS ref
        FROM public.articles a
        WHERE a.slug IS NOT NULL AND a.slug <> '' AND a.status = 'approved'
        UNION ALL
        SELECT 'update', u.title, u.created_at,
               '/updates/' || u.id::text, u.id::text
        FROM public.updates u
        WHERE u.active IS NOT FALSE
        UNION ALL
        SELECT 'service', s.name, s.created_at,
               '/services/' || COALESCE(NULLIF(s.slug, ''), s.id::text),
               COALESCE(NULLIF(s.slug, ''), s.id::text)
        FROM public.service_providers s
        WHERE s.status = 'approved'
    ),
    recent AS (
        SELECT * FROM items
        WHERE published_at IS NOT NULL
        ORDER BY published_at DESC
        LIMIT lim
    ),
    -- المسح الخام محصور بالمسارات المعروضة وبسبعة أيام — لا بالجدول كلّه.
    raw AS (
        SELECT
            ae.page_path,
            COUNT(*) FILTER (WHERE ae.created_at >= today_start) AS views_today,
            COUNT(DISTINCT public.visitor_key(ae.ip_hash, ae.visitor_id, ae.anon_key))
                FILTER (WHERE ae.created_at >= today_start)      AS readers_today,
            COUNT(*)                                             AS views_week,
            COUNT(DISTINCT public.visitor_key(ae.ip_hash, ae.visitor_id, ae.anon_key))
                                                                 AS readers_week
        FROM public.analytics_events ae
        JOIN recent r ON r.path = ae.page_path
        WHERE ae.event_name = 'page_view'
          AND ae.created_at >= week_start
        GROUP BY ae.page_path
    ),
    -- الإجمالي من الملخّص الدائم: مضبوط ولا يتأثّر بالتقليم.
    lifetime AS (
        SELECT d.page_path, SUM(d.views) AS views_total, MIN(d.day) AS first_day
        FROM public.analytics_page_daily d
        JOIN recent r ON r.path = d.page_path
        GROUP BY d.page_path
    )
    SELECT json_build_object(
        'generated_at', NOW(),
        -- إجماليات الموقع كلّه، للسياق الذي تُقرأ به أرقام المنشور الواحد.
        'site', json_build_object(
            'views_today', (
                SELECT COUNT(*) FROM public.analytics_events
                WHERE event_name = 'page_view' AND created_at >= today_start),
            'readers_today', (
                SELECT COUNT(DISTINCT public.visitor_key(ip_hash, visitor_id, anon_key))
                FROM public.analytics_events
                WHERE event_name = 'page_view' AND created_at >= today_start),
            'views_week', (
                SELECT COUNT(*) FROM public.analytics_events
                WHERE event_name = 'page_view' AND created_at >= week_start),
            'readers_week', (
                SELECT COUNT(DISTINCT public.visitor_key(ip_hash, visitor_id, anon_key))
                FROM public.analytics_events
                WHERE event_name = 'page_view' AND created_at >= week_start),
            'views_total', (SELECT COALESCE(SUM(views), 0) FROM public.analytics_page_daily),
            'pages_tracked', (SELECT COUNT(DISTINCT page_path) FROM public.analytics_page_daily),
            'tracking_since', (SELECT MIN(day) FROM public.analytics_page_daily)
        ),
        'items', COALESCE((
            SELECT json_agg(t ORDER BY t.published_at DESC) FROM (
                SELECT
                    r.kind, r.title, r.path, r.ref, r.published_at,
                    COALESCE(w.views_today,   0) AS views_today,
                    COALESCE(w.readers_today, 0) AS readers_today,
                    COALESCE(w.views_week,    0) AS views_week,
                    COALESCE(w.readers_week,  0) AS readers_week,
                    COALESCE(l.views_total,   0) AS views_total,
                    l.first_day
                FROM recent r
                LEFT JOIN raw      w ON w.page_path = r.path
                LEFT JOIN lifetime l ON l.page_path = r.path
            ) t
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END
$fn$;

COMMENT ON FUNCTION public.get_content_performance(INT) IS
  'أداء آخر المنشورات: قرّاء اليوم والأسبوع (من الخام، فريدون حقيقيون) وإجمالي المشاهدات (من الملخّص الدائم). راجع sql/2026-08-15_content_performance.sql';

GRANT EXECUTE ON FUNCTION public.get_content_performance(INT) TO anon, authenticated;

-- ─── 5) الجدولة ─────────────────────────────────────────────────────────────
-- 03:03 UTC — قبل rollup_analytics_daily (03:05) وقبل تنظيف الأحد (03:17).
-- الترتيب ليس تجميلاً: التجميع بعد الحذف يجمّع فراغاً.
DO $sched$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job j WHERE j.jobname = 'rollup-page-daily') THEN
      PERFORM cron.unschedule('rollup-page-daily');
    END IF;
    PERFORM cron.schedule(
      'rollup-page-daily',
      '3 3 * * *',
      $job$SELECT public.rollup_page_daily(3);$job$
    );
    RAISE NOTICE 'تمت جدولة تجميع الصفحات عبر pg_cron (يومياً 03:03 UTC).';
  ELSE
    RAISE NOTICE 'pg_cron غير مفعّل — تجميع الصفحات لن يعمل تلقائياً، وإجمالي القراءات سيتجمّد.';
  END IF;
END
$sched$;

-- ─── 6) تحقّق ───────────────────────────────────────────────────────────────
DO $check$
DECLARE
  rows_n   bigint;
  probe    json;
  n_items  int;
BEGIN
  SELECT COUNT(*) INTO rows_n FROM public.analytics_page_daily;
  IF rows_n = 0 THEN
    RAISE EXCEPTION 'FAILED: التعبئة لم تُنتج صفّاً واحداً — راجع أن analytics_events فيه page_view.';
  END IF;

  SELECT public.get_content_performance(10) INTO probe;
  IF probe IS NULL THEN
    RAISE EXCEPTION 'FAILED: get_content_performance لم تُرجع شيئاً.';
  END IF;

  SELECT json_array_length(probe->'items') INTO n_items;
  IF n_items = 0 THEN
    RAISE EXCEPTION 'FAILED: لا منشورات في النتيجة — راجع شروط الحالة (approved/active).';
  END IF;

  RAISE NOTICE 'OK: % صفّاً في ملخّص الصفحات، % مساراً مرصوداً، % منشوراً في العيّنة.',
    rows_n, probe->'site'->>'pages_tracked', n_items;
  RAISE NOTICE 'إجمالي مشاهدات الموقع منذ بدء الرصد (%): %.',
    probe->'site'->>'tracking_since', probe->'site'->>'views_total';
END
$check$;

-- ─── 7) مراجعة: أكثر عشرة منشورات قراءةً هذا الأسبوع ───────────────────────
SELECT
  t->>'kind'                       AS النوع,
  left(t->>'title', 55)            AS العنوان,
  (t->>'readers_today')::int       AS قرّاء_اليوم,
  (t->>'readers_week')::int        AS قرّاء_الأسبوع,
  (t->>'views_total')::bigint      AS إجمالي_المشاهدات
FROM json_array_elements(public.get_content_performance(40)->'items') AS t
ORDER BY (t->>'readers_week')::int DESC
LIMIT 10;
