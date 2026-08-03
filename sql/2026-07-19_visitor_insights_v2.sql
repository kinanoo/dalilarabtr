-- ============================================================================
-- تتبع الزوار v2 — تعريف صحيح ومتين للزائر العائد (2026-07-19)
-- ============================================================================
-- لماذا v2؟ نسخة 18 تموز عرّفت «العائد» بأنه: ظهر قبل الفترة ورجع خلالها
-- (first_seen < window_start AND last_seen >= window_start). هذا التعريف:
--   • خاطئ مفاهيمياً: هو مقياس «إعادة تنشيط بعد خمول»، وليس «زائر يعود».
--   • مستحيل تاريخياً: قبل 18 تموز كانت البصمة (ip_hash) تتبدّل يومياً
--     (sha256(ip:اليوم))، فكل بصمة قديمة يومها واحد فقط ⇒ العائدون ≈ صفر.
--
-- التعريف الصحيح المطبّق هنا (يعمل فوراً مع البصمة الثابتة الجديدة):
--   «زائر عائد» = بصمة ظهرت في يومين مختلفين على الأقل ضمن الفترة.
--   هذا محصّن ضد الدورة اليومية القديمة (بصمة يومها واحد لا تُحتسب عائدة
--   أبداً — وهو الصحيح، لأننا فعلاً لا نعرف إن عادت). ومع تراكم أيام
--   البصمة الثابتة (بدأت 18 تموز) يرتفع الرقم الحقيقي يوماً بعد يوم.
--
-- كل الأرقام تُحسب مباشرة من analytics_events (لا اعتماد على جدول ملخّص قد
-- يكون ملوّثاً بالتعبئة القديمة). الحجم صغير (~22 ألف مشاهدة/شهر) فالأداء فوري.
--
-- كيفية التشغيل: Supabase → SQL Editor → New Query → الصق → Run.
-- idempotent — إعادة التشغيل آمنة. لا يحذف بيانات.
-- ============================================================================

-- ─── دالة مساعدة: إحصاءات فترة واحدة من الأحداث الخام ───────────────────────
CREATE OR REPLACE FUNCTION public._visitor_period_stats(p_start TIMESTAMPTZ)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH visits AS (
        SELECT
            COALESCE(NULLIF(ip_hash, ''), NULLIF(visitor_id, '')) AS vkey,
            (created_at AT TIME ZONE 'Europe/Istanbul')::date     AS day
        FROM public.analytics_events
        WHERE event_name = 'page_view'
          AND created_at >= p_start
          AND COALESCE(NULLIF(ip_hash, ''), NULLIF(visitor_id, '')) IS NOT NULL
    ),
    per_visitor AS (
        SELECT vkey,
               COUNT(DISTINCT day) AS days_active,
               COUNT(*)            AS views
        FROM visits
        GROUP BY vkey
    )
    SELECT json_build_object(
        -- إجمالي المشاهدات (غير فريدة) في الفترة
        'page_views',        (SELECT COALESCE(SUM(views), 0) FROM per_visitor),
        -- زوار فريدون نشطون في الفترة (يطابق دلالة «الزوار الفريدين» المعتادة)
        'active_visitors',   (SELECT COUNT(*) FROM per_visitor),
        -- زوار عائدون: ظهروا في يومين مختلفين على الأقل ⇒ عادوا فعلاً
        'returning_visitors',(SELECT COUNT(*) FROM per_visitor WHERE days_active >= 2),
        -- زوار ليوم واحد فقط ضمن الفترة
        'one_day_visitors',  (SELECT COUNT(*) FROM per_visitor WHERE days_active = 1),
        -- زوار مكثفون: 5 مشاهدات فأكثر (يلتقط الزوار الأوفياء فوراً حتى خلال يوم)
        'engaged_visitors',  (SELECT COUNT(*) FROM per_visitor WHERE views >= 5)
    );
$$;

-- ─── الدالة الرئيسية للداشبورد ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_visitor_insights()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT json_build_object(
        -- تاريخ بدء التتبّع الدقيق (البصمة الثابتة). الأرقام قبله غير موثوقة
        -- لأن البصمة كانت تتبدّل يومياً — تُعرض للشفافية.
        'tracking_since',  '2026-07-18',
        'week',            public._visitor_period_stats(NOW() - INTERVAL '7 days'),
        'month',           public._visitor_period_stats(NOW() - INTERVAL '30 days'),
        'today',           public._visitor_period_stats(date_trunc('day', NOW() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul'),
        'top_pages_week', (
            SELECT COALESCE(json_agg(t), '[]'::json) FROM (
                SELECT ae.page_path,
                       COUNT(*) AS views,
                       COUNT(DISTINCT COALESCE(NULLIF(ae.ip_hash, ''), NULLIF(ae.visitor_id, ''))) AS uniques
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
                       COUNT(DISTINCT COALESCE(NULLIF(ae.ip_hash, ''), NULLIF(ae.visitor_id, ''))) AS uniques
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
$$;

GRANT EXECUTE ON FUNCTION public._visitor_period_stats(TIMESTAMPTZ) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_visitor_insights()             TO anon, authenticated;

-- ─── تشخيص + تحقّق: يُثبت الآلية بالأرقام الحقيقية ──────────────────────────
-- (أ) كم بصمة ثابتة ظهرت في يومين مختلفين خلال الأيام الأخيرة؟ = العائدون الحقيقيون.
-- (ب) توزيع أيام النشاط لكل بصمة في آخر 7 أيام — يُظهر أثر البصمة الثابتة الجديدة.
WITH v AS (
    SELECT COALESCE(NULLIF(ip_hash,''), NULLIF(visitor_id,'')) AS vkey,
           (created_at AT TIME ZONE 'Europe/Istanbul')::date   AS day
    FROM public.analytics_events
    WHERE event_name='page_view'
      AND created_at >= NOW() - INTERVAL '7 days'
      AND COALESCE(NULLIF(ip_hash,''), NULLIF(visitor_id,'')) IS NOT NULL
),
pv AS (SELECT vkey, COUNT(DISTINCT day) d FROM v GROUP BY vkey)
SELECT
    (SELECT COUNT(*) FROM pv)                       AS visitors_7d,
    (SELECT COUNT(*) FROM pv WHERE d >= 2)          AS returning_2plus_days,
    (SELECT COUNT(*) FROM pv WHERE d >= 3)          AS returning_3plus_days,
    (SELECT MAX(d) FROM pv)                         AS max_days_single_visitor;

-- عيّنة كاملة من الدالة كما سيقرأها الداشبورد:
SELECT public.get_visitor_insights() AS insights;
-- ============================================================================
