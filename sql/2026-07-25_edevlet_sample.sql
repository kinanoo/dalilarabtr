-- عنقود e-Devlet — العيّنة (4 مقالات) لتثبيت النمط قبل تعميمه
-- ---------------------------------------------------------------------------
-- التشخيص المقيس: 35 مقالاً في العنقود، وقياس 595 زوجاً منها أعطى وسيط تداخل
-- 82% و78% من الأزواج فوق 70%. أي أنها ليست «مقالات قصيرة» بل نسخ شبه متطابقة:
-- نفس «أهم الأوراق» حرفياً (حساب e-Devlet + هوية + هاتف)، ونفس «الخطة السريعة»
-- («افتح الرابط الرسمي وسجّل الدخول»)، ونفس التحذير — بجملة موضوع مبدَّلة.
--
-- لذلك العلاج ليس التطويل بل التمييز. ما يجعل كل صفحة مختلفة فعلاً:
--   1) الرابط الرسمي المباشر للخدمة — مختلف لكل خدمة
--   2) ماذا تعرض الشاشة وكيف تقرأ النتيجة
--   3) ماذا تفعل بعدها — القيمة الحقيقية للزائر
--   4) مشكلة خاصة بهذه الخدمة تحديداً
--
-- ⚠️ ملاحظة تحقّق مهمة: turkiye.gov.tr يرجّع HTTP 200 لصفحات غير موجودة،
-- وعنوان الصفحة وحده يكشف الحقيقة («404 Sayfa Bulunamadı»). كل رابط أدناه
-- تحقّقنا منه بقراءة عنوان صفحته، لا برمز الحالة. تاريخ التحقّق: 2026-07-25.
--
-- استُثني edevlet-aile-hekim-bilgisi-sorgulama من هذه الدفعة: لم نجد له خدمة
-- مطابقة على turkiye.gov.tr، والأرجح أن مكانها منصّة الصحة — ولن نضع رابطاً
-- غير مؤكَّد.
--
-- الملف idempotent. شغّله في Supabase → SQL Editor.

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1) مخالفات لوحة السيارة
UPDATE articles
SET details = details || $html$
<h2>الرابط الرسمي المباشر</h2>
<p>الخدمة اسمها الرسمي «Araç Plakasına Yazılan Ceza Sorgulama» وتتبع المديرية العامة للأمن، وتعرض المخالفات المسجّلة على <strong>لوحة</strong> المركبة:<br>
<a href="https://www.turkiye.gov.tr/emniyet-arac-plakasina-yazilan-ceza-sorgulama" target="_blank" rel="noopener nofollow">turkiye.gov.tr/emniyet-arac-plakasina-yazilan-ceza-sorgulama</a></p>

<h2>كيف تقرأ النتيجة</h2>
<p>النتيجة تُظهر المخالفة وتاريخها والمبلغ. الفارق الذي يربك الكثيرين: هذه الخدمة تعرض <strong>مخالفات اللوحة</strong>، وهي ليست بالضرورة نفس <strong>الدين المستحق عليك</strong>. المخالفة المسجّلة شيء، وحالة سدادها شيء آخر يُتابَع من خدمة الديون:<br>
<a href="https://www.turkiye.gov.tr/gib-intvrg-trafik-para-cezasi-borcu-sorgulama-ve-odeme" target="_blank" rel="noopener nofollow">استعلام ودفع دين المخالفات المرورية (Gelir İdaresi)</a></p>

<h2>ماذا تفعل بعد الاستعلام</h2>
<ul>
<li><strong>مخالفة تعرفها:</strong> السداد المبكر عادةً أرخص — راجع المبلغ وشروط الخصم على صفحة الدفع الرسمية أعلاه قبل أن تدفع.</li>
<li><strong>مخالفة لا تعرفها:</strong> لا تدفع لمجرّد إغلاقها. راجع تاريخها ومكانها أولاً؛ قد تكون على مالك سابق أو خطأ في اللوحة.</li>
<li><strong>بعت السيارة ولا تزال المخالفات تظهر:</strong> راجع تاريخ نقل الملكية لدى النوتر — المخالفات بعد النقل ليست عليك، وقبله عليك.</li>
</ul>
$html$
WHERE (id='edevlet-plaka-ceza' OR slug='edevlet-plaka-ceza')
  AND details NOT LIKE '%الرابط الرسمي المباشر%';

-- ─────────────────────────────────────────────────────────────
-- 2) المركبات المسجّلة باسمك
UPDATE articles
SET details = details || $html$
<h2>الرابط الرسمي المباشر</h2>
<p>اسمها الرسمي «Adıma Tescilli Araç Sorgulama» وتتبع المديرية العامة للأمن:<br>
<a href="https://www.turkiye.gov.tr/emniyet-adima-tescilli-arac-sorgulama" target="_blank" rel="noopener nofollow">turkiye.gov.tr/emniyet-adima-tescilli-arac-sorgulama</a></p>

<h2>لماذا يهمّك هذا الاستعلام تحديداً؟</h2>
<p>ليس فضولاً: كل مركبة مسجّلة باسمك تترتّب عليها <strong>مسؤولية</strong> — مخالفاتها وضرائبها وتأمينها الإجباري. ولهذا يستعمله الناس في ثلاث حالات عملية:</p>
<ul>
<li><strong>بعد بيع سيارة:</strong> للتأكد أن نقل الملكية تمّ فعلاً وأنها لم تعد باسمك. إن ظهرت بعد البيع، النقل لم يكتمل — راجع النوتر فوراً.</li>
<li><strong>عند اشتباه بتسجيل خاطئ:</strong> مركبة لا تعرفها باسمك تعني خطأً إدارياً أو استعمالاً لهويتك؛ راجع مديرية المرور بلا تأخير.</li>
<li><strong>قبل معاملة رسمية:</strong> بعض المعاملات تتأثر بما هو مسجّل باسمك.</li>
</ul>
<p>إن ظهرت مركبة غريبة، تحقّق أيضاً من المخالفات المسجّلة عليها: <a href="/article/edevlet-plaka-ceza">استعلام مخالفات اللوحة</a>.</p>
$html$
WHERE (id='edevlet-adima-tescilli-arac' OR slug='edevlet-adima-tescilli-arac')
  AND details NOT LIKE '%الرابط الرسمي المباشر%';

-- ─────────────────────────────────────────────────────────────
-- 3) كشف الخدمة والتسجيل SGK
UPDATE articles
SET details = details || $html$
<h2>الرابط الرسمي المباشر</h2>
<p>اسمها الرسمي «SGK Tescil ve Hizmet Dökümü / İşyeri Ünvan Listesi»:<br>
<a href="https://www.turkiye.gov.tr/sgk-tescil-ve-hizmet-dokumu" target="_blank" rel="noopener nofollow">turkiye.gov.tr/sgk-tescil-ve-hizmet-dokumu</a></p>

<h2>ما الذي يظهر لك بالضبط</h2>
<p>الكشف يعرض <strong>أيام الخدمة المسجّلة</strong> و<strong>أسماء أماكن العمل</strong> التي جرى التصريح عنك فيها والفترات. وهذه الورقة ليست للاطلاع فقط — تُطلب في معاملات حقيقية: التقديم على الجنسية، إثبات الدخل في طلبات الإقامة، ومتابعة استحقاق التقاعد.</p>

<h2>أهم ما تتحقّق منه — وهو ما يغفله كثيرون</h2>
<ul>
<li><strong>فجوات في الأيام:</strong> شهر عملت فيه ولا يظهر يعني أن صاحب العمل لم يصرّح عنك عن تلك الفترة. هذا حقّ مالي وتأميني يضيع بصمتك.</li>
<li><strong>اسم منشأة لا تعرفه:</strong> يستوجب مراجعة فورية لمؤسسة الضمان الاجتماعي.</li>
<li><strong>الرقم الإجمالي:</strong> احفظ عدد الأيام؛ كثير من المعاملات تشترط حدّاً أدنى منها، وحسابه من الكشف أدقّ من التقدير بالذاكرة.</li>
</ul>
<p>إن وجدت نقصاً، اجمع ما يثبت العمل في تلك الفترة (عقد، إيصالات، شهود) قبل تقديم الشكوى — الشكوى بلا إثبات تُغلق سريعاً.</p>
$html$
WHERE (id='edevlet-sgk-hizmet-dokumu' OR slug='edevlet-sgk-hizmet-dokumu')
  AND details NOT LIKE '%الرابط الرسمي المباشر%';

-- ─────────────────────────────────────────────────────────────
-- 4) الديون الضريبية
UPDATE articles
SET details = details || $html$
<h2>أين تجدها رسمياً</h2>
<p>الاستعلام عن الضرائب والرسوم والغرامات يتبع <strong>رئاسة إدارة الإيرادات (Gelir İdaresi Başkanlığı)</strong>، ومدخلها الرسمي على البوابة:<br>
<a href="https://www.turkiye.gov.tr/vergi-harc-ve-cezalar-hizmetleri" target="_blank" rel="noopener nofollow">turkiye.gov.tr/vergi-harc-ve-cezalar-hizmetleri</a> — «Vergi, Harç ve Cezalar»<br>
ومنها تصل إلى خدمات الاستعلام والدفع، ومنها خدمة دين المخالفات المرورية: <a href="https://www.turkiye.gov.tr/gib-intvrg-trafik-para-cezasi-borcu-sorgulama-ve-odeme" target="_blank" rel="noopener nofollow">استعلام ودفع دين المخالفات المرورية</a>.</p>

<h2>مَن يظهر عليه دين ضريبي أصلاً؟</h2>
<p>ليس كل مقيم. الدين الضريبي يظهر غالباً على مَن له نشاط أو التزام مسجّل: <strong>صاحب سجل تجاري أو شركة</strong>، <strong>مالك عقار أو مركبة</strong> (ضرائب دورية)، أو مَن ترتّبت عليه <strong>غرامة</strong>. إن كنت موظفاً براتب فحسب، الغالب ألا يظهر شيء — وظهور صفر نتيجة صحيحة لا خلل.</p>

<h2>لماذا لا يُترك الدين معلّقاً</h2>
<ul>
<li>الدين الضريبي المتأخر <strong>يتراكم عليه فرق تأخير</strong>، فالمبلغ اليوم أقلّ منه بعد أشهر.</li>
<li>وجود دين قد <strong>يعطّل معاملات</strong> مرتبطة به (نقل ملكية، تجديد سجل).</li>
<li>ادفع من القناة الرسمية فقط. لا تدفع لوسيط يطلب بياناتك مقابل «تسوية» — البوابة تتيح الدفع مباشرة.</li>
</ul>
<p>إن ظهر دين لا تعرف مصدره، لا تسدّده قبل معرفة سببه: راجع <a href="/article/edevlet-adima-tescilli-arac">المركبات المسجّلة باسمك</a> و<a href="/article/edevlet-plaka-ceza">مخالفات اللوحة</a> — كثير من الديون «المجهولة» مصدرها مركبة أو مخالفة.</p>
$html$
WHERE (id='edevlet-vergi-borcu' OR slug='edevlet-vergi-borcu')
  AND details NOT LIKE '%أين تجدها رسمياً%';

UPDATE articles
SET last_update = '2026-07-25'
WHERE id IN ('edevlet-plaka-ceza','edevlet-adima-tescilli-arac','edevlet-sgk-hizmet-dokumu','edevlet-vergi-borcu')
   OR slug IN ('edevlet-plaka-ceza','edevlet-adima-tescilli-arac','edevlet-sgk-hizmet-dokumu','edevlet-vergi-borcu');

COMMIT;

-- التحقّق: يجب أن يرتفع الطول ويظهر 1 في العمود الأخير للأربعة.
SELECT id,
       length(details) AS len,
       (details LIKE '%turkiye.gov.tr%')::int AS has_official_link
FROM articles
WHERE id IN ('edevlet-plaka-ceza','edevlet-adima-tescilli-arac','edevlet-sgk-hizmet-dokumu','edevlet-vergi-borcu')
   OR slug IN ('edevlet-plaka-ceza','edevlet-adima-tescilli-arac','edevlet-sgk-hizmet-dokumu','edevlet-vergi-borcu')
ORDER BY id;
