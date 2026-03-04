-- ============================================
-- Batch 4: الصحة والتأمين (4) + معاملات رسمية أولى (10)
-- Total: 14 articles
-- ============================================

-- =============================================
-- الصحة والتأمين — 4 مقالات
-- =============================================

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'mhrs-medical-appointment') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'mhrs-medical-appointment-2026',
  'mhrs-medical-appointment',
  'حجز موعد طبي عبر MHRS',
  'الصحة والتأمين',
  'MHRS هو نظام حجز المواعيد المركزي للمشافي الحكومية في تركيا. يشترط تأميناً صحياً سارياً (SGK أو خاص معتمد).',
  '<p>يمكنك حجز موعد عبر تطبيق MHRS أو موقع mhrs.gov.tr أو الاتصال على 182. المشافي الحكومية مع SGK/GSS تكلفة المشاركة رمزية (10-30 TL). بدون تأمين لن يظهر لك أي موعد متاح.</p><p>حاملو الكملك بعد 2026: أُوقف التأمين المجاني — يجب الحصول على SGK عبر العمل أو إجراء اختبار الدخل (Gelir Testi) للإعفاء من GSS.</p>',
  ARRAY['تأكد من وجود تأمين صحي ساري (SGK أو GSS أو خاص معتمد)', 'حمّل تطبيق MHRS أو ادخل على mhrs.gov.tr أو اتصل على ALO 182', 'سجّل الدخول برقم TC + كلمة مرور E-Devlet', 'اختر: التخصص → المدينة → المشفى → الطبيب → الموعد المتاح', 'ستحصل على رسالة تأكيد SMS — اذهب في الموعد قبل 15 دقيقة'],
  ARRAY['بطاقة الإقامة أو الكملك', 'بطاقة التأمين الصحي (إن وجدت)'],
  ARRAY['مواعيد التخصصات المطلوبة (عيون، جلدية) تنفد بسرعة — احجز صباحاً الساعة 08:00 عند فتح المواعيد الجديدة', 'بدون تأمين صحي ساري لن يظهر لك أي موعد في النظام'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'family-doctor-register') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'family-doctor-register-2026',
  'family-doctor-register',
  'اختيار طبيب العائلة في تركيا',
  'الصحة والتأمين',
  'نظام طبيب العائلة (Aile Hekimliği) يوفر رعاية صحية أولية مجانية لكل من يحمل تأمين SGK أو GSS ساري.',
  '<p>التسجيل متاح لدى أقرب مركز صحة العائلة (ASM — Aile Sağlığı Merkezi). الخدمات تشمل: كشف عام، تطعيمات، متابعة أمراض مزمنة، إحالات للتخصصات.</p><p>حاملو الإقامة السياحية بتأمين خاص فقط: غير مؤهلين لنظام طبيب العائلة الحكومي. حاملو الكملك بعد 2026: يحتاجون SGK عبر العمل أو اختبار الدخل (Gelir Testi) عبر SYDV للإعفاء من GSS.</p>',
  ARRAY['تحقق من أهليتك: يجب أن يكون لديك SGK عبر العمل أو GSS', 'ابحث عن ASM (مركز صحة العائلة) الأقرب لعنوانك المسجل', 'اذهب شخصياً للمركز مع بطاقتك (إقامة أو كملك)', 'سيتم تسجيلك لدى طبيب العائلة المتاح في منطقتك', 'بعد التسجيل يمكنك زيارة طبيبك عادةً بدون موعد MHRS'],
  ARRAY['بطاقة الإقامة أو الكملك', 'إثبات التأمين الصحي (SGK أو GSS)'],
  ARRAY['طبيب العائلة يعطيك إحالة (Sevk) للمشفى مجاناً — أوفر من الذهاب مباشرة', 'ابدأ دائماً من طبيب العائلة ثم المشفى'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'family-doctor-change') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'family-doctor-change-2026',
  'family-doctor-change',
  'تغيير طبيب العائلة',
  'الصحة والتأمين',
  'يحق لك تغيير طبيب العائلة. العملية بسيطة وتتم إلكترونياً أو شخصياً.',
  '<p>يمكنك التغيير عبر E-Devlet → Aile Hekimi Değiştirme أو بزيارة مركز ASM الجديد شخصياً. ملفك الصحي يُنقل تلقائياً. لا قيد قانوني على عدد مرات التغيير لكن بعض الولايات تضع حداً عملياً (مرة كل 3-6 أشهر).</p>',
  ARRAY['ادخل على E-Devlet → Aile Hekimi Sorgulama لمعرفة طبيبك الحالي', 'للتغيير إلكترونياً: E-Devlet → Aile Hekimi Değiştirme', 'للتغيير شخصياً: اذهب إلى ASM الجديد واطلب النقل', 'سيُنقل ملفك الصحي تلقائياً للطبيب الجديد'],
  ARRAY['بطاقة الإقامة أو الكملك'],
  ARRAY['إذا انتقلت لحي جديد، غيّر طبيبك لأقرب ASM لتوفير الوقت'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'enabiz-health-records') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'enabiz-health-records-2026',
  'enabiz-health-records',
  'تطبيق e-Nabız — سجلك الصحي الإلكتروني',
  'الصحة والتأمين',
  'e-Nabız هو نظام الملف الصحي الإلكتروني في تركيا. يُخزّن كل سجلاتك الطبية ويمكنك الوصول إليه عبر التطبيق أو e-Devlet.',
  '<p>يحفظ النظام: زيارات طبية، تحاليل، أشعة، أدوية مصروفة، تطعيمات. مفيد جداً عند زيارة طبيب جديد — يرى سجلك كاملاً بدون إعادة التحاليل. البيانات محمية بقانون KVKK ويحق لك التحكم بمن يصل لملفك.</p>',
  ARRAY['حمّل تطبيق e-Nabız أو ادخل عبر e-Devlet → "e-Nabız" (enabiz.gov.tr)', 'سجّل الدخول بنفس بيانات e-Devlet', 'اطلع على: تاريخ الزيارات، نتائج التحاليل والأشعة، الأدوية، التطعيمات', 'حدد الأطباء المسموح لهم بالوصول لملفك عبر إعدادات الخصوصية'],
  ARRAY['حساب e-Devlet مفعّل'],
  ARRAY['تحقق من ملفك دورياً — أحياناً تُسجَّل زيارات أو أدوية خاطئة', 'إذا وجدت خطأ قدّم اعتراضاً عبر التطبيق'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

-- =============================================
-- معاملات رسمية — 10 مقالات (الجزء الأول)
-- =============================================

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'goc-idaresi-appointment') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'goc-idaresi-appointment-2026',
  'goc-idaresi-appointment',
  'حجز موعد في مديرية الهجرة',
  'معاملات رسمية',
  'هناك فرق جوهري بين نظام e-İkamet (طلبات الإقامة) ونظام Randevu (مواعيد عامة). استخدام النظام الخطأ يضيع وقتك.',
  '<p><strong>e-İkamet</strong> (e-ikamet.goc.gov.tr): لتقديم طلب إقامة جديد أو تجديد — يُنشئ ملفاً كاملاً مع موعد.</p><p><strong>Randevu</strong> (randevu.goc.gov.tr أو ALO 157): لتحديث بيانات، استفسارات، تسليم مستندات ناقصة، أو مراجعة بخصوص تبليغ.</p><p>المواعيد في إسطنبول وأنقرة وإزمير قد تتأخر لأسابيع — احجز مبكراً.</p>',
  ARRAY['لطلب إقامة/تجديد: استخدم e-ikamet.goc.gov.tr', 'لمواعيد عامة: اتصل على 157 أو استخدم randevu.goc.gov.tr', 'لحجز e-İkamet: أدخل بياناتك → اختر الولاية → نوع الطلب → الموعد المتاح', 'ستحصل على رقم طلب ورمز تحقق', 'اذهب في الموعد قبل 15 دقيقة مع كافة المستندات مرتبة'],
  ARRAY['جواز السفر أو الكملك', 'رقم الطلب (لمواعيد e-İkamet)', 'المستندات المتعلقة بالمعاملة'],
  ARRAY['احجز مبكراً — المواعيد في المدن الكبرى تتأخر لأسابيع', 'لا تخلط بين النظامين — الخطأ في الاختيار يضيع موعدك'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'nvi-nufus-appointment') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'nvi-nufus-appointment-2026',
  'nvi-nufus-appointment',
  'حجز موعد النفوس (NVİ)',
  'معاملات رسمية',
  'حجز موعد في مديرية النفوس والمواطنة لتثبيت العنوان أو استخراج وثائق.',
  '<p>الحجز عبر nfrm.nvi.gov.tr أو E-Devlet → NVI Randevu. القانون يُلزم بتحديث العنوان خلال 20 يوم عمل من الانتقال — عدم التحديث يؤدي لغرامة 500-1,000 ليرة وقد يؤثر على تجديد الإقامة.</p>',
  ARRAY['ادخل على nfrm.nvi.gov.tr أو E-Devlet → NVI Randevu', 'اختر نوع المعاملة (تثبيت عنوان، تغيير عنوان، استخراج وثيقة)', 'اختر المديرية الأقرب لعنوانك وحدد الموعد المتاح', 'اذهب في الموعد مع المستندات المطلوبة', 'بديل: أجهزة Nüfusmatik في بعض البلديات لبعض المعاملات البسيطة'],
  ARRAY['بطاقة الإقامة أو الكملك', 'عقد إيجار مصدق (لتثبيت العنوان)', 'فاتورة مرفق باسمك (كهرباء/ماء/غاز)'],
  ARRAY['تحقق من عنوانك المسجل عبر E-Devlet → Yerleşim Yeri Belgesi', 'حدّث عنوانك خلال 20 يوماً من الانتقال لتجنب الغرامة'],
  ARRAY[]::text[],
  'غرامة التأخر في تحديث العنوان (أكثر من 20 يوماً): حوالي 500-1,000 ليرة.',
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'uets-notification-system') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'uets-notification-system-2026',
  'uets-notification-system',
  'نظام UETS للتبليغات القضائية',
  'معاملات رسمية',
  'UETS هو نظام التبليغات الرسمية الإلكترونية. جميع التبليغات من المحاكم وإدارة الهجرة تصل عبره.',
  '<p>التبليغ يُعتبر مُستلَماً بعد 5 أيام من إرساله حتى لو لم تقرأه (القانون 7201 م.7/a). قد يتضمن مهل طعن محددة: 7 أيام للترحيل، 15 يوماً لرفض الإقامة، 60 يوماً للطعن القضائي.</p>',
  ARRAY['ادخل على E-Devlet → UETS Tebligat Sorgulama لمعرفة إذا كان لديك تبليغات معلقة', 'التبليغ يُعتبر مُستلَماً بعد 5 أيام حتى لو لم تقرأه', 'عند استلام تبليغ: اقرأه فوراً — قد يتضمن مهلة طعن محددة', 'إذا لم يكن لديك e-Devlet: التبليغات تصل بالبريد المسجل أو شخصياً', 'حاملو الكملك يمكنهم تفعيل e-Devlet عبر PTT مع الكملك'],
  ARRAY['حساب E-Devlet مفعّل'],
  ARRAY['فعّل إشعارات E-Devlet على هاتفك لتتلقى تنبيهاً فورياً', 'تجاهل التبليغ هو السبب الأول لفقدان حق الطعن'],
  ARRAY[]::text[],
  'التبليغ الإلكتروني له نفس القوة القانونية للورقي. عدم قراءته لا يعفيك — بعد 5 أيام تُعتبر مُبلَّغاً حكمياً.',
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'cimer-complaint-guide') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'cimer-complaint-guide-2026',
  'cimer-complaint-guide',
  'تقديم شكوى عبر CİMER',
  'معاملات رسمية',
  'CİMER هو نظام الشكاوى والاقتراحات المركزي في تركيا. يمكنك تقديم شكوى ضد أي جهة حكومية.',
  '<p>الجهة الحكومية ملزمة بالرد خلال 30 يوماً وفق قانون 4982. إذا لم يُرد يمكنك التصعيد للمحكمة الإدارية. CİMER فعّال جداً خصوصاً ضد إدارات الهجرة المتأخرة.</p><p>ملاحظة: BİMER كان النظام القديم قبل 2018 — تم دمجه في CİMER بعد التحول للنظام الرئاسي.</p>',
  ARRAY['ادخل على cimer.gov.tr أو عبر E-Devlet → CİMER', 'اختر نوع الطلب: شكوى (Şikayet) أو استعلام (Bilgi Edinme)', 'حدد الجهة المعنية بشكواك', 'اكتب شكواك بالتفصيل بالتركية (أو بالعربية مع ترجمة) وأرفق المستندات', 'ستحصل على رقم متابعة — الرد خلال 30 يوماً إلزامي قانونياً'],
  ARRAY['رقم TC أو رقم الأجانب', 'وصف تفصيلي للشكوى', 'مستندات داعمة (اختياري)'],
  ARRAY['اكتب شكواك بشكل واضح ومختصر مع ذكر الأرقام والتواريخ', 'الشكاوى بالتركية تُعالج أسرع'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'uyap-court-system') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'uyap-court-system-2026',
  'uyap-court-system',
  'نظام UYAP — متابعة القضايا',
  'معاملات رسمية',
  'UYAP هو النظام الإلكتروني للقضاء التركي. يمكنك متابعة قضاياك وملفات التنفيذ (İcra) عبره.',
  '<p>تنبيه للأجانب: البحث يكون عبر رقم الهوية الأجنبية (Yabancı Kimlik No) أو رقم جواز السفر — وليس رقم TC. ملفات İcra تبقى مفتوحة حتى تسديد الدين أو سقوطه بالتقادم (10 سنوات). الديون المحكوم بها تُنفَّذ إجبارياً عبر حجز الحسابات والممتلكات.</p>',
  ARRAY['ادخل على E-Devlet → UYAP Vatandaş Portal', 'اختر: Dava Sorgulama (قضايا) أو İcra Dosya Sorgulama (ملفات تنفيذ)', 'يمكنك رؤية: حالة القضية، المواعيد، القرارات، مبالغ الديون', 'الأجانب يبحثون برقم الهوية الأجنبية وليس TC', 'يمكنك حساب دين İcra المتبقي ومعرفة إمكانية التقسيط'],
  ARRAY['حساب E-Devlet مفعّل'],
  ARRAY['تحقق دورياً حتى لو لم تكن طرفاً في قضية — أحياناً تُفتح ملفات İcra دون علمك (ديون هاتف أو تأمين)'],
  ARRAY['legal-trouble'],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'notary-services-guide') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'notary-services-guide-2026',
  'notary-services-guide',
  'خدمات الكاتب بالعدل (Noter)',
  'معاملات رسمية',
  'النوتر في تركيا يُصدّق التوقيعات والمستندات — لا يترجم بنفسه. التمييز بينه وبين المترجم المحلف مهم جداً.',
  '<p>الترجمة المحلفة تتم من مترجم حلَف اليمين أمام محكمة، ثم يُصدّق النوتر التوقيع فقط. الإرسال للنوتر مباشرة بدون مترجم محلف = رفض.</p><p>الرسوم موحدة رسمياً في كل النوترات — لا تفاوض. تصديق ترجمة صفحة واحدة ≈ 1,770 TL. مطابقة نسخة ≈ 80.68 TL/صفحة.</p>',
  ARRAY['حدد نوع المعاملة: تصديق توقيع (İmza Onayı) أو تصديق ترجمة (Tercüme Onayı) أو مطابقة نسخة (Suret Onayı)', 'للترجمة: أولاً اذهب لمترجم محلف (Yeminli Tercüman) — يترجم ويوقّع. ثم تأخذ الترجمة للنوتر ليُصدّق توقيع المترجم', 'اذهب لأقرب نوتر مع الوثيقة الأصلية + هويتك', 'الرسوم موحدة رسمياً — لا تفاوض', 'استلم الوثيقة المصدقة مع ختم النوتر ورقم التصديق'],
  ARRAY['الوثيقة الأصلية المراد تصديقها', 'الكملك أو جواز السفر أو بطاقة الإقامة', 'الترجمة المحلفة (إن كانت المعاملة ترجمة)'],
  ARRAY['لا تذهب للنوتر مباشرة بوثيقة أجنبية تحتاج ترجمة — ابحث أولاً عن مترجم محلف', 'قائمة المترجمين المحلفين متاحة عبر نقابة المحامين المحلية أو المحكمة'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'unhcr-document-renewal') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'unhcr-document-renewal-2026',
  'unhcr-document-renewal',
  'وثائق UNHCR — التجديد والاستفسار',
  'معاملات رسمية',
  'UNHCR تعمل في تركيا وتقدم خدمات الحماية للاجئين وطالبي اللجوء. حيوي لمن لا يملك وضعاً قانونياً واضحاً.',
  '<p>الفئات المستفيدة: طالبو اللجوء، لاجئون من غير السوريين (إيرانيون، أفغان، عراقيون). السوريون مسجلون تحت الحماية المؤقتة لدى الحكومة التركية مباشرة وليس UNHCR.</p><p>وثيقة UNHCR لا تُعادل الإقامة الرسمية لكنها حماية دولية من الترحيل. خدمات المفوضية مجانية تماماً.</p>',
  ARRAY['اتصل بخط UNHCR: 444 4 868 لحجز موعد تسجيل', 'الخدمات: تسجيل وتوثيق، إعادة توطين في بلد ثالث، مساعدة قانونية، دعم مالي للطوارئ', 'وثيقة UNHCR تحميك من الترحيل لكنها ليست إقامة رسمية', 'مكاتب UNHCR: أنقرة (الرئيسي) + إسطنبول وغازي عنتاب وغيرها'],
  ARRAY['جواز سفر أو أي وثيقة هوية (حتى منتهية)', 'أي وثائق تدعم طلبك (تهديدات، أدلة اضطهاد)', 'بدون وثائق: يمكن التسجيل بناء على مقابلة شخصية'],
  ARRAY['كل خدمات UNHCR مجانية — لا تدفع لأي وسيط يدّعي تسريع المعاملة'],
  ARRAY[]::text[],
  'احذر من المحتالين الذين يطلبون مالاً مقابل "تسريع" معاملة UNHCR — اتصل مباشرة على 444 4 868.',
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'sworn-translator-guide') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'sworn-translator-guide-2026',
  'sworn-translator-guide',
  'الترجمة المحلفة — متى وكيف تحتاجها',
  'معاملات رسمية',
  'المترجم المحلف (Yeminli Tercüman) هو مترجم حلَف اليمين أمام المحكمة ومخوَّل بترجمة الوثائق الرسمية.',
  '<p>المترجم المحلف ≠ أي مترجم — يجب أن يكون مُسجَّلاً رسمياً لدى المحكمة. تكلفة الترجمة المحلفة: 500-2,000 TL/صفحة + تصديق النوتر ≈ 1,770 TL. الوثائق المترجمة بدون ختم المحلف + تصديق النوتر لا قيمة قانونية لها.</p>',
  ARRAY['ابحث عن مترجم محلف: اسأل نقابة المحامين (Baro) أو المحكمة (Adliye) أو النوتر', 'تحقق من صلاحيته: اطلب رقم قيده في المحكمة (Tercüman Sicil No)', 'أعطِ المترجم الوثيقة الأصلية → يترجم ويوقّع → تأخذ الترجمة للنوتر للتصديق', 'ترجمة بدون تصديق نوتر = مرفوضة من الجهات الرسمية'],
  ARRAY['الوثيقة الأصلية المراد ترجمتها', 'نسخة عن الهوية'],
  ARRAY['لا تستخدم مكاتب الترجمة الرخيصة حول دوائر الهجرة — الغالبية غير معتمدة', 'احتفظ بالأصل دائماً ولا تسلّمه'],
  ARRAY[]::text[],
  'مكاتب "ترجمة" كثيرة حول دوائر الهجرة تقدم ترجمات غير معتمدة — رخيصة لكنها تُرفض وتُسبب تأخير ملفك.',
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'divorce-in-turkey') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'divorce-in-turkey-2026',
  'divorce-in-turkey',
  'الطلاق في تركيا — الإجراءات القانونية',
  'معاملات رسمية',
  'الطلاق في تركيا يتم عبر المحكمة حصراً — لا يوجد طلاق إداري. يُنظر فيه أمام محكمة الأسرة (Aile Mahkemesi).',
  '<p>نوعان: <strong>بالاتفاق</strong> (Anlaşmalı — يشترط زواج أكثر من سنة + اتفاق كامل) و<strong>نزاعي</strong> (Çekişmeli — طرف واحد يطلب). الأجانب لهم نفس الحقوق. إذا كان الزوجان أجنبيين تطبق المحكمة قانون بلدهم. بعد الحكم يجب التسجيل في النفوس وإخطار القنصلية.</p><p>التكلفة: محامٍ 15,000-50,000 TL + رسوم محكمة 2,000-5,000 TL. بالاتفاق أسرع وأرخص بكثير.</p>',
  ARRAY['حدد النوع: بالاتفاق (Anlaşmalı Boşanma) أو نزاعي (Çekişmeli Boşanma)', 'بالاتفاق: اكتبا بروتوكولاً مشتركاً (حضانة، نفقة، ممتلكات) وقدّماه للمحكمة', 'نزاعي: يُرفع من طرف واحد مع ذكر السبب (هجر، عنف، خيانة، شقاق)', 'المحكمة المختصة: Aile Mahkemesi في مدينة إقامة أحد الطرفين', 'بعد الحكم: سجّل الطلاق في النفوس (NVI) وأخطر قنصلية بلدك'],
  ARRAY['عقد الزواج الأصلي (مترجم ومصدق)', 'الكملك أو جواز السفر', 'بروتوكول الاتفاق (للطلاق بالاتفاق)', 'أدلة الأسباب (للطلاق النزاعي)', 'توكيل محامٍ'],
  ARRAY['الطلاق بالاتفاق أسرع وأقل تكلفة — حاولا الاتفاق قبل النزاعي', 'وثّق كل شيء في البروتوكول — استشر محامياً قبل التوقيع'],
  ARRAY['legal-trouble'],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'utility-bill-dispute') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'utility-bill-dispute-2026',
  'utility-bill-dispute',
  'نزاع فواتير الخدمات — كيف تعترض',
  'معاملات رسمية',
  'إشكالات الفواتير شائعة للمستأجرين العرب: فاتورة بمبلغ غير معقول، ديون من المستأجر السابق، أو قطع الخدمة بدون إنذار.',
  '<p>المستأجر غير مسؤول قانونياً عن ديون المستأجر السابق (قرارات محكمة مستقرة). يحظر قطع الخدمة بدون إنذار رسمي. الاعتراض مجاني وشكوى Tüketici Hakem Heyeti مجانية.</p>',
  ARRAY['فاتورة مبالغ فيها: تحقق من قراءة العداد (Sayaç) وقارن مع الفاتورة', 'قدّم اعتراضاً لمزود الخدمة (AYEDAŞ للكهرباء، İGDAŞ للغاز، İSKİ للماء)', 'ديون المستأجر السابق: ارفض الدفع واطلب نقل العداد باسمك', 'قطع بدون إنذار: قدّم شكوى لـ EPDK (هيئة تنظيم الطاقة)', 'إذا لم تحل المشكلة: شكوى مجانية في Tüketici Hakem Heyeti'],
  ARRAY['الفواتير محل الاعتراض', 'عقد الإيجار (لإثبات تاريخ السكن)', 'صورة العداد مع القراءة الحالية'],
  ARRAY['عند الانتقال لمنزل جديد: انقل العدادات باسمك فوراً', 'صوِّر العداد يوم الانتقال كدليل'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;
