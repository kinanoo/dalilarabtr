-- آخر جملتين متناقضتين في مقال الفيزا
-- ===========================================================================
-- بعد نزع روابط النقر الأربعة، مسحنا المتن كاملاً فوجدنا 11 ذكراً للنطاق،
-- ستة منها نصّ داخل جمل. أغلبها صار مقبولاً لأن الصفحة تحمل الآن قسماً صريحاً
-- يشرح التحويل — القارئ الذي يقرأه يفهم السياق.
--
-- لكن **جملتين** ما زالتا تؤكّدان عكس ما أثبتته الصفحة، وكلتاهما في موضع
-- عالي الانتباه:
--
--   1) في قائمة «الأخطاء الشائعة»:
--      «الدفع لمواقع وسيطة تدّعي إصدار e-Vize — التقديم الرسمي حصراً على
--       evisa.gov.tr.»
--      وهي تحذّر من الوسطاء ثم تشير إلى نطاق يحوّل إلى موقع شركة. أي أنها
--      تُطمئن القارئ خطأً في الجملة نفسها التي تحذّره.
--
--   2) في فقرة الرسوم:
--      «تحقّق من الرسم الخاص بجنسيتك على evisa.gov.tr قبل الدفع»
--      توجيه إلى النطاق نفسه في لحظة الدفع تحديداً.
--
-- المعالجة: توجيه القارئ إلى بوابة الخارجية القنصلية — نطاق حكومي لا يحوّل —
-- مع إبقاء اسم النطاق مذكوراً كنصّ حتى يعرفه إن رآه.
--
-- الملف idempotent. تاريخ التحقّق: 26 تموز/يوليو 2026.

BEGIN;

-- (1) بند «الأخطاء الشائعة»
UPDATE articles
SET details = replace(
      details,
      'الدفع لمواقع وسيطة تدّعي إصدار e-Vize — التقديم الرسمي حصراً على evisa.gov.tr.',
      'الدفع لمواقع وسيطة تدّعي إصدار e-Vize. وانتبه إلى مفارقة تخدع الكثيرين: النطاق الحكومي <code>evisa.gov.tr</code> نفسه يحوّلك اليوم إلى موقع الشركة المشغّلة، فلا تكفي رؤية «gov.tr» للتمييز. ابدأ من <a href="https://www.konsolosluk.gov.tr/visaInformation" target="_blank" rel="noopener nofollow">بوابة الخارجية القنصلية</a> ولا تدفع رسماً خارج ما تعرضه القناة الرسمية.')
WHERE (id = 'turkey-visa-types-2026' OR slug = 'turkey-visa-types-2026')
  AND details LIKE '%التقديم الرسمي حصراً على evisa.gov.tr.%';

-- (2) فقرة الرسوم
UPDATE articles
SET details = replace(
      details,
      'تحقّق من الرسم الخاص بجنسيتك على evisa.gov.tr قبل الدفع، ولا تدفع لأي وسيط يزعم «تسريع» التأشيرة.',
      'تحقّق من الرسم الخاص بجنسيتك من <a href="https://www.konsolosluk.gov.tr/visaInformation" target="_blank" rel="noopener nofollow">بوابة الخارجية القنصلية</a> قبل الدفع — واقرأ الرسوم القانونية المقرَّرة لعام 2026 في صدر هذه الصفحة. ولا تدفع لأي وسيط يزعم «تسريع» التأشيرة.')
WHERE (id = 'turkey-visa-types-2026' OR slug = 'turkey-visa-types-2026')
  AND details LIKE '%تحقّق من الرسم الخاص بجنسيتك على evisa.gov.tr%';

UPDATE articles SET last_update = '2026-07-26'
WHERE id = 'turkey-visa-types-2026' OR slug = 'turkey-visa-types-2026';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق: يجب أن يكون العمودان الأولان صفراً.
SELECT
  id,
  length(details)                                                        AS details_len,
  (details LIKE '%التقديم الرسمي حصراً على evisa%')::int                 AS contradiction_1_left,
  (details LIKE '%الرسم الخاص بجنسيتك على evisa%')::int                  AS contradiction_2_left,
  (details LIKE '%مفارقة تخدع الكثيرين%')::int                           AS fix_1_applied,
  (details LIKE '%واقرأ الرسوم القانونية المقرَّرة لعام 2026%')::int      AS fix_2_applied,
  (length(details) - length(replace(details, '<p>',  ''))) / 3           AS p_open,
  (length(details) - length(replace(details, '</p>', ''))) / 4           AS p_close,
  last_update
FROM articles
WHERE id = 'turkey-visa-types-2026' OR slug = 'turkey-visa-types-2026';
