-- ============================================================================
-- تصحيح تاريخ: «13 آب/أغسطس 2026» ← «21 آب/أغسطس 2026»  (2026-08-21)
--
-- ما الخطأ: الملف السابق (2026-08-13_syria-return-portal-news.sql) كُتب فعلياً
-- يوم 21 آب، لكنني أرّخته 13 آب — في اسمه وفي متنه. فصار المنشور يقول إن هيئة
-- التحرير عاينت المصادر «في 13 آب/أغسطس 2026»، وهذا غير صحيح: المعاينة والنشر
-- تمّا في 21 آب. تاريخ تحقّق خاطئ يضعف الثقة بالمحتوى نفسه، فيُصحَّح لا يُترك.
--
-- المواضع الأربعة (أُحصيت على القاعدة الحيّة قبل كتابة هذا الملف):
--   * articles.details لـ voluntary-return-syria-procedure-2026 — موضعان
--   * updates (خبر 2 آب عن الكتيّب): content وsummary — موضعان
--
-- لماذا ملف جديد بدل تعديل السابق: الملف المطبَّق لا يُعاد تطبيقه، وتعديله
-- يُنتج تحذير بصمة فقط (قاعدة CLAUDE.md). واسم الملف السابق يبقى مؤرَّخاً
-- 08-13 في public.sql_migrations — لا ضرر منه، فهو مفتاح سجلّ لا تاريخ نشر،
-- والترتيب الأبجدي يضع هذا الملف بعده كما يجب.
--
-- لا إدراج هنا ولا إشعارات — تصحيح نصّي بحت.
-- ============================================================================

UPDATE public.articles
SET details = replace(details, '13 آب/أغسطس 2026', '21 آب/أغسطس 2026')
WHERE slug = 'voluntary-return-syria-procedure-2026'
  AND details LIKE '%13 آب/أغسطس 2026%';

UPDATE public.updates
SET content = replace(content, '13 آب/أغسطس 2026', '21 آب/أغسطس 2026'),
    summary = replace(summary, '13 آب/أغسطس 2026', '21 آب/أغسطس 2026')
WHERE (content LIKE '%13 آب/أغسطس 2026%' OR summary LIKE '%13 آب/أغسطس 2026%');

DO $check$
DECLARE n_left integer;
BEGIN
  SELECT (SELECT COUNT(*) FROM public.articles WHERE details LIKE '%13 آب/أغسطس 2026%')
       + (SELECT COUNT(*) FROM public.updates
           WHERE content LIKE '%13 آب/أغسطس 2026%' OR summary LIKE '%13 آب/أغسطس 2026%')
    INTO n_left;
  IF n_left <> 0 THEN
    RAISE EXCEPTION 'FAILED: still % row(s) carry the wrong date', n_left;
  END IF;
  RAISE NOTICE 'OK — no row carries 13 آب/أغسطس 2026 any more.';
END
$check$;

SELECT 'articles' AS surface, COUNT(*) AS rows_with_correct_date
  FROM public.articles WHERE details LIKE '%21 آب/أغسطس 2026%'
UNION ALL
SELECT 'updates', COUNT(*)
  FROM public.updates WHERE content LIKE '%21 آب/أغسطس 2026%' OR summary LIKE '%21 آب/أغسطس 2026%';
