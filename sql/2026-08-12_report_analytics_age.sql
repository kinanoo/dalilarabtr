-- ============================================================================
-- تقرير تشخيصي: أحجام الجداول وتوزّع أعمار سجلّات التحليلات (2026-08-12)
--
-- لماذا: بعد تشغيل سياسة الاحتفاظ، نحتاج معرفة كم صفّاً حُذف فعلاً وكم بقي —
-- وهو ما يقرّر إن كانت نافذة الـ90 يوماً مناسبة أم واسعة أكثر من اللازم.
-- كان الحصول على هذا يتطلّب من صاحب الموقع تشغيل استعلام وإرسال لقطة شاشة.
--
-- الآن يُشغّله الـworkflow تلقائياً، ومخرجات psql تظهر في سجل GitHub Actions،
-- فتُقرأ من هناك مباشرةً بلا أي خطوة يدوية.
--
-- قراءة فقط + تشغيل دالة التنظيف المثبَّتة (وهي بطبيعتها آمنة ومتكرّرة).
-- ============================================================================

-- ─── 1) أكبر عشرة جداول ───
SELECT
  s.relname     AS الجدول,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS الحجم,
  s.n_live_tup  AS الصفوف
FROM pg_stat_user_tables s
JOIN pg_class c ON c.oid = s.relid
WHERE s.schemaname = 'public'
ORDER BY pg_total_relation_size(c.oid) DESC
LIMIT 10;

-- ─── 2) تشغيل التنظيف الآن وإظهار المحذوف ───
SELECT * FROM public.prune_log_tables();

-- ─── 3) توزّع أعمار سجلّات التحليلات ───
-- هذا هو الرقم الحاسم: كم صفاً يقع في كل نافذة زمنية. إن كانت الغالبية أحدث
-- من 30 يوماً فتقليص نافذة الاحتفاظ لن يوفّر شيئاً يُذكر، والحل يكون في تقليل
-- ما يُكتب أصلاً لا في حذف ما كُتب.
SELECT
  'أحدث من 30 يوماً'      AS الشريحة,
  COUNT(*)                 AS الصفوف,
  pg_size_pretty((COUNT(*) * (pg_total_relation_size('public.analytics_events')
    / GREATEST(NULLIF((SELECT COUNT(*) FROM public.analytics_events), 0), 1)))::bigint) AS الحجم_التقريبي
FROM public.analytics_events WHERE created_at >= now() - interval '30 days'
UNION ALL
SELECT '30 إلى 45 يوماً', COUNT(*),
  pg_size_pretty((COUNT(*) * (pg_total_relation_size('public.analytics_events')
    / GREATEST(NULLIF((SELECT COUNT(*) FROM public.analytics_events), 0), 1)))::bigint)
FROM public.analytics_events
WHERE created_at <  now() - interval '30 days' AND created_at >= now() - interval '45 days'
UNION ALL
SELECT '45 إلى 60 يوماً', COUNT(*),
  pg_size_pretty((COUNT(*) * (pg_total_relation_size('public.analytics_events')
    / GREATEST(NULLIF((SELECT COUNT(*) FROM public.analytics_events), 0), 1)))::bigint)
FROM public.analytics_events
WHERE created_at <  now() - interval '45 days' AND created_at >= now() - interval '60 days'
UNION ALL
SELECT 'أقدم من 60 يوماً', COUNT(*),
  pg_size_pretty((COUNT(*) * (pg_total_relation_size('public.analytics_events')
    / GREATEST(NULLIF((SELECT COUNT(*) FROM public.analytics_events), 0), 1)))::bigint)
FROM public.analytics_events WHERE created_at < now() - interval '60 days';

-- ─── 4) معدّل الكتابة اليومي (يقرّر إن كانت المشكلة في الحذف أم في الكتابة) ───
SELECT
  to_char(created_at::date, 'YYYY-MM-DD') AS اليوم,
  COUNT(*)                                AS أحداث
FROM public.analytics_events
WHERE created_at >= now() - interval '10 days'
GROUP BY created_at::date
ORDER BY created_at::date DESC;

-- ─── 5) أقدم وأحدث سجلّ (يبيّن العمر الفعلي للبيانات) ───
SELECT
  min(created_at)::date AS أقدم_سجل,
  max(created_at)::date AS أحدث_سجل,
  COUNT(*)              AS الإجمالي
FROM public.analytics_events;
