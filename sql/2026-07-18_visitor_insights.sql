-- ============================================================================
-- تتبع الزوار الجدد والعائدين + أهم الصفحات أسبوعياً وشهرياً (2026-07-18)
-- ============================================================================
-- يعمل مع تعديل /api/track الذي جعل بصمة الزائر (ip_hash) ثابتة عبر الأيام
-- (كانت تتبدل يومياً فيستحيل معرفة «زائر عائد»). لا شيء يُخزَّن على جهاز
-- الزائر — البصمة hash أحادي الاتجاه على السيرفر فقط.
--
-- ينشئ:
--   1) جدول ملخص analytics_visitors (بصمة → أول زيارة، آخر زيارة، عدد
--      المشاهدات) يتحدث تلقائياً بتريغر مع كل حدث — فتصير استعلامات
--      جديد/عائد لحظية بدل مسح جدول الأحداث الضخم (الذي سبق أن سبّب
--      statement timeout في الداشبورد).
--   2) تعبئة أولية من البيانات التاريخية (مرة واحدة).
--   3) دالة get_visitor_insights() تعيد JSON جاهزاً للداشبورد:
--      أسبوع/شهر × (جدد، عائدون، مشاهدات) + أهم 10 صفحات لكل فترة.
--
-- ملاحظة مهمة عن الدقة: البصمات التاريخية كانت تتبدل يومياً، لذا أرقام
-- «جديد/عائد» تبدأ بالتدقق من اليوم فصاعداً وتصير موثوقة تماماً خلال
-- أسبوع. (أول أيام: أغلب الزوار سيظهرون «جدداً» لأن بصمتهم الثابتة ظهرت
-- للتو — هذا متوقع ويصحح نفسه.)
--
-- كيفية التشغيل: Supabase → SQL Editor → New Query → الصق → Run.
-- idempotent — إعادة التشغيل آمنة.
-- ============================================================================

-- ─── 1) جدول الملخص ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics_visitors (
    vkey       TEXT PRIMARY KEY,
    first_seen TIMESTAMPTZ NOT NULL,
    last_seen  TIMESTAMPTZ NOT NULL,
    page_views BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_av_first_seen ON public.analytics_visitors (first_seen);
CREATE INDEX IF NOT EXISTS idx_av_last_seen  ON public.analytics_visitors (last_seen);

-- قراءة عامة ممنوعة — الوصول فقط عبر الدالة (SECURITY DEFINER) والتريغر.
ALTER TABLE public.analytics_visitors ENABLE ROW LEVEL SECURITY;

-- ─── 2) التريغر: يحدّث الملخص مع كل page_view ───────────────────────────────
CREATE OR REPLACE FUNCTION public.track_visitor_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    k TEXT := COALESCE(NULLIF(NEW.ip_hash, ''), NULLIF(NEW.visitor_id, ''));
BEGIN
    IF NEW.event_name = 'page_view' AND k IS NOT NULL THEN
        INSERT INTO public.analytics_visitors (vkey, first_seen, last_seen, page_views)
        VALUES (k, COALESCE(NEW.created_at, NOW()), COALESCE(NEW.created_at, NOW()), 1)
        ON CONFLICT (vkey) DO UPDATE
            SET last_seen  = GREATEST(public.analytics_visitors.last_seen, EXCLUDED.last_seen),
                page_views = public.analytics_visitors.page_views + 1;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_visitor_summary ON public.analytics_events;
CREATE TRIGGER trg_track_visitor_summary
    AFTER INSERT ON public.analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION public.track_visitor_summary();

-- ─── 3) تعبئة أولية من التاريخ (مرة واحدة، آمنة الإعادة) ────────────────────
INSERT INTO public.analytics_visitors (vkey, first_seen, last_seen, page_views)
SELECT
    COALESCE(NULLIF(ip_hash, ''), NULLIF(visitor_id, '')) AS k,
    MIN(created_at),
    MAX(created_at),
    COUNT(*)
FROM public.analytics_events
WHERE event_name = 'page_view'
  AND COALESCE(NULLIF(ip_hash, ''), NULLIF(visitor_id, '')) IS NOT NULL
GROUP BY 1
ON CONFLICT (vkey) DO NOTHING;

-- ─── 4) دالة الإحصائيات للداشبورد ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_visitor_insights()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    week_start  TIMESTAMPTZ := NOW() - INTERVAL '7 days';
    month_start TIMESTAMPTZ := NOW() - INTERVAL '30 days';
BEGIN
    RETURN json_build_object(
        'week', json_build_object(
            'new_visitors', (
                SELECT COUNT(*) FROM public.analytics_visitors
                WHERE first_seen >= week_start
            ),
            'returning_visitors', (
                SELECT COUNT(*) FROM public.analytics_visitors
                WHERE last_seen >= week_start AND first_seen < week_start
            ),
            'page_views', (
                SELECT COUNT(*) FROM public.analytics_events
                WHERE event_name = 'page_view' AND created_at >= week_start
            )
        ),
        'month', json_build_object(
            'new_visitors', (
                SELECT COUNT(*) FROM public.analytics_visitors
                WHERE first_seen >= month_start
            ),
            'returning_visitors', (
                SELECT COUNT(*) FROM public.analytics_visitors
                WHERE last_seen >= month_start AND first_seen < month_start
            ),
            'page_views', (
                SELECT COUNT(*) FROM public.analytics_events
                WHERE event_name = 'page_view' AND created_at >= month_start
            )
        ),
        'top_pages_week', (
            SELECT COALESCE(json_agg(t), '[]'::json) FROM (
                SELECT ae.page_path,
                       COUNT(*) AS views,
                       COUNT(DISTINCT COALESCE(NULLIF(ae.ip_hash, ''), NULLIF(ae.visitor_id, ''))) AS uniques
                FROM public.analytics_events ae
                WHERE ae.event_name = 'page_view'
                  AND ae.created_at >= week_start
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
                  AND ae.created_at >= month_start
                  AND ae.page_path IS NOT NULL
                GROUP BY ae.page_path
                ORDER BY views DESC
                LIMIT 10
            ) t
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_visitor_insights() TO anon, authenticated;

-- ─── 5) تحقّق ───────────────────────────────────────────────────────────────
SELECT
    (SELECT COUNT(*) FROM public.analytics_visitors)                          AS visitors_summarized,
    (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'trg_track_visitor_summary') AS trigger_installed,
    public.get_visitor_insights()                                             AS insights_sample;
-- المتوقع: visitors_summarized > 0، trigger_installed = 1، وinsights_sample
-- يعرض JSON فيه week/month/top_pages.
-- ============================================================================
