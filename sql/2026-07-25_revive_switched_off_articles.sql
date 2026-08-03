-- إحياء المقالات المُطفأة بالخطأ (active = false)
-- ---------------------------------------------------------------------------
-- الخلفية: عمود الرؤية في جدول articles اسمه «active» (boolean, default true)
-- ولا يوجد عمود اسمه is_active — تأكّدنا من ذلك بالاستعلام على
-- information_schema. المقالات الثلاثة أدناه كانت active = false، فكانت مستبعدة
-- من sitemap-articles.xml ومن صفحة الدليل الشامل، رغم أن صفحاتها تعمل وتُفهرَس.
--
-- الثلاثة تحمل نفس تاريخ التحديث (2026-06-06) وكلها موادّ مكتملة، وهو ما يرجّح
-- أنها أُطفئت دفعة واحدة بالخطأ لا عمداً.
--
-- الملف idempotent: تشغيله أكثر من مرة لا يغيّر شيئاً بعد المرة الأولى.
-- شغّله في Supabase → SQL Editor.

BEGIN;

-- (1) أحياء شانلي أورفا المغلقة — مؤكَّد إحياؤه.
--     170 حيّاً مغلقاً، ~2660 كلمة، 11 عنواناً فرعياً. يتقاطع مع أقوى عناقيد
--     الموقع («المناطق المحظورة»: ترتيب 1-2 ونسبة نقر تصل 77%).
UPDATE articles
SET active = TRUE
WHERE (id = 'urfa-closed-neighborhoods-residence-2026'
    OR slug = 'urfa-closed-neighborhoods-residence-2026')
  AND active IS DISTINCT FROM TRUE;

-- (2) و(3) اختياريان — احذف العلامات (--) من السطور التالية إذا أردت إحياءهما.
--     لم تؤكّدهما، فتُركا مُطفأين. كلاهما مادة مكتملة:
--       • تأشيرات تركيا للسوريين 2026 — ~2819 كلمة، 18 عنواناً (الأقوى)
--       • مركز تحديثات إدارة الهجرة 2026 — ~1312 كلمة، 7 عناوين

-- UPDATE articles
-- SET active = TRUE
-- WHERE (id = 'syria-turkey-visa-types-2026' OR slug = 'syria-turkey-visa-types-2026')
--   AND active IS DISTINCT FROM TRUE;

-- UPDATE articles
-- SET active = TRUE
-- WHERE (id = 'goc-idaresi-updates-2026' OR slug = 'goc-idaresi-updates-2026')
--   AND active IS DISTINCT FROM TRUE;

COMMIT;

-- التحقّق — شغّل هذا بعد الـ COMMIT وأرسل لي النتيجة:
-- المفروض يظهر active = true للمقال الأول (والباقيان حسب اختيارك).
SELECT id, active, status, last_update
FROM articles
WHERE id IN (
  'urfa-closed-neighborhoods-residence-2026',
  'syria-turkey-visa-types-2026',
  'goc-idaresi-updates-2026'
)
ORDER BY id;

-- هل بقي غيرها مُطفأً؟ (يُفترض ألّا يظهر شيء إن كان الإطفاء خطأً جماعياً)
SELECT id, status, last_update
FROM articles
WHERE active = FALSE
ORDER BY last_update DESC;
