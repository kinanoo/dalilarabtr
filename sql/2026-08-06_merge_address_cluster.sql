-- ============================================================================
-- عنقود العنوان والأحياء المغلقة: توحيد وتوصيل (2026-08-06)
-- ============================================================================
-- المشكلة هنا ليست تكراراً. المشكلة أنّ الجواب موجود على الموقع، والصفحات
-- التي تحتاجه لا تشير إليه.
--
-- /zones فاحص يغطّي 1,166 حيّاً في 63 ولاية، مصدره مديريات الهجرة في
-- الولايات، ويعرض تاريخ آخر تحديث للقائمة. واثنتا عشرة صفحة من خمس عشرة في
-- هذا العنقود — وهي التي يهبط عليها من يبحث «حيّي مغلق» — لا تربط به ولا
-- مرّة واحدة. تقول للقارئ «اتصل بـ157 واسأل المختار»، وهو ما يُكتب حين لا
-- يوجد أفضل، ونحن نملك ما هو أفضل.
--
-- وخطآن وقائعيان، كلاهما صار مسنَداً:
--
--   • أقوى صفحة في العنقود (781 كلمة) تقول «حدّث العنوان خلال 20 يوماً».
--     المادة 51 من قانون خدمات النفوس رقم 5490 تقول عشرين **يوم عمل**،
--     وتنصّ على سريانها على الأجانب المقيمين في تركيا. الفرق نحو أسبوع
--     كامل على مهلة تترتّب عليها غرامة.
--   • وصفحة أخرى تسمّي القاعدة نفسها «القاعدة الشائعة» بلا مادة. الآن
--     تُذكر المادة.
--
-- عمودان يبقيان لأنّ السؤالين مختلفان:
--   • «حيّي مغلق، ماذا أفعل؟»   ← address-registration-closed
--   • «تحديث العنوان إجباري؟»   ← syrian-address-update-mandate-turkey
--
-- وخمس صفحات تعيد صياغة أحدهما تُدمج، وصفحة إسطنبول من كانون الأول 2025
-- تُحوَّل إلى قائمة حزيران 2026 المسنَدة.
--
-- القاعدة: لا يُنقل عنصر إلا مسمّى في المولّد، وكل تصحيح نصّي يجب أن يطابق
-- مرّة واحدة تماماً وإلا فشل التوليد.
--
-- شغّله بعد اكتمال نشر الشيفرة (التحويلات في next.config.ts).
-- ============================================================================

-- address-registration-closed  ←  2 صفحة
UPDATE articles SET
    documents = ARRAY['عقد إيجار (Kira Kontratı) صحيح وموقع.', 'فاتورة خدمات (كهرباء/ماء/غاز/إنترنت) أو ورقة اشتراك باسم الساكن إن أمكن.', 'رقم الشقة/اللوحة (Daire No) وكود العنوان (Numarataj) إن طُلب.', 'إقامة/كملك + جواز السفر عند المراجعة.']::text[],
    steps = ARRAY['قبل توقيع العقد: اسأل بشكل صريح هل يمكن تثبيت نفوس الأجانب في هذا الحي حالياً، ولا تعتمد على كلام الوسيط فقط.', 'تحقّق من وضع الحي في فاحص المناطق المحظورة على /zones — يغطّي 1,166 حيّاً في 63 ولاية ويعرض تاريخ آخر تحديث للقائمة. ثم أكّده مع المختار أو النفوس، فالقوائم تتغيّر.', 'إذا كان الحي مغلقاً وتم رفض التسجيل: اطلب سبب الرفض بوضوح واسأل عن البدائل المقبولة (حي مفتوح/منطقة مجاورة/استثناء).', 'إن لم يوجد استثناء لحالتك: ابحث عن سكن في حي مفتوح ثم أعد محاولة تثبيت العنوان بعقد جديد صحيح.', 'بعد تثبيت العنوان: احتفظ بوثيقة العنوان/تحديث النفوس وأي مستندات تؤكد أن عنوانك صار مسجلاً رسمياً.', 'اطلب تحديث القيد القديم بحيث يظهر انتقالك وتثبت عنوانك الجديد رسمياً.']::text[],
    tips = ARRAY['أفضل وقت للتحقق هو قبل دفع العربون؛ كثير من الخسائر تأتي من توقيع عقد في حي مغلق.', 'إن كنت ستنتقل، حاول اختيار عقد قابل للإلغاء أو تفاوض على بنود واضحة لتجنب خسارة التأمين.', 'تثبيت العنوان ليس “إجراء شكلي”؛ هو أساس كثير من الخدمات (بنوك/مدارس/إقامة).', 'إذا قال لك أحد “ثبّت لاحقاً” بدون ضمان، اعتبرها إشارة خطر.', 'لا تثبّت عنواناً غير حقيقي؛ أي تناقض قد يسبب مشاكل أكبر لاحقاً.', 'أحياناً يكون الرفض بسبب نقص بسيط في العقد/البيانات وليس “إغلاق العنوان”؛ اسأل عن سبب الرفض مكتوباً إن أمكن.']::text[],
    title = 'الحي المغلق أمام تسجيل الأجانب 2026: كيف تتحقّق قبل توقيع العقد وماذا تفعل عند الرفض',
    seo_title = 'الحي المغلق أمام تسجيل الأجانب 2026: كيف تتحقّق قبل توقيع العقد وماذا تفعل عند الرفض',
    seo_description = 'قبل أن تدفع عربوناً: تحقّق إن كان الحي مغلقاً أمام تثبيت نفوس الأجانب عبر فاحص المناطق، وما البدائل عند الرفض، وكيف تُحدَّث القيود على عنوانك القديم.',
    last_update = CURRENT_DATE
WHERE slug = 'address-registration-closed';

-- syrian-address-update-mandate-turkey  ←  3 صفحة
UPDATE articles SET
    documents = ARRAY['بطاقة الكملك الأصلية', 'عقد إيجار مسجَّل بالنوتر', 'إثبات ملكية العقار (إن كنت مالكاً) أو إذن سكن من المالك', 'صورة من بطاقة هوية صاحب العقد', 'كود UAVT للعقار (إن كان مطلوباً).']::text[],
    steps = ARRAY['فور الانتقال إلى منزل جديد: بلّغ عن العنوان خلال 20 يوم عمل — المادة 51 من قانون خدمات النفوس رقم 5490، وهي تسري على الأجانب المقيمين أيضاً.', 'الطريقة الأسرع: عبر e-Devlet → "Yerleşim Yeri Adresi Bildirimi"', 'البديل: إدارة النفوس (Nüfus Müdürlüğü) بالأوراق المطلوبة', 'إذا انتقلت لولاية أخرى: أبلغ إدارة الهجرة الإقليمية أيضاً', 'استخرج وثيقة العنوان من e-Devlet عبر خدمة «Yerleşim Yeri (İkametgah) Belgesi Sorgulama» واحتفظ بها PDF.', 'إذا طُلب منك كود UAVT: اطلبه من البلدية/المختار أو عبر الاستعلامات الرسمية المتاحة في ولايتك.']::text[],
    tips = ARRAY['حدّث العنوان فوراً — ولا تنتظر زيارة المراقبة', 'تجنّب العناوين الوهمية تماماً — العقوبات صارمة وتشمل الترحيل', 'اتصل بـ YİMER 157 (مجاني، بالعربية) لأي استفسار قانوني', 'احتفظ بنسخة Yerleşim Yeri Belgesi دائماً معك', 'بعض الولايات مغلقة لاستقبال السوريين الجدد — اسأل قبل الانتقال', 'الوثيقة تُطلب كثيراً: بنك/إنترنت/دوائر، لذلك احتفظ بنسخة PDF جاهزة.', 'تأكد من تطابق العنوان مع عقد الإيجار لتجنب رفض معاملات لاحقة.']::text[],
    title = 'تحديث العنوان الإجباري في تركيا 2026: مهلة 20 يوم عمل وعواقب التأخير',
    seo_title = 'تحديث العنوان الإجباري في تركيا 2026: مهلة 20 يوم عمل وعواقب التأخير',
    seo_description = 'المادة 51 من قانون النفوس 5490 توجب تبليغ العنوان خلال 20 يوم عمل من الانتقال، وتسري على الأجانب. الخطوات عبر e-Devlet أو النفوس، وكود UAVT، ووثيقة العنوان، وما يحدث عند التأخير.',
    last_update = CURRENT_DATE
WHERE slug = 'syrian-address-update-mandate-turkey';

-- التصحيح الوقائعي: 20 يوم عمل، لا 20 يوماً ---------------------------
UPDATE articles SET details = replace(details, '<p style="margin: 0;"><strong>القاعدة الذهبية:</strong> فور الانتقال إلى مسكن جديد، خلال 20 يوماً كحد أقصى — حتى لو كان الانتقال داخل نفس الحي.</p>', '<p style="margin: 0;"><strong>القاعدة الذهبية:</strong> فور الانتقال إلى مسكن جديد، بلّغ عن العنوان خلال <strong>20 يوم عمل</strong> — حتى لو كان الانتقال داخل نفس الحي. والمدة منصوص عليها في المادة 51 من قانون خدمات النفوس رقم 5490، وتسري على الأجانب المقيمين في تركيا كما تسري على المواطنين. وانتبه: عشرون <em>يوم عمل</em> لا عشرون يوماً تقويمياً — الجُمَع والعطل الرسمية لا تُحتسب.</p>'), last_update = CURRENT_DATE
WHERE slug = 'syrian-address-update-mandate-turkey';

-- توصيل الصفحات بالفاحص ------------------------------------------------
UPDATE articles SET details = coalesce(details, '') || '<div style="margin-top:1.25rem;padding:1rem;border-radius:0.75rem;border:1px solid #a7f3d0;background:#ecfdf5;"><p style="margin:0;"><strong>تحقّق من حيّك قبل أي خطوة:</strong> عندنا فاحص يغطّي 1,166 حيّاً في 63 ولاية، ويبيّن ما إذا كان حيّك ما زال مغلقاً أمام تسجيل الأجانب أم أُعيد فتحه، مع تاريخ آخر تحديث للقائمة. <a href="/zones" style="color:#047857;font-weight:bold;">افتح فاحص المناطق المحظورة ←</a> والمختار يبقى المرجع الإداري الأخير عند أي شكّ.</p></div>', last_update = CURRENT_DATE
WHERE slug = 'address-registration-closed' AND coalesce(details, '') NOT LIKE '%/zones%';

UPDATE articles SET details = coalesce(details, '') || '<div style="margin-top:1.25rem;padding:1rem;border-radius:0.75rem;border:1px solid #a7f3d0;background:#ecfdf5;"><p style="margin:0;"><strong>تحقّق من حيّك قبل أي خطوة:</strong> عندنا فاحص يغطّي 1,166 حيّاً في 63 ولاية، ويبيّن ما إذا كان حيّك ما زال مغلقاً أمام تسجيل الأجانب أم أُعيد فتحه، مع تاريخ آخر تحديث للقائمة. <a href="/zones" style="color:#047857;font-weight:bold;">افتح فاحص المناطق المحظورة ←</a> والمختار يبقى المرجع الإداري الأخير عند أي شكّ.</p></div>', last_update = CURRENT_DATE
WHERE slug = 'syrian-address-update-mandate-turkey' AND coalesce(details, '') NOT LIKE '%/zones%';

UPDATE articles SET details = coalesce(details, '') || '<div style="margin-top:1.25rem;padding:1rem;border-radius:0.75rem;border:1px solid #a7f3d0;background:#ecfdf5;"><p style="margin:0;"><strong>تحقّق من حيّك قبل أي خطوة:</strong> عندنا فاحص يغطّي 1,166 حيّاً في 63 ولاية، ويبيّن ما إذا كان حيّك ما زال مغلقاً أمام تسجيل الأجانب أم أُعيد فتحه، مع تاريخ آخر تحديث للقائمة. <a href="/zones" style="color:#047857;font-weight:bold;">افتح فاحص المناطق المحظورة ←</a> والمختار يبقى المرجع الإداري الأخير عند أي شكّ.</p></div>', last_update = CURRENT_DATE
WHERE slug = 'closed-neighborhoods-80-percent-reduction-2026' AND coalesce(details, '') NOT LIKE '%/zones%';

UPDATE articles SET details = coalesce(details, '') || '<div style="margin-top:1.25rem;padding:1rem;border-radius:0.75rem;border:1px solid #a7f3d0;background:#ecfdf5;"><p style="margin:0;"><strong>تحقّق من حيّك قبل أي خطوة:</strong> عندنا فاحص يغطّي 1,166 حيّاً في 63 ولاية، ويبيّن ما إذا كان حيّك ما زال مغلقاً أمام تسجيل الأجانب أم أُعيد فتحه، مع تاريخ آخر تحديث للقائمة. <a href="/zones" style="color:#047857;font-weight:bold;">افتح فاحص المناطق المحظورة ←</a> والمختار يبقى المرجع الإداري الأخير عند أي شكّ.</p></div>', last_update = CURRENT_DATE
WHERE slug = 'urfa-closed-neighborhoods-list-2026' AND coalesce(details, '') NOT LIKE '%/zones%';

UPDATE articles SET details = coalesce(details, '') || '<div style="margin-top:1.25rem;padding:1rem;border-radius:0.75rem;border:1px solid #a7f3d0;background:#ecfdf5;"><p style="margin:0;"><strong>تحقّق من حيّك قبل أي خطوة:</strong> عندنا فاحص يغطّي 1,166 حيّاً في 63 ولاية، ويبيّن ما إذا كان حيّك ما زال مغلقاً أمام تسجيل الأجانب أم أُعيد فتحه، مع تاريخ آخر تحديث للقائمة. <a href="/zones" style="color:#047857;font-weight:bold;">افتح فاحص المناطق المحظورة ←</a> والمختار يبقى المرجع الإداري الأخير عند أي شكّ.</p></div>', last_update = CURRENT_DATE
WHERE slug = 'urfa-closed-neighborhoods-residence-2026' AND coalesce(details, '') NOT LIKE '%/zones%';

UPDATE articles SET details = coalesce(details, '') || '<div style="margin-top:1.25rem;padding:1rem;border-radius:0.75rem;border:1px solid #a7f3d0;background:#ecfdf5;"><p style="margin:0;"><strong>تحقّق من حيّك قبل أي خطوة:</strong> عندنا فاحص يغطّي 1,166 حيّاً في 63 ولاية، ويبيّن ما إذا كان حيّك ما زال مغلقاً أمام تسجيل الأجانب أم أُعيد فتحه، مع تاريخ آخر تحديث للقائمة. <a href="/zones" style="color:#047857;font-weight:bold;">افتح فاحص المناطق المحظورة ←</a> والمختار يبقى المرجع الإداري الأخير عند أي شكّ.</p></div>', last_update = CURRENT_DATE
WHERE slug = 'konya-closed-neighborhoods-list-2026' AND coalesce(details, '') NOT LIKE '%/zones%';

-- الصفحات المدموجة والمُحوَّلة تُحذف بعد نقل ما يستحقّ
DELETE FROM articles WHERE slug IN ('address-registration-problems', 'identity-closed-address-reset', 'identity-adres-beyani-20-days-uavt', 'kimlik-address-proof', 'edevlet-adres-belgesi', 'istanbul-closed-areas');

-- ═══════════════════════════════════════════════════════════════════════════
-- التحقّق — الأول صفّان، والثاني صفر، والثالث صفر، والرابع 6 صفوف كلّها true
SELECT slug, coalesce(array_length(documents,1),0) AS docs,
       coalesce(array_length(steps,1),0) AS steps,
       coalesce(array_length(tips,1),0)  AS tips, last_update
FROM articles WHERE slug IN ('address-registration-closed', 'syrian-address-update-mandate-turkey') ORDER BY slug;

SELECT slug FROM articles WHERE slug IN ('address-registration-problems', 'identity-closed-address-reset', 'identity-adres-beyani-20-days-uavt', 'kimlik-address-proof', 'edevlet-adres-belgesi', 'istanbul-closed-areas');

-- لا يبقى «20 يوماً» بلا كلمة «عمل» في صفحة المهلة
SELECT slug FROM articles
WHERE slug = 'syrian-address-update-mandate-turkey'
  AND (details LIKE '%خلال 20 يوماً%' OR array_to_string(steps, ' ') LIKE '%خلال 20 يوماً%');

SELECT slug, (details LIKE '%/zones%') AS يربط_بالفاحص
FROM articles WHERE slug IN ('address-registration-closed', 'syrian-address-update-mandate-turkey', 'closed-neighborhoods-80-percent-reduction-2026', 'urfa-closed-neighborhoods-list-2026', 'urfa-closed-neighborhoods-residence-2026', 'konya-closed-neighborhoods-list-2026') ORDER BY slug;
