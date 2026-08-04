-- ============================================================================
-- سياسة الاحتفاظ بالبيانات وتنظيف الجداول السجلّية (2026-08-04)
--
-- الدافع: حجم قاعدة البيانات على Supabase بلغ 24% من حدّ 500 ميغابايت، وهو —
-- بخلاف الـEgress — لا يُصفَّر شهرياً بل يتراكم. الجداول التي تنمو بلا سقف هي
-- جداول السجلّات (تحليلات، زوّار، محاولات دخول، سجل نشاط) لا جداول المحتوى.
--
-- لماذا هذه النوافذ بالذات: فُحصت كل استعلامات التحليلات في المستودع
-- (sql/2026-07-18_visitor_insights.sql و2026-07-19_visitor_insights_v2.sql
-- و2026-07-08_dashboard_stats_perf.sql وscripts/migrate-analytics-v2.sql)،
-- وأطول نافذة يستعملها أي منها هي INTERVAL '30 days'. فالاحتفاظ بـ90 يوماً
-- يمنح هامشاً ثلاثة أضعاف أطول استعلام، وما قبلها لا تقرأه أي لوحة.
--
-- ما لا يُمسّ إطلاقاً: articles, updates, comments, questions,
-- service_providers, service_reviews, zone_reports, member_profiles,
-- newsletter_subscribers, push_subscriptions — كلها محتوى أو اشتراكات، لا سجلّات.
--
-- الملف: (1) يعرض أحجام الجداول قبل التنظيف، (2) ينظّف مرّة واحدة الآن،
-- (3) يعرض الأحجام بعده، (4) يثبّت دالة تنظيف دورية ويجدولها إن توفّر pg_cron.
--
-- آمن لإعادة التشغيل. كل حذف محميّ بفحص وجود الجدول (to_regclass) فلا يفشل
-- الملف إن كان جدول ما غير موجود في قاعدتك.
-- شغّله مرّة واحدة في Supabase <- SQL Editor.
-- ============================================================================

-- ─── 1) تقرير الأحجام قبل التنظيف ───
SELECT
  'قبل التنظيف' AS المرحلة,
  s.relname     AS الجدول,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS الحجم,
  s.n_live_tup  AS عدد_الصفوف_التقريبي
FROM pg_stat_user_tables s
JOIN pg_class c ON c.oid = s.relid
WHERE s.schemaname = 'public'
ORDER BY pg_total_relation_size(c.oid) DESC
LIMIT 20;

-- ─── 2) دالة التنظيف (تُستخدم الآن ودورياً لاحقاً) ───
CREATE OR REPLACE FUNCTION public.prune_log_tables()
RETURNS TABLE(tbl text, deleted bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  -- الجدول، عمود الوقت، عدد أيام الاحتفاظ.
  -- النوافذ مشتقّة من أطول استعلام فعلي (30 يوماً) مع هامش وافر.
  targets CONSTANT text[][] := ARRAY[
    ['analytics_events',     'created_at',   '90'],   -- أضخم جدول سجلّي عادةً
    ['analytics_visitors',   'created_at',   '90'],
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
  FOR i IN 1 .. array_length(targets, 1) LOOP
    t         := targets[i][1];
    ts_col    := targets[i][2];
    keep_days := targets[i][3]::int;

    -- تخطَّ الجدول إن لم يكن موجوداً، أو إن لم يحتوِ عمود الوقت المتوقَّع.
    CONTINUE WHEN to_regclass('public.' || t) IS NULL;
    -- الأعمدة مؤهَّلة بـcols. لأن اسم أي مُخرَج للدالة يحجب عمود الجدول
    -- الذي يحمل الاسم نفسه داخل plpgsql — وهو ما كان يجعل الفحص بلا معنى.
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
  'حذف صفوف الجداول السجلّية الأقدم من نافذة الاحتفاظ. لا تمسّ جداول المحتوى. راجع sql/2026-08-04_data_retention_policy.sql';

-- ─── 3) تشغيل التنظيف الآن (النتيجة تُعرض كجدول) ───
SELECT * FROM public.prune_log_tables();

-- ─── 4) استرجاع المساحة فعلياً ───
-- الحذف وحده يُحرّر مساحة لإعادة الاستخدام داخل الجدول لكنه لا يُنقص حجم
-- الملف على القرص — وهو ما يقيسه مؤشر Supabase. VACUUM FULL يُنقصه فعلاً،
-- ويأخذ قفلاً حصرياً لثوانٍ على هذه الجداول الصغيرة نسبياً.
DO $vac$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['analytics_events','analytics_visitors','model_link_views','admin_login_attempts','admin_activity_log']
  LOOP
    CONTINUE WHEN to_regclass('public.' || t) IS NULL;
    -- VACUUM لا يعمل داخل معاملة، لذا نكتفي هنا بـANALYZE وننبّه أدناه.
    EXECUTE format('ANALYZE public.%I', t);
  END LOOP;
  RAISE NOTICE 'تمّ ANALYZE. لاسترجاع المساحة على القرص شغّل بعد هذا الملف، كلَّ سطر وحده:';
  RAISE NOTICE '  VACUUM FULL public.analytics_events;';
  RAISE NOTICE '  VACUUM FULL public.analytics_visitors;';
END
$vac$;

-- ─── 5) تقرير الأحجام بعد التنظيف ───
SELECT
  'بعد التنظيف' AS المرحلة,
  s.relname     AS الجدول,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS الحجم,
  s.n_live_tup  AS عدد_الصفوف_التقريبي
FROM pg_stat_user_tables s
JOIN pg_class c ON c.oid = s.relid
WHERE s.schemaname = 'public'
ORDER BY pg_total_relation_size(c.oid) DESC
LIMIT 20;

-- ─── 6) الجدولة الدورية (أسبوعياً) إن كان pg_cron مفعّلاً ───
-- إن لم يكن مفعّلاً فلن يفشل الملف — ستظهر ملاحظة بكيفية تفعيله.
DO $sched$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job j WHERE j.jobname = 'prune-log-tables') THEN
      PERFORM cron.unschedule('prune-log-tables');
    END IF;

    PERFORM cron.schedule(
      'prune-log-tables',
      '17 3 * * 0',                       -- كل أحد 03:17 UTC (خارج ساعات الذروة)
      $job$SELECT public.prune_log_tables();$job$
    );
    RAISE NOTICE 'تمت جدولة التنظيف أسبوعياً عبر pg_cron (كل أحد 03:17 UTC).';
  ELSE
    RAISE NOTICE 'pg_cron غير مفعّل — التنظيف تمّ مرّة واحدة الآن فقط.';
    RAISE NOTICE 'لتفعيل التكرار: Supabase ← Database ← Extensions ← ابحث pg_cron ← Enable، ثم أعد تشغيل هذا الملف.';
  END IF;
END
$sched$;

-- ─── 7) تحقّق نهائي ───
DO $check$
DECLARE
  has_fn boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'prune_log_tables'
  ) INTO has_fn;

  IF NOT has_fn THEN
    RAISE EXCEPTION 'FAILED: دالة prune_log_tables لم تُنشأ';
  END IF;
  RAISE NOTICE 'OK: سياسة الاحتفاظ مثبّتة والتنظيف الأول تمّ.';
END
$check$;
