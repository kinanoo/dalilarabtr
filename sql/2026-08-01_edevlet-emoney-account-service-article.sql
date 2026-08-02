-- ============================================================================
-- إكمال خبر البنك المركزي: مقال الخدمة + ربط الخبر به (2026-08-01)
--
-- ما يعالجه هذا الملف (ثلاث فجوات في نشر خبر TCMB):
--   1) الخدمة لم تكن مدرجة في صفحة /e-devlet-services — تلك الصفحة تُبنى من
--      جدول articles بشرط category = 'خدمات e-Devlet' و status = 'approved'،
--      وتستخدم حقل source لزر «زيارة الموقع» وslug لزر «اقرأ الشرح».
--      => نُدرج مقال الخدمة بهذا التصنيف بالضبط فيظهر تلقائياً في الصفحة.
--   2) زر «إكمال الخبر» في صفحة الخبر كان يشير إلى /e-devlet-services (صفحة
--      قائمة) بدل شرح مخصّص => نُحدّث updates.link ليشير إلى المقال الجديد.
--   3) الخبر لم يكن له مقال مرافق => هذا الملف ينشئه.
--
-- رابط الخدمة الرسمي على بوابة e-Devlet (مفهرس بعنوان الخدمة نفسه):
--   https://www.turkiye.gov.tr/tcmb-odeme-ve-elektronik-para-kurulusu-hesap-bilgisi
-- البيان الصحفي للبنك المركزي رقم 2026-30 بتاريخ 29 تموز/يوليو 2026:
--   https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Duyurular/Basin/2026/DUY2026-30
--
-- شغّله مرّة واحدة في Supabase <- SQL Editor. آمن لإعادة التشغيل (idempotent).
-- ============================================================================

-- ─── 1) مقال الخدمة (يظهر تلقائياً في /e-devlet-services) ───
INSERT INTO articles (id, slug, title, category, intro, details, documents, steps, tips, warning, source, seo_title, seo_description, seo_keywords, tags, status, active, published_at, last_update)
VALUES (
  'edevlet-odeme-elektronik-para-hesap-sorgulama',
  'edevlet-odeme-elektronik-para-hesap-sorgulama',
  $$الاستعلام عن المحافظ الرقمية المفتوحة باسمك (مؤسسات الدفع والنقود الإلكترونية)$$,
  $$خدمات e-Devlet$$,
  $$خدمة من البنك المركزي التركي على e-Devlet تكشف لك جميع الحسابات المفتوحة باسمك لدى مؤسسات الدفع والنقود الإلكترونية (المحافظ الرقمية) — بما فيها ما فُتح دون علمك أو ما نسيته. الاستعلام مجاني، ويستطيع الورثة استخدامه لحسابات مورّثهم.$$,
  $$<p>أتاح البنك المركزي التركي (TCMB) بموجب بيانه الصحفي رقم 2026-30 بتاريخ 29 تموز/يوليو 2026 خدمة <strong>«الاستعلام عن ملكية الحسابات لدى مؤسسات الدفع والنقود الإلكترونية»</strong> على بوابة الحكومة الإلكترونية، واسمها الرسمي بالتركية: <strong>Ödeme ve Elektronik Para Kuruluşu Hesap Sahipliği Sorgulama</strong>. تعرض لك الخدمة، من شاشة واحدة، لدى أي مؤسسة دفع أو نقود إلكترونية توجد حسابات مسجّلة باسمك.</p>

<h2>ما الذي تغطيه الخدمة — وما لا تغطيه</h2>
<p>هذه نقطة الخلط الأولى: الخدمة تخصّ <strong>مؤسسات الدفع (ödeme kuruluşları) ومؤسسات النقود الإلكترونية (elektronik para kuruluşları)</strong> الخاضعة لرقابة البنك المركزي — أي المحافظ الرقمية وتطبيقات الدفع. <strong>لا تشمل الحسابات المصرفية لدى البنوك التقليدية</strong>، فتلك لها مسارات استعلام مختلفة. فإن فتحت الشاشة وكنت تتوقّع كشفاً بحساباتك البنكية فلن تجده، وهذا ليس عطلاً في الخدمة.</p>

<h2>لماذا تستحق أن تفتحها ولو مرة واحدة</h2>
<ul>
<li><strong>حسابات فُتحت باسمك دون علمك:</strong> إن استُخدمت بياناتك لفتح محفظة رقمية، تظهر لك هنا. وهذا مهم لأن الحسابات المفتوحة بأسماء الغير تُستخدم أحياناً في عمليات احتيال أو تحويلات مشبوهة، فيجد صاحب الاسم نفسه طرفاً في مساءلة لا ناقة له فيها ولا جمل.</li>
<li><strong>أموال منسيّة:</strong> محافظ سجّلت فيها قبل سنوات ونسيتها، وربما بقي فيها رصيد.</li>
<li><strong>معاملات الإرث:</strong> يستطيع الوريث الشرعي الاستعلام عن حسابات مورّثه لدى هذه المؤسسات، وهو ما يسرّع حصر الأصول المالية الرقمية بدل ضياعها.</li>
</ul>

<h2>خطوات الاستعلام</h2>
<p>ادخل إلى <strong>turkiye.gov.tr</strong> بحسابك (رقم الكملك/الأجنبي + كلمة مرور e-Devlet)، ثم اكتب في خانة البحث العبارة الرسمية <strong>Ödeme ve Elektronik Para Kuruluşu Hesap Sahipliği Sorgulama</strong> — أو ببساطة <strong>elektronik para</strong> — وافتح الخدمة من نتائج البحث. ويمكنك الوصول إليها مباشرة عبر زر «زيارة الموقع» في أعلى هذه الصفحة.</p>

<h2>للمقيمين الأجانب وحاملي الكملك</h2>
<p>الخدمة تعمل عبر بوابة e-Devlet، فمن يملك حساباً على البوابة برقمه الأجنبي يستطيع فتحها والاستعلام. وننصح كل مقيم بفحصها ولو مرة واحدة: حملة الهويات الأجنبية من أكثر الفئات عرضةً لسوء استخدام بياناتهم في فتح محافظ رقمية، خصوصاً من سلّم نسخة من كملكه أو إقامته لجهة غير موثوقة (مكتب، وسيط، صاحب عمل غير نظامي). وإن ظهر لك حساب لم تفتحه بنفسك، فبادر فوراً بمخاطبة المؤسسة المعنية وتوثيق الواقعة خطياً.</p>

<h2>ملاحظة تحريرية</h2>
<p>تفاصيل ما يظهر على الشاشة (الحسابات الفعّالة والخاملة وبيانات الرصيد) وردت في التغطيات الصحفية بدرجات تفصيل متفاوتة؛ والمرجع النهائي هو نصّ بيان البنك المركزي والشاشة نفسها على البوابة. ولا يوجد أي رسم مقابل هذا الاستعلام — لا تدفع لأي وسيط يعرض عليك «كشف الحسابات المفتوحة باسمك». — هيئة تحرير دليل العرب</p>$$,
  ARRAY[
    $$رقم الكملك أو الرقم الأجنبي (11 خانة)$$,
    $$كلمة مرور e-Devlet — تُستخرج من أي مكتب بريد PTT$$,
    $$للورثة: وثيقة حصر الإرث (Veraset İlamı) عند الحاجة لإثبات الصفة$$
  ]::text[],
  ARRAY[
    $$ادخل إلى turkiye.gov.tr وسجّل الدخول برقمك وكلمة مرور e-Devlet$$,
    $$اكتب في خانة البحث: Ödeme ve Elektronik Para Kuruluşu Hesap Sahipliği Sorgulama$$,
    $$افتح الخدمة واستعرض قائمة المؤسسات التي لديها حسابات باسمك$$,
    $$إن كنت وريثاً، اختر الاستعلام نيابةً عن المورّث$$,
    $$عند ظهور حساب لم تفتحه: خاطب المؤسسة المعنية فوراً ووثّق الواقعة خطياً$$
  ]::text[],
  ARRAY[
    $$الاستعلام مجاني تماماً — لا تدفع لأي وسيط مقابل «كشف الحسابات باسمك»$$,
    $$افحص الشاشة دورياً ولو مرة كل بضعة أشهر، خاصة إن كنت قد سلّمت نسخة من كملكك لجهة ما$$,
    $$إن لم تجد الخدمة بالاسم الكامل، ابحث بكلمة elektronik para فقط$$,
    $$كلمة مرور e-Devlet تُستخرج من أي مكتب PTT بالهوية شخصياً$$
  ]::text[],
  $$الخدمة لا تشمل الحسابات المصرفية لدى البنوك التقليدية — هي مخصّصة لمؤسسات الدفع والنقود الإلكترونية (المحافظ الرقمية) فقط. ولا تدفع أي مبلغ لوسيط مقابل هذا الاستعلام؛ فهو مجاني ويتم بنفسك عبر e-Devlet.$$,
  $$https://www.turkiye.gov.tr/tcmb-odeme-ve-elektronik-para-kurulusu-hesap-bilgisi$$,
  $$الاستعلام عن المحافظ الرقمية المفتوحة باسمك عبر e-Devlet 2026 — خدمة البنك المركزي$$,
  $$كيف تكشف الحسابات المفتوحة باسمك لدى مؤسسات الدفع والنقود الإلكترونية عبر e-Devlet؟ خدمة البنك المركزي التركي (TCMB) — الخطوات، الفرق عن الحسابات البنكية، واستعلام الورثة. مجاناً.$$,
  ARRAY[$$الاستعلام عن الحسابات المفتوحة باسمي تركيا$$, $$محفظة رقمية باسمي$$, $$Ödeme ve Elektronik Para Kuruluşu Hesap Sahipliği Sorgulama$$, $$e-Devlet البنك المركزي$$, $$elektronik para hesap sorgulama$$, $$حسابات مفتوحة دون علمي$$, $$خدمات e-Devlet بالعربي$$]::text[],
  ARRAY[$$edevlet$$, $$دليل$$]::text[],
  'approved', true, '2026-08-01', '2026-08-01'
) ON CONFLICT (id) DO UPDATE SET
  slug            = EXCLUDED.slug,
  title           = EXCLUDED.title,
  category        = EXCLUDED.category,
  intro           = EXCLUDED.intro,
  details         = EXCLUDED.details,
  documents       = EXCLUDED.documents,
  steps           = EXCLUDED.steps,
  tips            = EXCLUDED.tips,
  warning         = EXCLUDED.warning,
  source          = EXCLUDED.source,
  seo_title       = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  seo_keywords    = EXCLUDED.seo_keywords,
  tags            = EXCLUDED.tags,
  status          = EXCLUDED.status,
  active          = EXCLUDED.active,
  published_at    = EXCLUDED.published_at,
  last_update     = EXCLUDED.last_update;

-- ─── 2) ربط الخبر المنشور بالمقال (زر «إكمال الخبر») ───
UPDATE public.updates
SET link = '/article/edevlet-odeme-elektronik-para-hesap-sorgulama'
WHERE title = $t$خدمة جديدة على e-Devlet: اكشف المحافظ الرقمية المفتوحة باسمك — ولو فُتحت دون علمك$t$;

-- ─── تحقّق نهائي ───
DO $check$
DECLARE
  n_article integer;
  n_link    integer;
BEGIN
  SELECT COUNT(*) INTO n_article FROM articles
  WHERE id = $t$edevlet-odeme-elektronik-para-hesap-sorgulama$t$
    AND status = 'approved' AND active = true
    AND category = $t$خدمات e-Devlet$t$
    AND source IS NOT NULL;

  SELECT COUNT(*) INTO n_link FROM public.updates
  WHERE title = $t$خدمة جديدة على e-Devlet: اكشف المحافظ الرقمية المفتوحة باسمك — ولو فُتحت دون علمك$t$
    AND link = '/article/edevlet-odeme-elektronik-para-hesap-sorgulama';

  IF n_article <> 1 THEN
    RAISE EXCEPTION 'FAILED: المقال غير مُدرج بالتصنيف/الحالة المطلوبة (found %)', n_article;
  END IF;
  IF n_link <> 1 THEN
    RAISE EXCEPTION 'FAILED: لم يُربط الخبر بالمقال (found %) — تحقّق أن الخبر منشور بنفس العنوان', n_link;
  END IF;
  RAISE NOTICE 'OK: المقال أُدرج في تصنيف خدمات e-Devlet والخبر صار يشير إليه.';
END
$check$;

-- ─── مراجعة ───
SELECT 'article' AS kind, id, title, category, source
FROM articles
WHERE id = $t$edevlet-odeme-elektronik-para-hesap-sorgulama$t$
UNION ALL
SELECT 'update', id::text, title, category, link
FROM public.updates
WHERE title LIKE $t$خدمة جديدة على e-Devlet: اكشف المحافظ الرقمية%$t$;
