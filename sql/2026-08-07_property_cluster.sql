-- ============================================================================
-- دفعة العقارات: الوحش يحمل الحقيقة الصعبة أصلاً — نطعمه الباقي
-- ============================================================================
-- buying-property-turkey-2026 (23,151 حرفاً) يحمل قسم «الوضع الخاص بالسوريين»
-- الحاسم بمصادره وتاريخ تحقّقه (2026-07-11): المنع قائم بالكامل، وأساسه قانون
-- المعاملة بالمثل 1062 لسنة 1927 وقرار 1939 لا صفة اللجوء، ويشمل الإرث.
-- فنقض syrian-property-ownership الغامض («قد تظهر تعقيدات») يتقاعد إليه —
-- النقض يتردّد حيث يجيب المرجعي.
--
-- والعمل الحقيقي فيما لا يغطّيه الوحش:
--   * finance-luxury-property-tax يُبنى صفحة DKV الحقيقية: القانون 7194،
--     والمساكن فقط فوق عتبة تُحدَّث سنوياً (بلا رقم — مؤكَّد آلياً)، والإعفاء
--     الذي يحسم أكثر الحالات: المسكن الوحيد معفى ولو فوق العتبة، وأدنى
--     المساكن قيمةً لمتعدّدها، والتصريح والقسطان.
--   * دليل الاشتراكات (21.5 ألف حرف) يكسب قسم النومراتاج الناقص (محروس)،
--     ويتقاعد نقضها إليه.
--   * real-estate-residence (919 حرفاً بعتبة قيمية) مؤجَّلة كسابقاتها —
--     تبقى حيّة لدفعة الإقامات، مؤكَّدة في الفحص.
--
-- الصفوف كلّها id == slug (فُحص)، ولا روابط واردة للمتقاعدَين.
-- آمن لإعادة التشغيل.
-- ============================================================================

-- أ. صفحة DKV
INSERT INTO articles (id, slug, title, intro, details, steps, tips, documents,
                      fees, warning, source, tags, category, status,
                      seo_title, seo_description, last_update)
VALUES ('finance-luxury-property-tax', 'finance-luxury-property-tax', 'ضريبة السكن الفاخر (Değerli Konut Vergisi) في تركيا 2026: من يدفعها فعلاً — وإعفاء المسكن الوحيد', 'اشتريت أو تنوي شراء سكنٍ مرتفع القيمة في تركيا؟ توجد ضريبة سنوية خاصة تُصيب المساكن التي تتجاوز قيمتها عتبةً تُحدَّث كل سنة — لكن أهمّ ما فيها ليس نسبها بل إعفاؤها: مسكنك الوحيد معفى ولو تجاوز العتبة، ومن يملك أكثر من مسكن يُعفى أدناها قيمة. هذا الدليل يشرح الآلية والإعفاء والمواعيد — بلا أرقام تتقادم.', '<div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:18px 22px;margin:0 0 20px;"><p style="margin:0 0 10px;font-size:17px;"><strong>الخلاصة</strong></p><p style="margin:0;">ضريبة سنوية على <strong>المساكن</strong> التي تتجاوز قيمتها المقدَّرة عتبة السنة — والعتبة تُحدَّث سنوياً فلا نحفظ رقماً. والإعفاء الذي يحسم أكثر الحالات: <strong>المسكن الوحيد معفى</strong> ولو جاوز العتبة.</p></div><h2>ما هي — ومن تصيب؟</h2><p>ضريبة السكن الفاخر (<span dir="ltr">Değerli Konut Vergisi</span>) أُدخلت بالقانون 7194 على منظومة ضريبة العقارات، وتصيب العقارات <strong>السكنية</strong> (<span dir="ltr">mesken</span>) التي تتجاوز قيمتها المعتمدة عتبة السنة الجارية. خارجها: المحلات والمكاتب والأراضي — ليست «سكناً» فلا تدخل هذه الضريبة (ولها ضريبة العقار العادية).</p><ul><li><strong>العتبة</strong>: تُعاد معايرتها كل سنة بإعادة التقييم — اعرف رقم سنتك من مصلحة الضرائب أو محاسبك، ولا تعتمد رقماً متداولاً.</li><li><strong>النسب تصاعدية بالشرائح</strong> فوق العتبة — تُحصَّل بالألف على أجزاء القيمة، لا على كاملها دفعةً واحدة.</li></ul><h2>الإعفاء الذي يحسم أكثر الحالات</h2><ul><li><strong>مسكن وحيد؟ معفى</strong> — من يملك في تركيا مسكناً واحداً لا يدفع هذه الضريبة ولو تجاوزت قيمته العتبة.</li><li><strong>أكثر من مسكن فوق العتبة؟</strong> يُعفى <strong>أدناها قيمةً</strong> ويُصرَّح عن الباقي.</li></ul><p>فقبل أي قلق: عدّ مساكنك. أكثر المشترين العرب — شقة سكن أو شقة استثمار واحدة — خارج هذه الضريبة كلّياً إمّا بالعتبة وإمّا بإعفاء الوحيد.</p><h2>التصريح والدفع</h2><ol><li>من تجاوز مسكنُه العتبة (ولم يشمله الإعفاء) يقدّم <strong>تصريحاً سنوياً</strong> لمصلحة الضرائب في المدّة المقرَّرة مطلع السنة.</li><li>الدفع على <strong>قسطين</strong> في السنة بالمواعيد الرسمية.</li><li>الإهمال يراكم غرامات تأخير — والمحاسب أرخص منها دائماً.</li></ol><h2>أسئلة متكرّرة</h2><h3>هل تعنيني وأنا مستأجر؟</h3><p>لا — الضريبة على المالك لا الساكن. وشأنك كمستأجرٍ صفحةُ <a href="/article/renting-house">الاستئجار وحقوقه</a>.</p><h3>أشتري للاستثمار بقصد الجنسية — هل تغيّر حساباتي؟</h3><p>أدخلها في كلفة التملّك السنوية إن كان عقارك سكنياً فوق العتبة وليس وحيدك — وتفاصيل مسار الاستثمار في <a href="/article/real-estate-citizenship">الجنسية عبر الاستثمار العقاري</a> و<a href="/article/buying-property-turkey-2026">دليل شراء العقار الكامل</a>.</p><h3>من يقدّر «قيمة» مسكني أصلاً؟</h3><p>القيمة المعتمدة لضريبة العقار (وتقديرات الجهات المختصة عند وجودها) هي الأساس — لا سعر إعلانك ولا تخمين الوسيط. اطلب من محاسبك التحقّق قبل افتراض الخضوع أو الإعفاء.</p>', ARRAY['عدّ مساكنك في تركيا أولاً: مسكن وحيد = معفى مهما بلغت قيمته.', 'اعرف عتبة السنة الجارية من مصلحة الضرائب أو محاسبك — تُحدَّث سنوياً.', 'قارن القيمة المعتمدة (لا سعر السوق المعلن) بالعتبة.', 'إن خضعت: قدّم التصريح في مدّته مطلع السنة، وادفع على قسطين.', 'وثّق كل تصريح ودفعة — وكلّف محاسباً في الحالات المركّبة.']::text[], ARRAY['الإعفاء الأهم: المسكن الوحيد معفى ولو فوق العتبة — عدّ مساكنك قبل القلق.', 'متعدّد المساكن: أدناها قيمةً يُعفى.', 'سكني فقط (mesken) — المحل والمكتب والأرض خارجها.', 'العتبة والنسب تُحدَّث سنوياً — لا تعتمد رقماً من صفحة قديمة.', 'القيمة المعتمدة رسمياً هي الأساس، لا سعر الإعلان.', 'غرامات التأخير أغلى من المحاسب.']::text[], ARRAY['سند الطابو لكل مسكن تملكه', 'القيمة المعتمدة لضريبة العقار من البلدية', 'تصريح الضريبة عند الخضوع — يعدّه محاسبك عادةً']::text[], 'لا ننشر عتبة ولا نسباً — تُحدَّث سنوياً بإعادة التقييم؛ مرجعك مصلحة الضرائب أو محاسبك للسنة الجارية. والتصريح نفسه بلا رسم، وأتعاب المحاسب تعاقدية.', 'الضريبة على المساكن فقط وفوق عتبة سنوية متغيّرة — والمسكن الوحيد معفى بنصّ القانون. لا تبنِ قراراً على رقم عتبة متداول، ولا تهمل التصريح إن خضعت: الغرامات تتراكم.', 'ضريبة السكن الفاخر المستحدثة بالقانون رقم 7194 ضمن قانون ضريبة العقارات (Emlak Vergisi Kanunu) — نطاق «المسكن»، والعتبة المعاد تقييمها سنوياً، والشرائح التصاعدية، وإعفاء المسكن الوحيد وأدنى المساكن قيمةً لمتعدّدها، والتصريح والقسطان السنويان — مصلحة الضرائب التركية (gib.gov.tr)', ARRAY['ضريبة العقارات', 'شراء عقار', 'العمل والاستثمار', 'DKV', 'دليل', '2026']::text[],
        'العمل والاستثمار', 'approved', 'ضريبة السكن الفاخر في تركيا: المسكن الوحيد معفى — والعتبة سنوية', 'Değerli Konut Vergisi تصيب المساكن فوق عتبة تُحدَّث سنوياً — لكن مسكنك الوحيد معفى ولو تجاوزها، ومتعدّد المساكن يُعفى أدناها. الآلية والتصريح والقسطان، بلا أرقام تتقادم.', CURRENT_DATE)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, intro = EXCLUDED.intro, details = EXCLUDED.details,
    steps = EXCLUDED.steps, tips = EXCLUDED.tips, documents = EXCLUDED.documents,
    fees = EXCLUDED.fees, warning = EXCLUDED.warning, source = EXCLUDED.source,
    tags = EXCLUDED.tags, category = EXCLUDED.category, status = EXCLUDED.status,
    seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description,
    last_update = EXCLUDED.last_update;

-- ب. قسم النومراتاج في دليل الاشتراكات (محروس)
UPDATE articles SET details = details || '<h2>ورقة النومراتاج (Numarataj): حين يطلبها موظف الاشتراك</h2><p>النومراتاج وثيقة من <strong>البلدية</strong> تثبت أنّ عنوان العقار — رقم البناء والباب والشقة وكود العنوان — <strong>معرَّف رسمياً</strong> في نظامها. لا تحتاجها كل مرة؛ تظهر عادةً في حالتين:</p><ul><li><strong>أول اشتراك</strong> كهرباء/ماء/غاز لعقار جديد أو عنوانٍ لم يسبق ربطه.</li><li><strong>لبس في العنوان</strong>: رقم شقة مكرَّر، أو بناء أعيد ترقيمه، أو اختلاف بين ما في العقد وما في السجلّات.</li></ul><p><strong>من أين؟</strong> من وحدة النومراتاج في بلدية منطقتك (وبعض البلديات تتيحها إلكترونياً عبر بوابتها) — اصطحب ما يعرّف العقار: عقد الإيجار أو الطابو وهويتك. وإن طُلبت منك في معاملة نفوس أو هجرة فالمسار نفسه.</p><p>وتذكّر أنّ الورقة تعرّف <strong>العقار</strong>؛ أمّا تسجيل <strong>سكنك أنت</strong> في العنوان فمساره في <a href="/article/kimlik-data-update">تحديث بيانات العنوان</a>.</p>', last_update = CURRENT_DATE
WHERE slug = 'home-subscriptions-turkey-2026' AND details NOT LIKE '%النومراتاج%';

-- ج. التقاعد
UPDATE articles SET status = 'draft', last_update = CURRENT_DATE
WHERE slug IN ('syrian-property-ownership', 'numarataj-document') AND status = 'approved';

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = 'finance-luxury-property-tax' AND status = 'approved'
       AND details LIKE '%7194%' AND details LIKE '%المسكن الوحيد معفى%';
    IF n <> 1 THEN RAISE EXCEPTION 'the DKV rebuild did not land'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = 'home-subscriptions-turkey-2026' AND details LIKE '%النومراتاج%' AND length(details) > 15000;
    IF n <> 1 THEN RAISE EXCEPTION 'the numarataj section did not land intact'; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = 'buying-property-turkey-2026' AND status = 'approved' AND details LIKE '%الوضع الخاص للسوريين%';
    IF n <> 1 THEN RAISE EXCEPTION 'the property monster is not intact'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug IN ('syrian-property-ownership', 'numarataj-document') AND status = 'approved';
    IF n > 0 THEN RAISE EXCEPTION '% stub(s) still approved', n; END IF;

    SELECT count(*) INTO n FROM articles
     WHERE slug = 'real-estate-residence' AND status = 'approved';
    IF n <> 1 THEN RAISE EXCEPTION 'real-estate-residence must stay live'; END IF;
END
$check$;

SELECT 'DKV page live (7194 + single-dwelling exemption, no figures)' AS البند,
       (details LIKE '%7194%' AND details NOT LIKE '%مليون%')::text AS النتيجة
FROM articles WHERE slug = 'finance-luxury-property-tax'
UNION ALL
SELECT 'subscriptions guide gained the numarataj section',
       (details LIKE '%النومراتاج%')::text
FROM articles WHERE slug = 'home-subscriptions-turkey-2026'
UNION ALL
SELECT 'two stubs retired (want 0 approved)', count(*)::text
FROM articles WHERE slug IN ('syrian-property-ownership', 'numarataj-document') AND status = 'approved'
UNION ALL
SELECT 'real-estate-residence left live for the residence batch', status
FROM articles WHERE slug = 'real-estate-residence';
