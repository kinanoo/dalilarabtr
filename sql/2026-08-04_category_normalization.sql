-- توحيد تصنيفات المقالات — إنقاذ 55 مقالاً يتيماً وتنظيف صفحة الإقامات
-- ===========================================================================
-- المشكلة، مؤكَّدة حيّاً:
--
-- 1) صفحات /category/<slug> تستعلم بقيمة عربية واحدة من CATEGORY_SLUGS في
--    src/lib/config.ts (11 قيمة فقط). و55 مقالاً يحملون 18 قيمة أخرى — بينها
--    'syrians' و'kimlik' و'visa' بالإنكليزية — فلا تظهر في أي صفحة تصنيف.
--    أثبتنا ذلك حيّاً: أقوى صفحة في الموقع «جواز السفر السوري 2026»
--    (11,611 ظهوراً في سيرش كونسول) تصنيفها 'syrians'، ولا تُذكر لا في
--    /category/syrians ولا في التصنيف العربي. أي أن جوجل لا يرى أي تجميع
--    موضوعي حول الصفحات التي تكسب فعلاً.
--
-- 2) صفحة /residence تستعلم 'أنواع الإقامات'، وفيها عشر مقالات سيارات
--    (auto-*) وثلاث مقالات سكن (DASK، ضجيج الجيران، نزاع الأيدات). فالقارئ
--    الذي ينقر «أنواع الإقامات» يجد فحص المركبات. والتصنيف الصحيح موجود
--    أصلاً وشبه فارغ: 'المرور والسيارات' فيه خمسة مقالات فقط.
--
-- القاعدة: كل قيمة تُنقل إلى أقرب تصنيف قانوني من الأحد عشر، مع استثناءات
-- فردية حيث تكون القيمة الجماعية خاطئة للمقال بعينه (مذكورة بالاسم).
-- لا يُحذف أي مقال ولا يتغيّر أي slug — فلا روابط تنكسر ولا تحويلات تلزم.
--
-- شغّله في Supabase → SQL Editor.

-- ───────────────────────────────────────────────────────────────────────────
-- 1) الاستثناءات الفردية أولاً (قبل النقل الجماعي، وإلا ابتلعتها القاعدة العامة)
UPDATE articles SET category = 'خدمات السوريين' WHERE slug IN (
  'turkish-citizenship-marriage-syrians-gaziantep',   -- كان 'kimlik' وهو عن الجنسية
  'gaziantep-citizenship-decision-syrians-2026',      -- كان 'housing' وهو عن الجنسية
  'goc-idaresi-syrians-return-figures-2026-06',
  'turkey-interior-minister-damascus-visit-2026-07'
);

UPDATE articles SET category = 'الفيزا والتأشيرات' WHERE slug IN (
  'syria-turkey-visa-types-2026',        -- كان 'الإقامة والكيمليك'
  'turkey-study-visa-syrians-2026'       -- كان 'التعليم والجامعات' وهو تأشيرة
);

UPDATE articles SET category = 'خدمات e-Devlet' WHERE slug = 'edevlet-sgk-dokumu';  -- كان 'العمل والدخل'

UPDATE articles SET category = 'العمل والاستثمار' WHERE slug IN (
  'syria-work-permit-exemption-turkey-2026-07',
  'ciftci-syrians-decisions-work-permit-exemption-2026-07'
);

-- ───────────────────────────────────────────────────────────────────────────
-- 2) النقل الجماعي لكل قيمة يتيمة إلى أقرب تصنيف قانوني
UPDATE articles SET category = 'خدمات السوريين'
  WHERE category IN ('syrians', 'أخبار وقرارات رسمية');

UPDATE articles SET category = 'الكملك والحماية المؤقتة'
  WHERE category IN ('kimlik', 'الإقامة والكيمليك', 'الإقامة والأوراق');

UPDATE articles SET category = 'الفيزا والتأشيرات'
  WHERE category IN ('visa', 'السفر والمعابر');

UPDATE articles SET category = 'العمل والاستثمار'
  WHERE category IN ('العمل وتصاريح العمل', 'العمل والدخل', 'العمل والإذن');

UPDATE articles SET category = 'الدراسة والتعليم'
  WHERE category IN ('education', 'التعليم والجامعات');

UPDATE articles SET category = 'السكن والحياة'
  WHERE category IN ('housing', 'الحياة اليومية');

UPDATE articles SET category = 'معاملات رسمية'
  WHERE category IN ('official', 'الاتصالات والخطوط');

UPDATE articles SET category = 'خدمات e-Devlet'  WHERE category = 'edevlet';
UPDATE articles SET category = 'المرور والسيارات' WHERE category = 'traffic';

-- ───────────────────────────────────────────────────────────────────────────
-- 3) تنظيف صفحة الإقامات: السيارات إلى تصنيف السيارات، والسكن إلى السكن
UPDATE articles SET category = 'المرور والسيارات'
  WHERE slug LIKE 'auto-%' AND category = 'أنواع الإقامات';

UPDATE articles SET category = 'السكن والحياة'
  WHERE slug LIKE 'housing-advanced-%' AND category = 'أنواع الإقامات';

-- ملاحظة مقصودة: مقالات family-* تبقى في 'أنواع الإقامات' لأن أكثرها
-- (لمّ الشمل، الإقامة العائلية، تسجيل الزواج والولادة) إجراءات إقامة فعلاً.

-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — يجب أن يرجع الاستعلام الأول صفر صفوف
SELECT category, count(*) AS orphan_rows
FROM articles
WHERE category NOT IN (
  'أنواع الإقامات','الكملك والحماية المؤقتة','الفيزا والتأشيرات','خدمات السوريين',
  'السكن والحياة','العمل والاستثمار','الدراسة والتعليم','الصحة والتأمين',
  'معاملات رسمية','خدمات e-Devlet','المرور والسيارات')
GROUP BY category;

-- وأقوى صفحة في الموقع يجب أن تصير في تصنيف يُستعلم عنه
SELECT slug, category FROM articles WHERE slug = 'syrian-passport-renewal';

-- التوزيع الجديد
SELECT category, count(*) AS n FROM articles GROUP BY category ORDER BY n DESC;
