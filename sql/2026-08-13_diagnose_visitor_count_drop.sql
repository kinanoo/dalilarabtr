-- ============================================================================
-- تشخيص: لماذا انخفض رقم «زيارات اليوم (زائر فريد)» في لوحة التحكم؟ (2026-08-13)
--
-- البلاغ: صاحب الموقع لاحظ أن عدد الزيارات الفريدة بدأ ينخفض «من يومين»،
-- وسأل إن كان ذلك بسبب حذف صفوف analytics_events في سياسة الاحتفاظ الجديدة.
--
-- ما نعرفه قبل هذا الملف (من سجل GitHub Actions، تشغيل 2026-08-13):
--   * حجم الأحداث اليومي لم ينخفض: 2,495 / 2,502 / 4,775 في 11-12 أغسطس.
--   * الحذف طال ما قبل 2026-06-29 فقط، ولا يمسّ اليومين الأخيرين إطلاقاً.
--   * «مشاهدات اليوم» 721 مقابل «زائر فريد» 20 — نسبة 36 صفحة للزائر،
--     وهي مستحيلة. المتوسط الحقيقي في بطاقتَي الأسبوع والشهر ~3.
-- أي أن العطل في **عدّ الزوار**، لا في عدد الزوار.
--
-- الفرضية الأولى: انهيار الموافقة على التتبّع.
--   /api/track يكتب ip_hash فقط عند الموافقة، وvisitor_id = '' بدونها.
--   وget_dashboard_stats تعدّ COUNT(DISTINCT COALESCE(ip_hash, visitor_id))
--   بلا NULLIF — فكل زائر بلا موافقة يصير COALESCE(NULL,'') = '' أي دلواً
--   واحداً مشتركاً. النتيجة: «20» = ~19 موافقاً + دلو واحد لكل الباقين.
--   (بطاقتا الأسبوع/الشهر تستعملان NULLIF فتتجاهلهم بدل أن تدمجهم — لذلك
--    تبدوان سليمتين، وهما في الحقيقة تعدّان الموافقين وحدهم.)
--
-- الفرضية الثانية: موجة زحف آلي بمُعرِّف متصفّح غير مُدرَج في فلتر البوتات،
--   ترفع المشاهدات ولا ترفع الزوار.
--
-- هذا الملف قراءة فقط: لا INSERT ولا UPDATE ولا DELETE ولا تعديل دوال.
-- مخرجاته تظهر في سجل GitHub Actions فتُقرأ مباشرةً.
-- ============================================================================

-- ─── 1) الفحص الحاسم: المشاهدات مقابل الهوية، يوماً بيوم ────────────────────
-- إن انهار عمود «زوار_بموافقة» في 11-12 أغسطس بينما بقي «مشاهدات» ثابتاً،
-- فالسبب انهيار الموافقة (الفرضية الأولى) — وهو عطل في الواجهة لا في القاعدة.
-- وعمود «كما_تحسبها_اللوحة» يُظهر بالضبط الرقم الذي يراه صاحب الموقع.
SELECT
  (created_at AT TIME ZONE 'Europe/Istanbul')::date                    AS اليوم,
  COUNT(*)                                                             AS مشاهدات,
  COUNT(*) FILTER (WHERE ip_hash IS NOT NULL)                          AS صفوف_بموافقة,
  COUNT(*) FILTER (WHERE ip_hash IS NULL)                              AS صفوف_بلا_موافقة,
  COUNT(DISTINCT ip_hash)                                              AS زوار_بموافقة,
  COUNT(DISTINCT COALESCE(ip_hash, visitor_id))                        AS كما_تحسبها_اللوحة,
  ROUND(COUNT(*)::numeric
        / GREATEST(NULLIF(COUNT(DISTINCT COALESCE(ip_hash, visitor_id)), 0), 1), 1)
                                                                       AS صفحات_لكل_زائر
FROM public.analytics_events
WHERE event_name = 'page_view'
  AND created_at >= now() - interval '14 days'
GROUP BY 1
ORDER BY 1 DESC;

-- ─── 2) شاهد مستقلّ: جدول الملخّص الدائم ────────────────────────────────────
-- analytics_visitors يُملأ بتريغر يشترط هوية غير فارغة، أي أنه لا ينمو إلا
-- بزائر موافق. لم يُحذف منه صفّ واحد في أي تنظيف. فإن توقّف نموّه فجأةً فتلك
-- شهادة ثانية مستقلّة على انهيار الموافقة — لا على انخفاض الزيارات.
SELECT
  (first_seen AT TIME ZONE 'Europe/Istanbul')::date AS اليوم,
  COUNT(*)                                          AS زوار_جدد_مسجَّلون
FROM public.analytics_visitors
WHERE first_seen >= now() - interval '14 days'
GROUP BY 1
ORDER BY 1 DESC;

-- ─── 3) هل التجميع اليومي ما زال يعمل؟ ──────────────────────────────────────
-- analytics_daily هو مصدر رسم «الزوّار يومياً». إن كان آخر يوم فيه قديماً،
-- فالرسم متجمّد وليس هابطاً — وذلك عطل ثالث مختلف تماماً.
SELECT day AS اليوم, page_views AS مشاهدات, unique_visitors AS زوار, new_visitors AS جدد
FROM public.analytics_daily
WHERE day >= CURRENT_DATE - 14
ORDER BY day DESC;

-- ─── 4) الأرقام كما تقرأها اللوحة الآن، حرفياً ──────────────────────────────
SELECT public.get_dashboard_stats()  AS بطاقات_اللوحة;
SELECT public.get_period_comparison() AS مقارنة_الأسبوع;

-- ─── 5) هل هي موجة زحف آلي؟ (الفرضية الثانية) ──────────────────────────────
-- متصفّح/نظام واحد يبتلع نصف المشاهدات = زاحف غير مُدرَج في فلتر البوتات.
-- توزيعٌ طبيعي (Chrome/Safari على Android/iOS بنسب متقاربة) ينفي الفرضية.
SELECT
  COALESCE(meta->>'browser', '—') AS المتصفح,
  COALESCE(meta->>'os', '—')      AS النظام,
  COALESCE(meta->>'device', '—')  AS الجهاز,
  COUNT(*)                        AS مشاهدات,
  COUNT(DISTINCT ip_hash)         AS زوار_بموافقة
FROM public.analytics_events
WHERE event_name = 'page_view'
  AND created_at >= now() - interval '2 days'
GROUP BY 1, 2, 3
ORDER BY مشاهدات DESC
LIMIT 12;

-- ─── 6) خلاصة تلقائية تقرأ نفسها ────────────────────────────────────────────
-- لا RAISE EXCEPTION هنا عمداً: هذا ملف تشخيص، ووظيفته أن يُبلّغ لا أن يُفشل
-- الأتمتة. الفشل الوحيد المقبول هو غياب الجداول نفسها، وهو مُعالَج بالتخطّي.
DO $check$
DECLARE
  d0_views   bigint := 0;   -- مشاهدات آخر 24 ساعة
  d0_ident   bigint := 0;   -- زوار موافقون في آخر 24 ساعة
  d7_views   bigint := 0;   -- مشاهدات نفس النافذة قبل 7 أيام
  d7_ident   bigint := 0;
  new_today  bigint := 0;
  new_week   bigint := 0;
BEGIN
  IF to_regclass('public.analytics_events') IS NULL THEN
    RAISE NOTICE 'تخطٍّ: analytics_events غير موجود في هذه القاعدة.';
    RETURN;
  END IF;

  SELECT COUNT(*), COUNT(DISTINCT ip_hash) INTO d0_views, d0_ident
  FROM public.analytics_events
  WHERE event_name = 'page_view' AND created_at >= now() - interval '24 hours';

  SELECT COUNT(*), COUNT(DISTINCT ip_hash) INTO d7_views, d7_ident
  FROM public.analytics_events
  WHERE event_name = 'page_view'
    AND created_at >= now() - interval '8 days'
    AND created_at <  now() - interval '7 days';

  RAISE NOTICE '── آخر 24 ساعة: % مشاهدة، % زائراً موافقاً.', d0_views, d0_ident;
  RAISE NOTICE '── نفس النافذة قبل 7 أيام: % مشاهدة، % زائراً موافقاً.', d7_views, d7_ident;

  -- المشاهدات صامدة والهوية منهارة = الموافقة هي المتغيّر، لا الزيارات.
  IF d7_views > 0 AND d0_views >= (d7_views * 0.6)::bigint
     AND d7_ident > 0 AND d0_ident < (d7_ident * 0.4)::bigint THEN
    RAISE NOTICE 'الحكم: المشاهدات ثابتة والزوّار المعرَّفون انهاروا → انهيار الموافقة على التتبّع، لا انخفاض زيارات.';
  ELSIF d7_views > 0 AND d0_views < (d7_views * 0.6)::bigint THEN
    RAISE NOTICE 'الحكم: المشاهدات نفسها انخفضت → انخفاض زيارات حقيقي، والتحقيق يتّجه إلى الترتيب في محرّكات البحث لا إلى العدّ.';
  ELSE
    RAISE NOTICE 'الحكم: لا انهيار واضح في النافذتين — اقرأ الجدول اليومي أعلاه لتحديد اليوم الفاصل بدقّة.';
  END IF;

  IF to_regclass('public.analytics_visitors') IS NOT NULL THEN
    SELECT COUNT(*) INTO new_today FROM public.analytics_visitors
    WHERE first_seen >= now() - interval '24 hours';
    SELECT COUNT(*) INTO new_week FROM public.analytics_visitors
    WHERE first_seen >= now() - interval '8 days' AND first_seen < now() - interval '7 days';
    RAISE NOTICE '── زوّار جدد مسجَّلون: % في آخر 24 ساعة مقابل % قبل أسبوع.', new_today, new_week;
  END IF;
END
$check$;
