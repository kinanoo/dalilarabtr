-- ============================================================================
-- موضوع واحد وأربع صفحات: توحيد عنقود الهلال الأحمر (SUY)
-- ============================================================================
-- 92 من مقالات الموقع الـ238 المعتمَدة تحت 800 حرف، و62 تحت 300. وهذه الكتلة
-- الهزيلة تزاحم على الاستعلامات نفسها أدلّةً بثلاثين ألف حرف جيّدةً فعلاً.
-- وعنقود الهلال الأحمر أوضح الحالات وأكثرها قراءةً:
--
--     kizilay-card-application   2,406 حرفاً   181 قراءة   ← الدليل الحقيقي
--     red-crescent-card            722 حرفاً    51 قراءة   ← صار مؤشِّراً فقط
--     kizilay-card-problems        516 حرفاً    10 قراءات  ← محتوى فريد بلا مصدر
--     kizilay-card-apply           491 حرفاً     4 قراءات  ← صار مؤشِّراً فقط
--
-- 246 قراءة موزَّعة على أربعة روابط لموضوع واحد. واثنتان منها رُدَّتا في جولة
-- سابقة إلى مؤشِّرَين «للتفاصيل الكاملة: <رابط>» لكنّهما تُركتا حيّتين، فبقيتا
-- تُفهرَسان وتُكلّفان القارئ نقرةً ثانية.
--
-- ── زوجٌ بدا متطابقاً وليس كذلك ─────────────────────────────────────────
--
-- كشف الفحص نفسه identity-kimlik-iptal-v160 ← frozen-id-problem. ولم يُدمج:
-- الإبطال (İptal) وتجميد العنوان (V-160) شيئان مختلفان، وصفحة الإبطال موجودة
-- جزئياً لتصحيح هذا الالتباس بعينه — تقوله في متنها وتحيل القارئ إلى صفحة
-- التجميد. فتوجيهها إليها يرتكب الخطأ الذي كُتبت لتصحيحه.
--
-- ── ما أُضيف إلى الدليل، وما رُفض ──────────────────────────────────────
--
-- متحقَّق من منصّة البرنامج الرسمية platform.kizilaykart.org:
--
--   * الاستحقاق أوسع ممّا أوحى دليلنا. كان يتصدّره الرقم الأجنبي 99، أي
--     الحماية المؤقتة. ونصّ البرنامج: «Geçici Koruma, Uluslararası Koruma,
--     Uluslararası Koruma Başvuru Statüsü veya İnsani İkamet İzni» — فالحماية
--     الدولية، وطلبها قيد النظر، والإقامة الإنسانية كلّها مؤهَّلة. ومن كان على
--     إقامة إنسانية وقرأ صفحتنا لاستنتج أنّه مستثنى.
--   * البرنامج ما زال عاملاً: 504.1 مليون ليرة صُرفت في حزيران/يونيو 2026.
--   * تنفيذ وزارة الأسرة والخدمات الاجتماعية مع الهلال الأحمر التركي، بتمويل
--     الاتحاد الأوروبي ضمن إطار FRIT.
--   * الصرف سحباً من الصرّاف أو شراءً عبر نقاط البيع.
--   * 168 مركز اتصال الهلال الأحمر، يخدم البرنامج منذ تشرين الثاني 2016، ومنه
--     تعرف أقرب نقطة تقديم.
--
-- ومرفوضٌ من صفحة المشاكل غير المُسنَدة:
--
--   * «العمل الرسمي (SGK) يوقف البطاقة تلقائياً» — لم أجد له نصّاً رسمياً.
--     أُعيدت صياغته إلى ما يُدافَع عنه: الاستحقاق قائم على معايير الضعف
--     ويُعاد تقييمه، فتغيّر الظرف قد يغيّر الوضع — اسأل ولا تفترض.
--   * «يمكنك التقديم مرة أخرى بعد 6 أشهر» — بلا مصدر. حُذف كلّياً.
--   * «الخط 168 يعمل باللغة العربية» — الرقم متحقَّق منه، ودعم العربية عليه لا.
--     حُذف الادّعاء وبقي الرقم.
--
-- وأُبقي منها ما لا يكلّف شيئاً ويحمي القارئ: لا تبِع البطاقة ولا تُعرها،
-- وراجع المركز أو 168 عند الفقد.
--
-- ── وخطوة الأرشفة معزولة عمداً ─────────────────────────────────────────
--
-- إحالة الثلاث إلى التقاعد تضع status = 'archived' فتخرج من
-- sitemap-articles.xml الذي يرشّح على status='approved'. وكلّ صفوف المقالات
-- اليوم 'approved'، ولم أجد في المستودع قيد CHECK على articles.status — لكنّ
-- «لم أجد» ليست «غير موجود»، وSupabase يشغّل الملف معاملةً واحدة، فمخالفة قيدٍ
-- تُلغي الدمج معها. لذلك وُضع الـUPDATE في بلوك DO له معالج EXCEPTION: إن رفض
-- العمود القيمة تُتخطّى الأرشفة بإشعار ويُثبَّت الباقي. والتحويلات 301 في
-- next.config.ts تؤدّي العمل الظاهر للقارئ في الحالتين.
--
-- آمن لإعادة التشغيل.
-- ============================================================================

UPDATE articles SET
    details = details || '<h2>مَن يستحقّ — تصحيحٌ مهمّ: الاستحقاق أوسع ممّا يظنّ كثيرون</h2><p>يُقرأ هذا البرنامج غالباً على أنّه لحاملي <strong>الحماية المؤقتة</strong> وحدهم. ونصّ البرنامج أوسع: فهو لمن يحمل <strong>الحماية المؤقتة</strong>، أو <strong>الحماية الدولية</strong>، أو <strong>صفة طالب الحماية الدولية</strong> (أي أنّ طلبك ما زال قيد النظر)، أو <strong>إذن الإقامة الإنسانية</strong> (<span dir="ltr">İnsani İkamet</span>).</p><p>فإن كنت على إقامة إنسانية أو حمايةٍ دولية وظننت أنّ الباب مغلق أمامك — راجع. ويبقى شرط أن ينطبق عليك أحد معايير الضعف المذكورة أعلاه؛ الصفة تفتح الباب، والمعيار هو ما يقرّر.</p><h2>هل البرنامج ما زال قائماً؟ نعم</h2><p>تسأل الناس كثيراً إن كان البرنامج قد أُوقف. الأرقام المنشورة على منصّة البرنامج نفسها تُظهر صرف <strong>504.1 مليون ليرة</strong> على المستفيدين في <strong>حزيران/يونيو 2026</strong>. فالبرنامج عامل، ومَن سمع خلاف ذلك فقد سمع شائعة.</p><p>ويُنفَّذ بالتعاون بين <strong>وزارة الأسرة والخدمات الاجتماعية</strong> و<strong>الهلال الأحمر التركي</strong>، بتمويل من الاتحاد الأوروبي ضمن إطار <span dir="ltr">FRIT</span>. وهذا يعني أنّ قنواته رسمية بالكامل — ولا وسيط فيها.</p><h2>كيف تصلك النقود</h2><p>الصرف على بطاقة <span dir="ltr">Kızılaykart</span>: تسحب المبلغ من <strong>الصرّاف الآلي</strong>، أو تشتري به مباشرةً عبر <strong>أجهزة نقاط البيع</strong> في المتاجر. ولا يُصرف نقداً باليد من أي مكتب — فمن عرض عليك ذلك فليس من البرنامج.</p><h2>الخطّ 168 — واستعماله الصحيح</h2><p><strong>168</strong> هو مركز اتصال الهلال الأحمر التركي، ويخدم برنامج المساعدة النقدية منذ انطلاقه في تشرين الثاني/نوفمبر 2016. استعمله لتعرف <strong>أقرب نقطة تقديم إليك</strong>، ولتبلّغ عن مشكلة في بطاقتك.</p><h2>حين تتعثّر البطاقة</h2><table><thead><tr><th>الحالة</th><th>ما تفعله</th></tr></thead><tbody><tr><td><strong>لم تُشحن هذا الشهر</strong></td><td>راجع مركز خدمات الهلال الأحمر أو اتصل بـ168 واسأل عن <em>سبب</em> التوقّف في ملفّك بعينه — ولا تبنِ على سببٍ سمعته من غيرك، فالأسباب تختلف بين ملفّ وآخر</td></tr><tr><td><strong>أُوقفت المساعدة</strong></td><td>الاستحقاق قائم على معايير الضعف ويُعاد تقييمه؛ فتغيّر ظرفك قد يغيّر وضعك في البرنامج. اسأل عن السبب المسجَّل ولا تفترضه</td></tr><tr><td><strong>فُقدت أو سُرقت</strong></td><td>اتصل بـ168 فوراً لإيقافها، ثمّ راجع مركز الخدمات لاستبدالها ومعك الكملك</td></tr><tr><td><strong>لم يُقبل طلبك</strong></td><td>اسأل عن سبب الرفض، وراجع معايير الضعف أعلاه؛ وإن تغيّر ظرفك لاحقاً فراجع من جديد</td></tr></tbody></table><div style="background:#fee2e2;border-right:4px solid #dc2626;padding:14px 18px;margin:18px 0;"><p style="margin:0 0 8px;"><strong>لا تبِع بطاقتك ولا تُعرها لأحد</strong></p><p style="margin:0;">البطاقة باسمك ومربوطة بملفّك، وإعطاؤها لغيرك يعرّض استحقاقك للإلغاء. والتقديم <strong>مجاني</strong> في كلّ قنواته — فمن طلب منك مالاً مقابل «تسجيلك» أو «تسريع» ملفّك فهو وسيط لا صفة له.</p></div>',
    source  = 'برنامج المساعدة النقدية للتماسك الاجتماعي (Sosyal Uyum Yardımı — SUY) عبر Kızılaykart، تنفيذ وزارة الأسرة والخدمات الاجتماعية والهلال الأحمر التركي (Türk Kızılay) بتمويل الاتحاد الأوروبي ضمن إطار FRIT — منصّة البرنامج الرسمية platform.kizilaykart.org (بيانات الصرف حتى حزيران/يونيو 2026)، ومركز اتصال الهلال الأحمر 168',
    last_update = CURRENT_DATE
WHERE slug = 'kizilay-card-application' AND details NOT LIKE '%الاستحقاق أوسع%';

DO $archive$
BEGIN
    UPDATE articles SET status = 'archived', last_update = CURRENT_DATE
     WHERE slug IN ('red-crescent-card', 'kizilay-card-problems', 'kizilay-card-apply') AND status = 'approved';
    RAISE NOTICE 'archived % stub(s)', (SELECT count(*) FROM articles WHERE slug IN ('red-crescent-card', 'kizilay-card-problems', 'kizilay-card-apply') AND status = 'archived');
EXCEPTION WHEN others THEN
    RAISE NOTICE 'archive skipped (%) — the 301 redirects still apply', SQLERRM;
END
$archive$;

-- ═══════════════════════════════════════════════════════════════════════════
DO $check$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM articles
     WHERE slug = 'kizilay-card-application' AND details LIKE '%İnsani İkamet%' AND details LIKE '%504.1%';
    IF n <> 1 THEN RAISE EXCEPTION 'the canonical did not take the merge'; END IF;

    SELECT count(*) INTO n FROM articles WHERE slug = 'kizilay-card-application' AND details LIKE '%بعد 6 أشهر%';
    IF n > 0 THEN RAISE EXCEPTION 'an unsourced claim reached the canonical'; END IF;
END
$check$;

SELECT 'canonical: wider eligibility + programme still running' AS البند,
       (details LIKE '%الاستحقاق أوسع%' AND details LIKE '%504.1%') AS سليم
FROM articles WHERE slug = 'kizilay-card-application'
UNION ALL
SELECT 'canonical: card-trouble table added', (details LIKE '%فُقدت أو سُرقت%')
FROM articles WHERE slug = 'kizilay-card-application'
UNION ALL
SELECT 'canonical: source cites the programme platform', (source LIKE '%kizilaykart%')
FROM articles WHERE slug = 'kizilay-card-application'
UNION ALL
SELECT 'stubs retired (0 = the DO block skipped it; 301s still apply)',
       (count(*) = 0)::boolean FROM articles WHERE slug IN ('red-crescent-card', 'kizilay-card-problems', 'kizilay-card-apply') AND status = 'approved';
