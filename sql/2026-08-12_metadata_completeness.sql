-- ============================================================================
-- إتمام البيانات الوصفية: آخر 5 صفوف ناقصة في الموقع كله
-- ============================================================================
-- مسح 2026-08-12 لكل «المعلقات» القديمة وجد الموقع مكتملاً إلا من هذا:
--   * 3 صفحات حديثة بلا seo_title/seo_description (أُنشئت بعد حزمة الأفضل-50):
--     لم الشمل من سوريا، مسار النوتر بإسطنبول، تسجيل الأطفال بالرقم الأجنبي.
--   * صفحتان بلا حقل مصدر: مقار الهجرة بإسطنبول (مصدرها الطبيعي قنوات
--     المديرية الرسمية)، وتكاليف المعيشة (أرقامها مسندة داخل المتن أصلاً —
--     الحقل يوثق ذلك).
-- تحديثات بالـslug، محروسة بحالة النقص نفسها — آمن لإعادة التشغيل، ولا يمس
-- صفاً مكتملاً. لا تغيير عناوين فلا يلمسه تريغر الإشعارات أصلاً.
-- ============================================================================

UPDATE articles SET
    seo_title = 'تأشيرة لم الشمل من سوريا: التقديم من دمشق وحلب — الأوراق كاملة',
    seo_description = 'لم شمل العائلة صار ضمن فئات التأشيرات في مركز الطلبات التركي بسوريا: التقديم من دمشق وحلب بدل بيروت — أوراق الكفيل حامل إذن العمل أو المواطن التركي، وأوراق المتقدم، خطوة بخطوة.',
    last_update = CURRENT_DATE
 WHERE slug = 'family-reunion-visa-syria-2026'
   AND (seo_title IS NULL OR seo_title = '');

UPDATE articles SET
    seo_title = 'تسليم أوراق الإقامة عبر النوتر في إسطنبول — بلا انتظار الموعد',
    seo_description = 'إعلان مديرية هجرة إسطنبول: من حجز عبر randevu.goc.gov.tr يسلّم ملف إقامته لأي نوتر في إسطنبول قبل تاريخ موعده — الخطوات والشروط وما الذي يبقى محتاجاً للحضور.',
    last_update = CURRENT_DATE
 WHERE slug = 'istanbul-goc-randevu-noter-2026'
   AND (seo_title IS NULL OR seo_title = '');

UPDATE articles SET
    seo_title = 'طفلك بلا مدرسة بسبب الرقم الأجنبي؟ هكذا تعالجها إسطنبول',
    seo_description = 'الرقم الأجنبي غير الفعال أو بلا عنوان مسجل يمنع تسجيل الأطفال في مدارس إسطنبول — مسار المعالجة المعلن من مديرية الهجرة، والأوراق المطلوبة، والخطوات كاملة.',
    last_update = CURRENT_DATE
 WHERE slug = 'foreign-id-school-enrollment-istanbul-2026'
   AND (seo_title IS NULL OR seo_title = '');

UPDATE articles SET
    source = 'مقار مديرية إدارة الهجرة في ولاية إسطنبول وعناوينها كما تنشرها قنوات المديرية الرسمية (istanbul.goc.gov.tr وبوابة goc.gov.tr) — بيازيد (كوم كابي)، سلطان بيلي، إسنيورت، توزلا، وشارع وطن',
    last_update = CURRENT_DATE
 WHERE slug = 'immigration-offices-istanbul'
   AND (source IS NULL OR source = '');

UPDATE articles SET
    source = 'الأرقام مسندة داخل المتن إلى مصادرها التركية الرسمية بنداً بنداً مع تاريخ كل رقم — منها بيانات معهد الإحصاء التركي TÜİK والتعرفات المعلنة من مقدمي الخدمات؛ راجع كل بند لمصدره وتاريخه',
    last_update = CURRENT_DATE
 WHERE slug = 'cost-of-living-turkey-2026'
   AND (source IS NULL OR source = '');

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE status = 'approved' AND (seo_title IS NULL OR seo_title = '');
    IF n <> 0 THEN RAISE EXCEPTION 'still % approved rows without seo_title', n; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE status = 'approved' AND (source IS NULL OR source = '');
    IF n <> 0 THEN RAISE EXCEPTION 'still % approved rows without source', n; END IF;
END
$check$;

SELECT slug AS الصفحة,
       (seo_title IS NOT NULL AND seo_title <> '')::text AS "SEO",
       (source IS NOT NULL AND source <> '')::text AS المصدر
  FROM articles
 WHERE slug IN ('family-reunion-visa-syria-2026', 'istanbul-goc-randevu-noter-2026',
                'foreign-id-school-enrollment-istanbul-2026', 'immigration-offices-istanbul',
                'cost-of-living-turkey-2026')
 ORDER BY slug;
