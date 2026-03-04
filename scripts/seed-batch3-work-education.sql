-- Batch 3: work (9) + education (8) = 17 articles
-- Source: consultant-scenarios.ts
-- Run in Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════════
-- WORK — العمل والاستثمار (9)
-- ═══════════════════════════════════════════════════════════════

-- 1. إذن العمل كموظف (work-permit-employee)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'work-permit-employee') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'work-permit-employee-2026',
  'work-permit-employee',
  'إذن العمل كموظف — الشروط والإجراءات',
  'العمل والاستثمار',
  'إذن العمل يُقدَّم من صاحب العمل عبر بوابة e-İzin الرسمية. الحد الأدنى للأجور 2026 = 33,030 TL إجمالي.',
  '<p>الرسوم: كملك 5,641.90 TL | أجنبي عادي 13,538.90 TL. غرامة توظيف أجنبي بلا إذن: 150,400 TL + ترحيل. تسجيل SGK إلزامي قبل يوم العمل الأول (قانون 5510 م.8).</p><p>شرط الراتب الأدنى: مهندسون 4× = 132,120 TL، أخصائيون 3× = 99,090 TL، مديرون عليا 5-6.5×.</p>',
  ARRAY['صاحب العمل يقدّم الطلب عبر e-İzin (calismaizni.gov.tr).', 'الموافقة على الطلب عبر e-Devlet الخاص بالموظف.', 'شرط الراتب: مهندسون 4× الحد الأدنى، أخصائيون 3×، مديرون 5-6.5×.', 'تسجيل الموظف في SGK قبل يوم العمل الأول.', 'دفع الرسوم واستلام البطاقة.'],
  ARRAY['الكملك أو جواز السفر مع إقامة', 'صورة بيومترية', 'عقد العمل', 'الرقم الضريبي', 'شهادات الخبرة أو المؤهلات'],
  ARRAY['تحقق دورياً من أن صاحب العمل يدفع SGK عبر e-Devlet.', 'احذر من عروض "إذن عمل رخيص جداً" — قد تكون وهمية.'],
  ARRAY['work-permit'],
  'راتب أقل من الحد الأدنى المطلوب = رفض فوري. غرامة العمل بدون إذن: 150,400 TL لكل أجنبي.',
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

-- 2. إذن العمل عبر الشركة (work-permit-company)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'work-permit-via-company') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'work-permit-via-company-2026',
  'work-permit-via-company',
  'إذن العمل عبر شركتك الخاصة',
  'العمل والاستثمار',
  'استخراج إذن عمل للمؤسس الأجنبي عبر شركته. الشرط: 5 موظفين أتراك لكل أجنبي (قانون 4817 م.5).',
  '<p>الرسوم: كملك 5,641.90 TL | أجنبي عادي 13,538.90 TL. رأس مال الشركة الأدنى = 100,000 TL. بديل لشرط الـ5 أتراك: مبيعات ≥ 50M TL أو صادرات ≥ 250K USD.</p>',
  ARRAY['تأسيس الشركة وتسجيلها رسمياً (رأس مال أدنى 100,000 TL).', 'توظيف 5 أتراك مسجلين في SGK (في آخر 6 أشهر من السنة الأولى).', 'تقديم الطلب عبر e-İzin (calismaizni.gov.tr).', 'الموافقة عبر e-Devlet ودفع الرسوم.', 'كود NACE يجب أن يتوافق مع النشاط ومتطلبات إذن العمل.'],
  ARRAY['سجل تجاري ساري', 'ميزان مالي للشركة', 'كشف SGK يُثبت توظيف 5 أتراك', 'جواز سفر أو إقامة/كملك', 'عقد عمل المؤسس مع الشركة'],
  ARRAY['تأكد أن الموظفين مسجلون فعلياً في SGK وليس صورياً.', 'ابدأ التوظيف قبل تقديم الطلب بشهر على الأقل.'],
  ARRAY['work-permit'],
  'توظيف أجنبي بلا إذن عمل = غرامة 150,400 TL + ترحيل.',
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

-- 3. تكلفة إذن العمل (work-permit-cost)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'work-permit-cost-2026') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'work-permit-cost-2026-art',
  'work-permit-cost-2026',
  'جدول رسوم إذن العمل 2026',
  'العمل والاستثمار',
  'الرسوم الرسمية لإذن العمل في تركيا لعام 2026 حسب المدة ونوع الحامل.',
  '<p>المصدر: الجريدة الرسمية رقم 32768. الرسوم سارية من 01/01/2026. بوابة e-İzin هي القناة الرسمية الوحيدة.</p>',
  ARRAY['حاملو الكملك: 4,677.90 TL (هرج) + 964 TL (بطاقة) = 5,641.90 TL.', 'أجانب عاديون — سنة: 12,574.90 + 964 = 13,538.90 TL.', 'سنتان: 25,149.80 + 964 = 26,113.80 TL.', '3 سنوات: 37,724.70 + 964 = 38,688.70 TL.', 'غير محدد المدة: 125,802.20 + 964 = 126,766.20 TL.', 'الرسوم يتحملها صاحب العمل عادةً — تُدفع في البنك أو PTT.'],
  ARRAY['طلب إذن العمل المقبول عبر e-İzin', 'إيصال دفع الرسوم'],
  ARRAY['الفرق بين رسوم الكملك والأجنبي العادي كبير — تأكد من نوع الطلب الصحيح.', 'إذن العمل غير المحدد يتطلب 8 سنوات عمل قانوني متواصل.'],
  ARRAY['work-permit'],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

-- 4. التأمينات الاجتماعية SGK (work-sgk)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'sgk-social-security') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'sgk-social-security-2026',
  'sgk-social-security',
  'التأمينات الاجتماعية SGK والتأمين الصحي',
  'العمل والاستثمار',
  'SGK هي الجهة المسؤولة عن التأمينات والتأمين الصحي في تركيا. التسجيل إلزامي لكل عامل قبل يوم العمل الأول.',
  '<p>اشتراكات SGK ≈ 37.5% من الراتب الإجمالي. GSS لغير العاملين: مجاني إذا ثبت العجز المالي (اختبار الدخل)، وإلا ≈ 7,000+ TL شهرياً. قانون 5510 م.8: التسجيل إلزامي قبل يوم العمل الأول.</p>',
  ARRAY['صاحب العمل يسجّل الموظف قبل يوم العمل الأول.', 'SGK يشمل: تأمين صحي (GSS) + تقاعد + إصابات عمل + بطالة.', 'اشتراكات ≈ 37.5% من الراتب — يتقاسمها صاحب العمل والموظف.', 'GSS لغير العاملين: أجرِ اختبار الدخل (Gelir Testi) للحصول على تأمين مجاني.', 'تحقق من تسجيلك عبر e-Devlet: "SGK Tescil Kaydı Sorgulama".'],
  ARRAY['رقم الهوية أو الكملك', 'عقد عمل', 'إذن عمل ساري (للأجانب)'],
  ARRAY['أجرِ اختبار الدخل في أقرب مكتب SGK لتجنب أقساط GSS الباهظة.', 'تحقق دورياً من سجل SGK — بعض أصحاب العمل يتحايلون بعدم الدفع.'],
  ARRAY['insurance'],
  'عدم تسجيل الموظف في SGK قبل يوم العمل الأول = مخالفة فورية وغرامات على صاحب العمل.',
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

-- 5. الرقم الضريبي (daily-tax-number)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'tax-number-how-to') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'tax-number-how-to-2026',
  'tax-number-how-to',
  'الرقم الضريبي — كيف تحصل عليه',
  'العمل والاستثمار',
  'الرقم الضريبي إلزامي لأي معاملة مالية أو رسمية: فتح حساب بنكي، شراء عقار، تأسيس شركة. يُستخرج فوراً ومجاناً.',
  '<p>نوعان: رقم مؤقت (99x) ورقم دائم مرتبط بالـ TC. الرقم الضريبي الشخصي مختلف عن رقم الشركة. قانون VUK رقم 213.</p>',
  ARRAY['توجه لأقرب دائرة ضرائب (Vergi Dairesi) مع جواز السفر أو الكملك — يصدر فوراً ومجاناً.', 'الرقم الأول يبدأ بـ 99x وهو مؤقت (Potansiyel).', 'بعد استخراج إقامة أو رقم TC، يتحوّل تلقائياً إلى رقم دائم.', 'الرقم الشخصي ≠ رقم الشركة — عند تأسيس شركة تحصل على رقم مختلف.', 'استعلم عبر e-Devlet: "Vergi Kimlik Numarası Sorgulama".'],
  ARRAY['جواز سفر أو كملك', 'لا يحتاج مستندات إضافية'],
  ARRAY['احتفظ برقمك الضريبي في مكان آمن — ستحتاجه في كل معاملة.', 'الرقم المؤقت كافٍ لفتح حساب بنكي.', 'لا تخلط بين رقمك الشخصي ورقم شركتك.'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

-- 6. تأسيس شركة في تركيا (company-setup)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'company-setup-turkey') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'company-setup-turkey-2026',
  'company-setup-turkey',
  'تأسيس شركة LTD في تركيا',
  'العمل والاستثمار',
  'خطوات تأسيس شركة ذات مسؤولية محدودة (Limited Şirketi). رأس المال الأدنى 100,000 TL (2026). الأجنبي يحتاج محامياً في بعض المراحل.',
  '<p>التكلفة التقريبية (بدون رأس المال): 20,000-40,000 TL. ضريبة الشركات 25% سنوياً. e-Fatura إلزامية إذا تجاوزت المبيعات 3M TL. القانون التجاري TTK رقم 6102 م.580.</p>',
  ARRAY['اختيار اسم الشركة والتحقق عبر MERSIS (mersis.gtb.gov.tr).', 'تحديد كود النشاط (NACE) بعناية — الكود الخاطئ يُلغي إمكانية ربط إذن عمل.', 'تأمين عنوان تجاري رسمي (مكتب أو Sanal Ofis).', 'إيداع 25% من رأس المال (100,000 TL) قبل التسجيل والباقي خلال 24 شهراً.', 'توقيع عقد التأسيس أمام النوتير أو عبر MERSIS.', 'تسجيل الشركة في السجل التجاري والغرفة التجارية.', 'فتح الملف الضريبي وتعيين محاسب قانوني معتمد.'],
  ARRAY['جواز سفر أو إقامة/كملك', 'الرقم الضريبي', 'عقد إيجار المكتب أو Sanal Ofis', 'عقد تأسيس الشركة', 'توكيل محامٍ (للأجانب)', 'إيصال إيداع رأس المال'],
  ARRAY['اختر كود NACE بعناية — الكود الخاطئ يمنعك من إذن العمل.', 'تأكد أن Sanal Ofis مقبول في ولايتك قبل التعاقد.', 'حاملو الكملك قد يواجهون قيوداً في بعض القطاعات أو الولايات.'],
  ARRAY['company'],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

-- 7. الالتزامات الشهرية للشركات (company-monthly-obligations)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'company-monthly-costs') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'company-monthly-costs-2026',
  'company-monthly-costs',
  'الالتزامات الشهرية للشركات في تركيا',
  'العمل والاستثمار',
  'الالتزامات المالية الدورية لشركة LTD نشطة. التأخير في أي منها = غرامات + فوائد فورية.',
  '<p>المحاسب: 3,000-8,000 TL/شهر. Bağ-Kur للمؤسس: 12,000-14,000 TL/شهر. KDV: 20%. ضريبة الشركات: 25% سنوياً. المجموع الشهري الأدنى (بدون موظفين): ~20,000-30,000 TL.</p>',
  ARRAY['دفع أجرة المحاسب القانوني (Mali Müşavir) شهرياً: 3,000-8,000 TL.', 'تقديم إقرار KDV + Muhtasar شهرياً — الموعد: الـ 26 من الشهر التالي. KDV = 20%.', 'دفع أقساط SGK للموظفين + Bağ-Kur للمؤسس: 12,000-14,000 TL/شهر.', 'ضريبة الشركات: 25% سنوياً تُدفع كأقساط ربع سنوية.', 'تنبيه: تحويل أرباح لحساب خارجي يتطلب إجراءات MASAK.'],
  ARRAY['عقد مع محاسب قانوني معتمد', 'سجلات الفواتير', 'كشوف رواتب الموظفين', 'تسجيل SGK'],
  ARRAY['لا تترك الشركة بلا محاسب — الغرامات تتراكم شهرياً.', 'فعّل e-Fatura مبكراً إذا توقعت مبيعات عالية.'],
  ARRAY['company'],
  'التأخير في تقديم الإقرارات الشهرية = غرامة + فائدة فورية. الشركة المُهملة تتراكم عليها آلاف الليرات شهرياً.',
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

-- 8. إغلاق شركة في تركيا (company-closure)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'company-closure-process') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'company-closure-process-2026',
  'company-closure-process',
  'إغلاق شركة في تركيا',
  'العمل والاستثمار',
  'إغلاق شركة LTD يتطلب مرحلتين: إيقاف النشاط الضريبي + الشطب من السجل التجاري. الاكتفاء بالأولى فقط لا يُعفيك من الالتزامات.',
  '<p>التكلفة: محاسب 5,000-15,000 TL + سجل تجاري 1,000-3,000 TL + محامٍ 5,000-15,000 TL. المدة: 3-12 شهراً. القانون التجاري TTK المواد 529-548.</p>',
  ARRAY['المرحلة الأولى: إيقاف النشاط الضريبي (Vergiden Silinme) — تقديم طلب لدائرة الضرائب.', 'المرحلة الثانية: التصفية (Tasfiye) — تعيين مصفٍّ وتصفية الأصول والديون.', 'المرحلة الثالثة: الشطب من السجل التجاري (Ticaret Sicil Kaydı Silme).', 'الاكتفاء بالمرحلة 1 بدون المرحلة 3 = الشركة تبقى مسجلة والالتزامات سارية.', 'الشركة المُهملة تتراكم عليها غرامات KDV وضرائب بآلاف الليرات.'],
  ARRAY['قرار التصفية من الشركاء', 'بيان مالي نهائي', 'شهادة عدم وجود ديون ضريبية', 'شهادة عدم وجود ديون SGK', 'طلب الشطب من السجل التجاري'],
  ARRAY['لا تترك الشركة بدون إغلاق رسمي — الغرامات تتراكم.', 'أكمل المرحلتين (ضريبية + سجل تجاري).', 'إذا كانت الشركة نظيفة من الديون = التصفية أسرع وأرخص.'],
  ARRAY['company'],
  'الشركة المُهملة بدون إغلاق = غرامات شهرية متراكمة + استحالة فتح شركة جديدة.',
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

-- 9. الجنسية عبر الاستثمار العقاري (investor-citizen)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'citizenship-by-investment') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'citizenship-by-investment-2026',
  'citizenship-by-investment',
  'الجنسية التركية عبر الاستثمار العقاري (400,000$)',
  'العمل والاستثمار',
  'الحصول على الجنسية عبر شراء عقار بقيمة 400,000$+ مع تعهد بعدم البيع لـ 3 سنوات. المدة الفعلية: 8-18 شهراً.',
  '<p>يجب عقار واحد بقيمة 400,000$+ (لا يجوز الجمع بين عقارات منذ 01/01/2023). وثيقة DAB من البنك التركي إلزامية. تنبيه للسوريين: تقارير عن تقييد الجنسية الاستثمارية مع تحريات أمنية مشددة.</p>',
  ARRAY['اختيار العقار والتأكد من خلوه من الرهونات عبر TAKBIS.', 'استخراج تقييم عقاري رسمي من جهة مرخصة SPK (≥ 400,000$).', 'الحصول على وثيقة DAB من البنك التركي (إلزامية).', 'نقل الملكية مع تسجيل تعهد عدم البيع لـ 3 سنوات.', 'التقدم بطلب الجنسية لدى مديرية النفوس.', 'اجتياز التحريات الأمنية (قد تستغرق أشهراً إضافية).'],
  ARRAY['جواز سفر ساري (مترجم ومصدق)', 'سند الملكية (الطابو)', 'تقييم عقاري رسمي SPK', 'وثيقة DAB من البنك', 'شهادة عدم محكومية', 'صور بيومترية'],
  ARRAY['لا تبِع العقار قبل صدور قرار الجنسية النهائي.', 'لا يوجد تسريع رسمي — احذر من السماسرة.', 'تابع عبر CİMER كل 2-3 أشهر.'],
  ARRAY['citizenship'],
  'بدون وثيقة DAB يُرفض الملف. عقار واحد فقط بقيمة 400,000$+ (لا يجوز الجمع).',
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- EDUCATION — الدراسة والتعليم (8)
-- ═══════════════════════════════════════════════════════════════

-- 10. معادلة الشهادة الجامعية (student-denklik)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'university-denklik') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'university-denklik-2026',
  'university-denklik',
  'معادلة الشهادة الجامعية (YÖK Denklik)',
  'الدراسة والتعليم',
  'معادلة الشهادة الجامعية تتم عبر YÖK — وليس MEB. الخلط بين الجهتين سبب شائع للرفض.',
  '<p>التكلفة: 3,000-8,000 TL (ترجمة + نوتر + رسوم YÖK). بعض الشهادات تحتاج امتحان تقييم إضافي. المعادلة ليست مضمونة — جامعات غير معترف بها قد تُرفض.</p>',
  ARRAY['ادخل denklik.yok.gov.tr وأنشئ حساباً.', 'ارفع المستندات إلكترونياً.', 'الشهادات الجامعية = YÖK. شهادة الثانوية = MEB.', 'ادفع الرسوم الإدارية + الترجمة والنوتر.', 'انتظر التقييم — قد يُطلب امتحان إضافي.', 'عند القبول: تصدر وثيقة المعادلة الرسمية.'],
  ARRAY['الشهادة الجامعية مصدقة ومترجمة (ترجمة محلفة + نوتر)', 'كشف الدرجات مصدق ومترجم', 'جواز السفر أو وثيقة الهوية', 'صور شخصية', 'وصل دفع الرسوم'],
  ARRAY['جهّز كل الأوراق مترجمة ومصدقة قبل التقديم — النواقص تؤخر أشهراً.', 'خريجو دول عربية: صدّقوا الشهادة من وزارة الخارجية + السفارة التركية.'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

-- 11. معادلة شهادة الثانوية (student-highschool-denklik)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'highschool-denklik') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'highschool-denklik-2026',
  'highschool-denklik',
  'معادلة شهادة الثانوية (MEB Denklik)',
  'الدراسة والتعليم',
  'معادلة شهادة الثانوية تتم عبر MEB. منذ يوليو 2024 أصبح نظام e-Denklik الإلكتروني هو القناة الرسمية.',
  '<p>التكلفة: 3,000-6,000 TL (ترجمة + نوتر + رسوم MEB). المدة: أسبوعين - شهرين. اللائحة المحدّثة (9/7/2024) ألزمت بالتقديم الإلكتروني.</p>',
  ARRAY['ادخل نظام e-Denklik الإلكتروني (إلزامي منذ يوليو 2024).', 'أنشئ حساباً وارفع المستندات إلكترونياً.', 'شهادة الثانوية = MEB. لا تقدمها لـ YÖK.', 'قد يُطلب إحضار أصول المستندات لأقرب مديرية تربية.', 'عند القبول: تصدر وثيقة المعادلة (Denklik Belgesi).'],
  ARRAY['شهادة الثانوية مصدقة ومترجمة (ترجمة محلفة + نوتر)', 'كشف درجات الثانوية مصدق ومترجم', 'جواز السفر أو وثيقة الهوية', 'صور شخصية'],
  ARRAY['احصل على المعادلة قبل التسجيل في امتحان اليوس.', 'سوريون بدون شهادة أصلية: راجعوا UNICEF أو منظمات التعليم.'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

-- 12. كشف الدرجات (student-transcript)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'transcript-translation') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'transcript-translation-2026',
  'transcript-translation',
  'كشف الدرجات — استخراجه وترجمته',
  'الدراسة والتعليم',
  'يمكنك استخراج كشف الدرجات الجامعية عبر e-Devlet لبعض الجامعات. ليس كل الجامعات تتيح ذلك للأجانب.',
  '<p>مجاني عبر e-Devlet. من الجامعة مباشرة: 50-200 TL. الأجانب يستخدمون رقم YU (ليس TC).</p>',
  ARRAY['ادخل e-Devlet (turkiye.gov.tr) — الأجانب يستخدمون رقم YU.', 'ابحث عن "Transkript Belgesi" أو "Not Durum Belgesi".', 'إذا لم تجدها: توجه لشؤون الطلاب (Öğrenci İşleri) في جامعتك.', 'اطبع الوثيقة أو احفظها كـ PDF — تحمل ختماً إلكترونياً رسمياً.'],
  ARRAY['رقم YU مُفعّل في e-Devlet', 'كلمة مرور e-Devlet'],
  ARRAY['لمعاملة Denklik: قد تحتاج النسخة المختومة من الجامعة مباشرة.', 'رقم YU ≠ TC — لا تخلط بينهما.'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

-- 13. امتحان YÖS (student-yos)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'yos-exam-guide') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'yos-exam-guide-2026',
  'yos-exam-guide',
  'امتحان YÖS للقبول الجامعي',
  'الدراسة والتعليم',
  'TR-YÖS هو الامتحان الموحد للطلاب الأجانب. يُنظم من ÖSYM مرتين سنوياً. ليس كل الجامعات تقبله.',
  '<p>الرسوم: 1,958 TL (2026). مواعيد 2026: TR-YÖS/1 = 12 أبريل | TR-YÖS/2 = 11 أكتوبر. الامتحان: 60 رياضيات + 40 تفكير منطقي = 100 سؤال. النتائج صالحة لسنة.</p>',
  ARRAY['سجّل في ais.osym.gov.tr وادفع الرسوم (1,958 TL).', 'مواعيد 2026: TR-YÖS/1 = 12 أبريل | TR-YÖS/2 = 11 أكتوبر.', 'الامتحان: 60 رياضيات + 40 تفكير منطقي. لا توجد مادة لغة.', 'بعد النتيجة: قدّم على الجامعات التي تقبل TR-YÖS.', 'كثير من الجامعات الكبرى لديها YÖS خاص — تحقق من كل جامعة.'],
  ARRAY['جواز سفر أو وثيقة هوية', 'صورة بيومترية', 'إيصال دفع الرسوم', 'معادلة الثانوية (تشترطها بعض الجامعات)'],
  ARRAY['ركّز على الرياضيات — تشكل 60% من الامتحان.', 'ابدأ التحضير قبل 3-4 أشهر.', 'ليس كل الجامعات تقبل TR-YÖS الموحد.'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

-- 14. دورات TÖMER (student-tomer)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'tomer-turkish-courses') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'tomer-turkish-courses-2026',
  'tomer-turkish-courses',
  'دورات TÖMER لتعلم التركية',
  'الدراسة والتعليم',
  'TÖMER أشهر مركز لتعليم التركية للأجانب. ليس المركز الوحيد المعترف به — الجامعة هي من تحدد أي شهادة تقبلها.',
  '<p>رسوم الامتحان ≈ 2,000 TL. الدورات الكاملة: 10,000-30,000 TL. إقامة تومر = إقامة قصيرة (YUKK م.31) بحد أقصى سنتين فقط.</p>',
  ARRAY['حدد جامعتك أولاً وتحقق من شرط مستوى اللغة.', 'اختر مركز اللغة: TÖMER، Dilmer، Anadolu TÖMER، أو مراكز جامعتك.', 'المستويات A1-C1 تستغرق 9-12 شهراً.', 'اجتز امتحان اللغة واحصل على الشهادة.', 'إقامة تومر ≠ إقامة طالب — حدها سنتان فقط.'],
  ARRAY['جواز سفر ساري', 'صور شخصية', 'إيصال دفع رسوم الدورة'],
  ARRAY['تأكد أن جامعتك تقبل شهادة تومر قبل الدفع.', 'قارن الأسعار بين المراكز — الفرق قد يكون كبيراً.'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

-- 15. حقوق العمل للطلاب (student-work-rights)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'student-work-rights') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'student-work-rights-2026',
  'student-work-rights',
  'حقوق العمل للطلاب الأجانب',
  'الدراسة والتعليم',
  'حق العمل ليس أوتوماتيكياً — يحتاج إذن عمل رسمي. القواعد تختلف بين طلاب الليسانس وطلاب الدراسات العليا.',
  '<p>الرسوم: كملك 5,641.90 TL | أجنبي عادي 13,538.90 TL. العمل بدون إذن = مخالفة + إلغاء إقامة + ترحيل محتمل. قانون 4857 + YUKK م.41.</p>',
  ARRAY['طلاب الليسانس: يجب إتمام السنة الأولى قبل التقدم لإذن عمل.', 'طلاب الماجستير والدكتوراه: مستثنون — يمكنهم العمل بدوام كامل بإذن.', 'قدّم طلب إذن عمل عبر وزارة العمل.', 'العمل بدون إذن = مخالفة قد تؤدي لإلغاء الإقامة.', 'ابحث عن فرص عمل داخل الجامعة — أسهل في الحصول على إذن.'],
  ARRAY['وثيقة طالب سارية', 'جواز سفر وإقامة', 'عرض عمل', 'طلب إذن عمل'],
  ARRAY['إذا كنت تحتاج دخلاً: ابحث عن عمل جزئي داخل الجامعة.', 'منحة Türkiye Bursları تشمل مبلغاً شهرياً.'],
  ARRAY['work-permit'],
  'العمل بدون إذن رسمي = مخالفة قانونية + إمكانية إلغاء الإقامة والترحيل.',
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

-- 16. منح تركيا الحكومية (student-turkiye-burslari)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'turkiye-burslari-guide') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'turkiye-burslari-guide-2026',
  'turkiye-burslari-guide',
  'منح تركيا الحكومية (Türkiye Bursları)',
  'الدراسة والتعليم',
  'منح حكومية تغطي: رسوم دراسية + سكن + مبلغ شهري + تأمين صحي + تذكرة طيران + دورة لغة تركية مجانية.',
  '<p>مجانية بالكامل. المبالغ الشهرية 2025-2026: ليسانس 4,500 TL | ماجستير 6,500 TL | دكتوراه 9,000 TL. منحة التفوق: ضعف المبلغ. التقديم يفتح سنوياً في يناير/فبراير.</p>',
  ARRAY['ادخل turkiyeburslari.gov.tr وأنشئ حساباً.', 'التقديم سنوياً — يفتح يناير/فبراير ويُغلق مارس.', 'ارفع: شهادات + كشف درجات + رسالة دافع + توصيات.', 'في حال القبول المبدئي: مقابلة (قد تكون أونلاين).', 'المنحة تشمل: رسوم كاملة + سكن + مبلغ شهري + تأمين + تذكرة + سنة لغة.'],
  ARRAY['شهادة الثانوية أو الجامعية', 'كشف الدرجات', 'جواز سفر أو وثيقة هوية', 'صور شخصية', 'رسالة دافع (Motivation Letter)', 'رسائل توصية (اختيارية)'],
  ARRAY['المنافسة شديدة — ركّز على رسالة الدافع.', 'التقديم مبكراً أفضل.', 'تميّز بمشروعك ونشاطاتك.'],
  ARRAY['scholarships'],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

-- 17. معادلة الشهادات للسوريين (syrian-denklik)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'syrian-denklik-schools') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'syrian-denklik-schools-2026',
  'syrian-denklik-schools',
  'معادلة الشهادات للسوريين تحت الحماية المؤقتة',
  'الدراسة والتعليم',
  'السوريون يمكنهم معادلة شهاداتهم حتى بدون وثائق أصلية في بعض الحالات — هناك إجراءات خاصة بهم.',
  '<p>التكلفة: 3,000-6,000 TL (بعض المنظمات تغطيها). السوريون تحت الحماية يحق لهم المعادلة بموجب لوائح MEB و YÖK الخاصة باللاجئين.</p>',
  ARRAY['معادلة الثانوية: قدّم عبر e-Denklik التابع لـ MEB.', 'معادلة الجامعية: قدّم عبر denklik.yok.gov.tr التابع لـ YÖK.', 'بدون شهادة أصلية: راجع UNICEF أو منظمات التعليم (SPARK، Jusoor).', 'بعض الحالات تحتاج امتحان تقييم مستوى بدلاً من الشهادة.', 'بعد المعادلة: قدّم على الجامعات أو استخدمها في سوق العمل.'],
  ARRAY['الكملك أو وثيقة الحماية المؤقتة', 'الشهادة الأصلية إن وجدت (مترجمة ومصدقة)', 'أي وثيقة تعليمية بديلة', 'صور شخصية'],
  ARRAY['إذا فقدت شهادتك بسبب الحرب: لا تيأس — هناك مسارات بديلة.', 'راجع UNICEF أو Jusoor للمساعدة.'],
  ARRAY['schools'],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;
