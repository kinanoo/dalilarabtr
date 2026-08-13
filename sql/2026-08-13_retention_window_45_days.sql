-- ============================================================================
-- تقليص نافذة الاحتفاظ لسجلّات التحليلات إلى 45 يوماً (2026-08-13)
--
-- مبنيّ على قياس فعلي، لا تقدير. التقرير التشخيصي
-- (sql/2026-08-12_report_analytics_age.sql) أظهر في سجل GitHub Actions:
--
--   الإجمالي            124,140 صفاً   (72 MB)
--   أقدم سجل            2026-05-15     أي 90 يوماً بالضبط
--   45 إلى 60 يوماً      20,846 صفاً    (~12 MB)
--   أقدم من 60 يوماً     20,009 صفاً    (~12 MB)
--   معدّل الكتابة        2,500-4,800 حدثاً يومياً، وفي ازدياد
--
-- الاستنتاج: نافذة الـ90 يوماً لم تحذف شيئاً يُذكر لأن البيانات نفسها لا تتجاوز
-- 90 يوماً — فالنافذة كانت مساوية لعمر البيانات لا أقصر منه. وبمعدّل الكتابة
-- الحالي تستقرّ الحالة عند ~150 MB وهو 30% من حدّ 500 MB لجدول واحد.
--
-- 45 يوماً تحذف فوراً ~40,855 صفاً (~24 MB)، وتُنصّف الحالة المستقرّة إلى
-- ~75 MB. وتبقى النافذة **ضعف** أطول استعلام فعلي في المستودع (30 يوماً)،
-- فلا لوحة تفقد بياناتها.
--
-- الجداول الأخرى تبقى كما هي: analytics_visitors أصغر بـ13 ضعفاً (5.4 MB)،
-- وadmin_activity_log أثر تدقيقي يستحق 180 يوماً.
--
-- ملاحظة: هذا يستبدل الدالة فقط. التنظيف الأسبوعي المجدول عبر pg_cron يستدعي
-- الاسم نفسه، فيلتقط النافذة الجديدة تلقائياً بلا إعادة جدولة.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prune_log_tables()
RETURNS TABLE(tbl text, deleted bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  -- الجدول، عمود الوقت، أيام الاحتفاظ.
  targets CONSTANT text[][] := ARRAY[
    ['analytics_events',     'created_at',   '45'],   -- ضُيّقت من 90 بناءً على القياس
    ['analytics_visitors',   'created_at',   '90'],   -- 5.4 MB فقط — لا داعي للتضييق
    ['model_link_views',     'created_at',   '90'],
    ['admin_login_attempts', 'attempted_at', '7'],
    ['admin_activity_log',   'created_at',   '180']   -- أثر تدقيقي
  ];
  t          text;
  ts_col     text;
  keep_days  int;
  n          bigint;
  i          int;
BEGIN
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
  'حذف صفوف الجداول السجلّية الأقدم من نافذة الاحتفاظ (analytics_events: 45 يوماً). لا تمسّ جداول المحتوى. راجع sql/2026-08-13_retention_window_45_days.sql';

-- ─── تشغيل التنظيف بالنافذة الجديدة وإظهار المحذوف ───
SELECT * FROM public.prune_log_tables();

-- ─── الحالة بعد التنظيف ───
SELECT
  s.relname     AS الجدول,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS الحجم,
  s.n_live_tup  AS الصفوف
FROM pg_stat_user_tables s
JOIN pg_class c ON c.oid = s.relid
WHERE s.schemaname = 'public'
ORDER BY pg_total_relation_size(c.oid) DESC
LIMIT 6;

-- ─── تحقّق نهائي ───
DO $check$
DECLARE
  remaining bigint;
  oldest    date;
BEGIN
  -- محميّ بالفحص نفسه الذي تستعمله الدالة: قاعدة بلا هذا الجدول (بيئة اختبار
  -- مثلاً) يجب أن تتخطّى التحقّق لا أن تُفشل الملف.
  IF to_regclass('public.analytics_events') IS NULL THEN
    RAISE NOTICE 'OK: الدالة حُدِّثت. جدول analytics_events غير موجود هنا — تُخطّي التحقّق.';
    RETURN;
  END IF;

  SELECT COUNT(*), min(created_at)::date INTO remaining, oldest
  FROM public.analytics_events;

  IF oldest IS NOT NULL AND oldest < (now() - interval '46 days')::date THEN
    RAISE EXCEPTION 'FAILED: ما زال هناك سجلّ أقدم من 45 يوماً (%)', oldest;
  END IF;
  RAISE NOTICE 'OK: نافذة 45 يوماً مطبَّقة. المتبقي % صفاً، أقدمها %.', remaining, oldest;
  RAISE NOTICE 'ملاحظة: لاسترجاع المساحة على القرص شغّل لاحقاً: VACUUM FULL public.analytics_events;';
END
$check$;
