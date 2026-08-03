-- تكملة إصلاح المقتطفات — ثمانية أوصاف فوق حدّ الموقع (155 حرفاً)
-- ===========================================================================
-- الدفعة الأولى استهدفت ما يتجاوز 160 حرفاً، وحدّ الموقع الفعلي 155
-- (src/app/article/[id]/page.tsx:434) — فبقيت ثمانية أوصاف تُقطع بـ«…».
-- منها واحد من الدفعة السابقة (detention-center-rights)، واثنان كان وصفهما
-- نصّاً خاماً غير مصوغ منسوخاً من المتن.
-- كل وصف هنا مكتوب من نصّ مقاله نفسه، وفُحص آلياً: صفر رقم بلا مصدر.
-- شغّله في Supabase → SQL Editor.

UPDATE articles SET seo_description = 'شروط تحويل الكملك إلى إقامة عبر e-ikamet: ختم دخول رسمي قبل 2016، وجواز ساري، وتطابق العنوان، والتأمين. والتطبيق يختلف من ولاية إلى أخرى' WHERE slug = 'kimlik-to-residence';
UPDATE articles SET seo_description = 'الإجازة إلى سوريا لحامل الكملك متوقّفة إلا في حالة واحدة: التسجيل والعمل مع منظمة حكومية رسمية وتقديم طلب عمل في سوريا، وضمن قيود محدّدة' WHERE slug = 'syria-travel-permits-kimlik-holders-2026';
UPDATE articles SET seo_description = 'توقيع العودة الطوعية يُلغي قيد الحماية المؤقتة ويُغلق ملفك، فلا تعود بالكملك نفسه. والفيزا السياحية متوقّفة من سوريا، وبقية الفيز لا تمنح إقامة' WHERE slug = 'article-عندي-كملك-حماية-مؤقتة-و-نزلت-عودة-طوعبة-إلى-سوريا-و-أرغب-بالعودة-إلى-تركيا';
UPDATE articles SET seo_description = 'قائمة تدقيق قبل دفع عربون أو توقيع عقد: من يحقّ له الشراء، الرقم الضريبي، تجنّب الاحتيال، والفرق بين الإقامة العقارية والجنسية عبر الاستثمار' WHERE slug = 'real-estate-general-faq';
UPDATE articles SET seo_description = 'تكلفة المعيشة في تركيا 2026: أرقام محدّثة للإيجار والطعام والفواتير والمواصلات والإنترنت من مصادر رسمية، وميزانية شهرية لأعزب ولعائلة من أربعة' WHERE slug = 'cost-of-living-turkey-2026';
UPDATE articles SET seo_description = 'قراران بمهلتين: الاعتراض على الاحتجاز بلا مهلة أمام قاضي الصلح الجزائي، والطعن على الترحيل خلال سبعة أيام. المدّة والمراجعة الشهرية وحقوقك داخله' WHERE slug = 'detention-center-rights';
UPDATE articles SET seo_description = 'حزمة عقوبات مرورية جديدة في تركيا للحدّ من الفوضى وتعزيز السلامة: غرامات تصل إلى 280 ألف ليرة، وسحب الرخصة، وحجز المركبة' WHERE slug = 'traffic-penalties-turkey-2026';
UPDATE articles SET seo_description = 'الدليل الرسمي من UCSO: 7 أنواع تأشيرات تركيا للسوريين 2026 بالرسوم $125-$165 والوثائق لكل نوع، وVisa FG الجهة المعتمدة الوحيدة في سوريا' WHERE slug = 'syria-turkey-visa-types-2026';

-- التحقّق: يجب أن يرجع صفراً
SELECT count(*) AS descs_over_site_limit
FROM articles
WHERE status = 'approved' AND active IS NOT FALSE AND length(seo_description) > 155;
