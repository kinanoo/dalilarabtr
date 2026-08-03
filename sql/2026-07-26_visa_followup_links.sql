-- إتمام إصلاح مقال الفيزا — ما كشفه التحقّق بعد التشغيل
-- ===========================================================================
-- الدفعة السابقة أضافت قسم السعر وتحذير التحويل، وأصلحت الفقرة الافتتاحية.
-- لكن التحقّق بعدها كشف أن الإصلاح كان **جزئياً**، وهذه ثلاثة عيوب حقيقية:
--
-- (أ) بقيت **أربعة روابط قابلة للنقر** إلى https://www.evisa.gov.tr/ في أقسام
--     المقال القديمة. أي أن الصفحة تحذّر من التحويل في قسم، ثم ترسل القارئ إليه
--     بأربع نقرات في أقسام أخرى. التحذير بلا إزالة الرابط نصف عمل.
--
-- (ب) جملة في قسم التأشيرة الإلكترونية تقول إنها «يُتقدَّم لها **حصراً عبر
--     البوابة الرسمية** evisa.gov.tr — لا عبر أي موقع وسيط». هذه الجملة صارت
--     تناقض ما أثبتناه في الصفحة نفسها: النطاق يحوّل إلى موقع شركة. وتركها
--     يعلّم القارئ أن الموقع التجاري هو «البوابة الرسمية» ويطمئنه خطأً.
--
-- (ج) وسم <p> واحد غير مغلق في فقرة التوقيع بآخر المتن. عيب **سابق** لتعديلنا
--     (كان الفرق 1 قبل الدفعة و1 بعدها، وكتلتنا المضافة متوازنة 9/9) — لكنه
--     يُصلَح ما دمنا نلمس المقال.
--
-- المعالجة: نجعل ذكر النطاق **نصّاً غير قابل للنقر** بدل رابط، فيبقى القارئ
-- عالماً باسمه دون أن نرسله إليه من صفحتنا؛ والقناة التي نرسله إليها فعلاً هي
-- بوابة الخارجية القنصلية، وهي نطاق حكومي لا يحوّل.
--
-- الملف idempotent. تاريخ التحقّق: 26 تموز/يوليو 2026.

BEGIN;

-- (أ) نزع الروابط الأربعة — النصّ المستبدَل متطابق في المواضع الأربعة
UPDATE articles
SET details = replace(
      details,
      '<a href="https://www.evisa.gov.tr/" target="_blank" rel="noopener">evisa.gov.tr</a>',
      '<code>evisa.gov.tr</code>')
WHERE (id = 'turkey-visa-types-2026' OR slug = 'turkey-visa-types-2026')
  AND details LIKE '%<a href="https://www.evisa.gov.tr/"%';

-- (ب) تصحيح الجملة المتناقضة
UPDATE articles
SET details = replace(
      details,
      'ويُتقدَّم لها حصراً عبر البوابة الرسمية <code>evisa.gov.tr</code> — لا عبر أي موقع وسيط.',
      'ويُتقدَّم لها عبر النطاق الرسمي <code>evisa.gov.tr</code> — الذي يحوّلك اليوم تلقائياً إلى موقع الشركة المشغّلة كما شرحنا أعلاه. ولذلك لا تدخل إليه من نتيجة بحث أو إعلان ممول، بل ابدأ من <a href="https://www.konsolosluk.gov.tr/visaInformation" target="_blank" rel="noopener nofollow">بوابة الخارجية القنصلية</a> وهي نطاق حكومي لا يحوّلك إلى أي مكان، ولا تدفع رسماً خارج ما تعرضه القناة الرسمية.')
WHERE (id = 'turkey-visa-types-2026' OR slug = 'turkey-visa-types-2026')
  AND details LIKE '%حصراً عبر البوابة الرسمية%';

-- (ج) إغلاق فقرة التوقيع
UPDATE articles
SET details = details || '</p>'
WHERE (id = 'turkey-visa-types-2026' OR slug = 'turkey-visa-types-2026')
  AND right(details, 4) <> '</p>';

UPDATE articles SET last_update = '2026-07-26'
WHERE id = 'turkey-visa-types-2026' OR slug = 'turkey-visa-types-2026';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق: يجب أن يكون عدد روابط evisa صفراً، والوسوم متوازنة.
SELECT
  id,
  length(details)                                                         AS details_len,
  (length(details) - length(replace(details, '<a href="https://www.evisa.gov.tr/"', ''))) / 35 AS evisa_links_left,
  (details LIKE '%حصراً عبر البوابة الرسمية%')::int                       AS contradiction_left,
  (length(details) - length(replace(details, '<p>', ''))) / 3             AS p_open,
  (length(details) - length(replace(details, '</p>', ''))) / 4            AS p_close,
  (details LIKE '%<code>evisa.gov.tr</code>%')::int                       AS plain_text_mentions,
  last_update
FROM articles
WHERE id = 'turkey-visa-types-2026' OR slug = 'turkey-visa-types-2026';
