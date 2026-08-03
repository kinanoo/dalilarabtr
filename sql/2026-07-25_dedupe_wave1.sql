-- توحيد المقالات المكرّرة — الموجة الأولى
-- ---------------------------------------------------------------------------
-- المنهج: قِسنا التداخل الفعلي في متن كل زوج (تقاطع الكلمات المميّزة)، لا
-- التشابه في العناوين. القاعدة: تداخل ≥ 73% = نفس المقال بسلاغين، وما دون
-- ذلك موضوع مستقل يبقى.
--
-- ما ثبت أنه مكرَّر (تداخل مقيس):
--   family-reunion-application  88%  ← family-reunion
--   family-reunion-conditions   80%  ← family-reunion
--   family-reunion-documents    79%  ← family-reunion
--   turkish-citizenship-syrians 74%  ← citizenship-syrians
--   school-registration         73%  ← school-registration-turkey (1468 كلمة)
--
-- ما ثبت أنه مستقل فبقي كما هو (تحذيراً من دمج متسرّع):
--   family-reunion-syrians  32%  — مسار الكملك مختلف جوهرياً
--   travel-permit-2026      32%
--   birth-registration-turkey 36%
--
-- قبل إطفاء الشظايا نَقَلنا ما تضيفه فعلاً إلى المقال الأمّ حتى لا تضيع
-- معلومة: سلسلة التوثيق (ترجمة محلّفة ← نوتر ← أبوستيل)، ومدد صلاحية
-- الجواز وكشف الحساب، ومكان التقديم، ومَن لا يشمله لمّ الشمل.
--
-- التوجيه 308 لكل سلاغ مُطفأ مُعرَّف في next.config.ts.
-- الملف idempotent. شغّله في Supabase → SQL Editor.

BEGIN;

-- (1) نقل المحتوى الفريد من الشظايا الثلاث إلى مقال لمّ الشمل الأمّ
UPDATE articles
SET details = details || $html$
<h2>الأوراق المطلوبة وسلسلة التصديق</h2>
<p>النقص في الأوراق هو أكثر أسباب التأخير شيوعاً، والخطأ الأشيع ليس نسيان ورقة بل تقديمها بصيغة غير مقبولة. كل وثيقة صادرة من خارج تركيا تمرّ بسلسلة: <strong>ترجمة عند مترجم محلّف</strong> ← <strong>تصديق لدى الكاتب بالعدل (نوتر)</strong> ← <strong>ختم أبوستيل</strong> لوثائق بعض الدول.</p>
<ul>
<li><strong>جوازات سارية</strong> لجميع الأفراد — يُشترط عادةً بقاء صلاحية لا تقلّ عن ستة أشهر.</li>
<li><strong>عقد زواج</strong> مترجم ومصدّق من النوتر.</li>
<li><strong>شهادات ميلاد الأطفال</strong> مترجمة ومصدّقة.</li>
<li><strong>عقد إيجار مسجّل</strong> (يظهر في e-Devlet) أو سند ملكية.</li>
<li><strong>كشف حساب بنكي</strong> لآخر ثلاثة أشهر لإثبات الدخل.</li>
<li><strong>سجل جنائي</strong> نظيف لكل فرد فوق 18 سنة.</li>
<li><strong>تأمين صحي</strong> يغطّي جميع القادمين.</li>
</ul>
<p>خذ <strong>نسخة إضافية من كل وثيقة</strong> واصطحب الأصول معها؛ النسخ وحدها لا تُقبل، والنسخة غير الواضحة تُعامل معاملة الناقصة.</p>

<h2>أين تقدّم؟ وماذا بعد الموافقة؟</h2>
<p>التقديم في <strong>مديرية الهجرة (Göç İdaresi)</strong> في ولايتك. بعد الموافقة لا تنتهي المعاملة عندك: أفراد عائلتك يحصلون على <strong>تأشيرة من القنصلية التركية</strong> في بلد إقامتهم، ثم يدخلون ويستكملون إجراءات الإقامة داخل تركيا.</p>

<h2>مَن لا يشمله لمّ الشمل</h2>
<ul>
<li><strong>الأبناء فوق 18 سنة</strong> — لا يدخلون ضمن الطلب في الحالة الاعتيادية.</li>
<li><strong>الوالدان</strong> — إلا في حالات إنسانية استثنائية تُقدَّر إفرادياً.</li>
<li><strong>الأشقاء</strong> — خارج نطاق لمّ الشمل.</li>
</ul>

<p><strong>مرجع رسمي:</strong> شروط ووثائق إقامة العائلة على موقع إدارة الهجرة <a href="https://www.goc.gov.tr/ikamet-genel-bilgiler" target="_blank" rel="noopener nofollow">goc.gov.tr</a> ونظام <a href="https://e-ikamet.goc.gov.tr/" target="_blank" rel="noopener nofollow">e-ikamet</a>. تختلف تفاصيل القوائم بين الولايات — راجع مديرية ولايتك قبل الموعد.</p>
$html$
WHERE (id = 'family-reunion' OR slug = 'family-reunion')
  AND details NOT LIKE '%سلسلة التصديق%';

UPDATE articles
SET last_update = '2026-07-25'
WHERE id = 'family-reunion' OR slug = 'family-reunion';

-- (2) إطفاء المكرّرات — تخرج من الخريطة ومن الدليل، والتوجيه 308 يتكفّل بالزوّار.
--     لا حذف: الصف يبقى للرجوع إليه.
UPDATE articles
SET active = FALSE
WHERE id IN (
  'family-reunion-conditions',
  'family-reunion-documents',
  'family-reunion-application',
  'turkish-citizenship-syrians',
  'school-registration'
);

COMMIT;

-- التحقّق
SELECT id, active, length(details) AS len
FROM articles
WHERE id IN (
  'family-reunion','family-reunion-conditions','family-reunion-documents',
  'family-reunion-application','turkish-citizenship-syrians','school-registration',
  'citizenship-syrians','school-registration-turkey'
)
ORDER BY active DESC, id;
