-- إتمام موجة التوحيد: مطابقة على slug أيضاً
-- ---------------------------------------------------------------------------
-- الملف السابق أطفأ بـ WHERE id IN (...) فقط، فنجح مع مقالين وأخفق مع شظايا
-- لمّ الشمل الثلاث — الأرجح أن id عندها يختلف عن الـ slug. هذا الملف يطابق على
-- الاثنين معاً. idempotent، ولا يضرّ لو شُغّل بعد نجاح جزئي.

BEGIN;

UPDATE articles
SET active = FALSE
WHERE id IN (
  'family-reunion-conditions','family-reunion-documents','family-reunion-application',
  'turkish-citizenship-syrians','school-registration'
)
   OR slug IN (
  'family-reunion-conditions','family-reunion-documents','family-reunion-application',
  'turkish-citizenship-syrians','school-registration'
);

COMMIT;

-- التحقّق: يجب أن تكون الخمسة active = false.
SELECT id, slug, active
FROM articles
WHERE id IN (
  'family-reunion-conditions','family-reunion-documents','family-reunion-application',
  'turkish-citizenship-syrians','school-registration'
)
   OR slug IN (
  'family-reunion-conditions','family-reunion-documents','family-reunion-application',
  'turkish-citizenship-syrians','school-registration'
)
ORDER BY active, id;
