-- ============================================
-- Batch 5: معاملات رسمية (9) + خدمات e-Devlet (4)
-- Total: 13 articles
-- ============================================

-- =============================================
-- معاملات رسمية — 9 مقالات (الجزء الثاني: مالي + بنوك)
-- =============================================

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'bank-account-general') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'bank-account-general-2026',
  'bank-account-general',
  'فتح حساب بنكي في تركيا — دليل عام',
  'معاملات رسمية',
  'الإجراءات العامة لفتح حساب بنكي في تركيا لأي أجنبي مقيم أو حامل إقامة أو كملك.',
  '<p>يمكن للأجانب فتح حساب بنكي بجواز سفر ساري ورقم ضريبي. أنظمة MASAK تُلزم البنوك بتوثيق الهوية ومصدر الأموال. التحويلات الكبيرة (أكثر من 75,000 ليرة) تُبلَّغ تلقائياً.</p><p>أفضل البنوك للأجانب: Ziraat (حكومي، الأسهل)، VakıfBank، İş Bankası.</p>',
  ARRAY['استخرج رقماً ضريبياً (Vergi Numarası) من أقرب دائرة ضرائب — مجاني وفوري', 'اذهب لفرع البنك شخصياً مع المستندات', 'أكمل نموذج KYC: مصدر الدخل، الغرض من الحساب', 'فعّل الخدمات الرقمية (Mobile + Internet Banking)', 'بعض البنوك ترفض بدون إقامة سارية — جرّب بنكاً آخر'],
  ARRAY['جواز السفر أو بطاقة الإقامة/الكملك', 'الرقم الضريبي (Vergi Numarası)', 'رقم هاتف تركي مفعّل'],
  ARRAY['ابدأ ببنك Ziraat — الأسهل للأجانب', 'لا تفتح حسابات متعددة بدون حاجة لتجنب استفسارات MASAK'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'bank-account-tourist') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'bank-account-tourist-2026',
  'bank-account-tourist',
  'فتح حساب بنكي كسائح أو زائر',
  'معاملات رسمية',
  'يمكن للسائح فتح حساب بنكي في تركيا بجواز سفر ساري ورقم ضريبي. لكن تشددت إجراءات KYC بسبب أنظمة MASAK.',
  '<p>البنوك الحكومية (Ziraat, Vakıfbank, Halkbank) أسهل للأجانب. الخاصة قد تطلب شروطاً إضافية. بعض البنوك تطلب إثبات عنوان أو إيداعاً مبدئياً (100-500 ليرة). الحسابات غير المستخدمة لمدة طويلة قد تُجمَّد تلقائياً.</p>',
  ARRAY['استخرج رقماً ضريبياً من أقرب دائرة ضرائب أو عبر İnteraktif Vergi Dairesi', 'اختر البنك: الحكومية أسهل، الخاصة قد تطلب شروطاً إضافية', 'اذهب للفرع شخصياً — لا يمكن فتح حساب عن بعد للأجانب الجدد', 'أكمل نموذج KYC وفعّل الخدمات الرقمية'],
  ARRAY['جواز سفر ساري المفعول', 'رقم ضريبي (Vergi Numarası)', 'رقم هاتف تركي مفعّل', 'عنوان في تركيا (بعض البنوك)'],
  ARRAY['البنوك الحكومية أسهل وأقل تعقيداً', 'احتفظ دائماً بوصل الإيداع'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'bank-account-blocked') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'bank-account-blocked-2026',
  'bank-account-blocked',
  'حظر الحساب البنكي — الأسباب والحلول',
  'معاملات رسمية',
  'يمكن أن يُجمَّد حسابك البنكي لأسباب متعددة: ديون İcra (تنفيذ)، تحقيق MASAK، أو طلب قضائي.',
  '<p>الحد الأدنى المحمي من الحجز: 75% من الحد الأدنى للأجور (2026: ≈10,060 ليرة غير قابلة للحجز). فك الحجز لا يكلف رسوماً إضافية لكن الدين الأصلي + فوائد التأخير يجب تسويته. قانون İcra ve İflas المادة 83.</p>',
  ARRAY['اتصل بالبنك فوراً لمعرفة السبب (İcra haciz / MASAK bloke / Mahkeme kararı)', 'بسبب İcra: راجع دائرة التنفيذ (İcra Müdürlüğü) — يمكنك الدفع أو التقسيط', 'بسبب MASAK: قدّم مستندات تثبت مشروعية مصدر الأموال', 'بأمر قضائي: تحتاج محامياً للطعن في القرار', 'لفك الحجز الجزئي: رواتب ومعاشات محمية (75% من الحد الأدنى للأجور)', 'بعد التسوية: اطلب إرسال "فك الحجز" (Haciz fekki) للبنك'],
  ARRAY['رقم ملف التنفيذ (İcra dosya numarası) إن وجد', 'كشف حساب بنكي', 'مستندات إثبات مصدر الدخل', 'توكيل محامٍ (للحالات القضائية)'],
  ARRAY['تحقق من ديونك بانتظام عبر E-Devlet → Borç Sorgulama', 'لا تتجاهل إخطارات İcra لأن الفوائد تتراكم بسرعة'],
  ARRAY[]::text[],
  'إذا تم تجميد حسابك بسبب MASAK، لا تحاول فتح حساب جديد — سيُرفض. عالج المشكلة أولاً.',
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'debt-check-turkey') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'debt-check-turkey-2026',
  'debt-check-turkey',
  'التحقق من الديون والمستحقات',
  'معاملات رسمية',
  'كل مقيم في تركيا قد تتراكم عليه ديون دون علمه: ديون GSS، ديون İcra، أو مستحقات SGK. التحقق الدوري ضروري.',
  '<p>دين GSS يتراكم تلقائياً إذا لم يكن لديك تأمين صحي أو عمل مسجل — ويمنع تجديد الإقامة في بعض الولايات. الاستعلام مجاني عبر E-Devlet. يمكن تقسيط الديون عبر SGK.</p>',
  ARRAY['دين GSS: ادخل E-Devlet → SGK → GSS Borç Sorgulama', 'ديون İcra: ادخل E-Devlet → UYAP → İcra Dosya Sorgulama', 'مستحقات SGK: ادخل E-Devlet → SGK Hizmet Dökümü', 'ديون ضرائب: İnteraktif Vergi Dairesi أو E-Devlet → Vergi Borç Sorgulama'],
  ARRAY['رقم TC أو رقم الأجانب', 'كلمة مرور E-Devlet'],
  ARRAY['افحص ديونك كل 3 أشهر عبر E-Devlet', 'استفسر عن فترات التقسيط والإعفاء التي تعلنها الحكومة دورياً'],
  ARRAY[]::text[],
  'دين GSS يمنع الحصول على تأمين صحي حكومي ويمنع تجديد الإقامة في بعض الولايات.',
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'fast-financial-system') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'fast-financial-system-2026',
  'fast-financial-system',
  'نظام FAST — التحويلات البنكية الفورية',
  'معاملات رسمية',
  'نظام FAST هو نظام التحويل الفوري بين البنوك التركية يعمل 24/7. الحد الأعلى للمعاملة: 400,000 ليرة.',
  '<p>التحويل يصل خلال ثوانٍ بما في ذلك العطل الرسمية. للمبالغ الأكبر استخدم EFT (أوقات عمل البنوك فقط). FAST مجاني في معظم البنوك. خاضع لرقابة البنك المركزي (TCMB). التحويلات الكبيرة تُبلَّغ تلقائياً لـ MASAK.</p>',
  ARRAY['افتح تطبيق البنك (Mobile Banking)', 'اختر "Havale/EFT" ثم "FAST" كطريقة تحويل', 'أدخل IBAN المستلم ومبلغ التحويل', 'الحد الأعلى: 400,000 TL للمعاملة الواحدة', 'التحويل فوري 24/7 — للمبالغ الأكبر استخدم EFT'],
  ARRAY['حساب بنكي نشط مع Mobile/Internet Banking', 'IBAN المستلم'],
  ARRAY['FAST غير قابل للاسترجاع — تأكد من صحة IBAN قبل الإرسال', 'EFT للمبالغ الكبيرة (إيجارات، عقارات) وأوقات العمل فقط'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'paypal-turkey-guide') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'paypal-turkey-guide-2026',
  'paypal-turkey-guide',
  'PayPal في تركيا — البدائل والحلول',
  'معاملات رسمية',
  'PayPal غير متاح رسمياً في تركيا منذ 2016 بسبب خلاف مع هيئة BDDK. لكن توجد بدائل معتمدة.',
  '<p>البدائل: Wise (الأنسب للفريلانسرز، رسوم 0.5-1.5%)، Payoneer (للشركات ومنصات العمل الحر)، SWIFT (بنكي تقليدي، 30-50 USD)، Stripe (للشركات فقط). استخدام VPN لحساب PayPal أجنبي = منطقة رمادية قانونياً.</p>',
  ARRAY['Wise (wise.com): تحويلات دولية بأسعار صرف حقيقية — الأنسب للفريلانسرز', 'Payoneer (payoneer.com): استلام مدفوعات من Upwork وFiverr وAmazon', 'IBAN مباشر (SWIFT/Wire): تحويل بنكي تقليدي — أبطأ وأعلى رسوماً لكن موثوق', 'Stripe (stripe.com): للشركات فقط — معالج دفعات إلكترونية', 'كل بديل له قيود خاصة — اقرأ الشروط قبل فتح الحساب'],
  ARRAY['جواز سفر أو هوية + إثبات عنوان (حسب المنصة)'],
  ARRAY['Wise هو الأقرب لتجربة PayPal من حيث السهولة', 'للعمل الحر الدولي: Payoneer هو الخيار الأمثل'],
  ARRAY[]::text[],
  'PayPal ممنوع من العمل في تركيا بقرار BDDK. استخدام VPN للدخول لحساب أجنبي = منطقة رمادية قانونياً.',
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'crypto-turkey-rules') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'crypto-turkey-rules-2026',
  'crypto-turkey-rules',
  'العملات الرقمية في تركيا — القوانين',
  'معاملات رسمية',
  'تركيا نظّمت سوق العملات الرقمية رسمياً. التداول متاح عبر منصات مرخصة من SPK فقط.',
  '<p>صدر قانون تنظيم الكريبتو 2024 ولائحة SPK التنفيذية فبراير 2026. أرباح العملات الرقمية خاضعة لضريبة الزيادة في القيمة. يُحظر استخدامها كوسيلة دفع مباشرة (قرار TCMB 2021). منصات غير مرخصة = خطر فقدان أموالك.</p>',
  ARRAY['التداول فقط عبر منصات مرخصة من SPK (القائمة على spk.gov.tr)', 'افتح حساباً وأكمل KYC (هوية + إثبات عنوان)', 'أرباح الكريبتو خاضعة لضريبة — يجب الإبلاغ في الإقرار الضريبي السنوي', 'يُحظر استخدام العملات الرقمية كوسيلة دفع مباشرة', 'منصات غير مرخصة = خطر فقدان أموالك بدون حماية قانونية'],
  ARRAY['هوية + إثبات عنوان + رقم ضريبي (للمنصات المرخصة)'],
  ARRAY['تعامل فقط مع منصات مرخصة من SPK', 'احتفظ بسجلات كل عملياتك للإقرار الضريبي', 'استشر محاسباً تركياً إذا كانت أرباحك كبيرة'],
  ARRAY[]::text[],
  'منصات غير مرخصة من SPK = خطر فقدان أموالك بدون أي حماية قانونية.',
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'booking-block-fix') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'booking-block-fix-2026',
  'booking-block-fix',
  'حظر Booking.com — الأسباب والحلول',
  'معاملات رسمية',
  'Booking.com وبعض منصات الحجز تواجه مشاكل في تركيا بسبب قيود تنظيمية وخلافات مع قطاع الفنادق.',
  '<p>Booking.com حُظر جزئياً سابقاً (2017-2022). حالياً يعمل بقيود. بدائل محلية مرخصة: OtelZ.com، TatilSepeti، Jolly Tur. Airbnb يعمل لكن المؤجر يجب أن يكون مسجلاً رسمياً. حق الإلغاء والاسترداد محفوظ بقانون التجارة الإلكترونية 6563.</p>',
  ARRAY['Booking.com يعمل حالياً بقيود — بعض الفنادق والشقق لا تظهر', 'بدائل محلية: OtelZ.com، TatilSepeti، Jolly Tur', 'Airbnb متاح لكن المؤجر يجب أن يكون مرخصاً — شقق بدون ترخيص = مخالفة', 'مشكلة في الحجز: شكوى عبر Tüketici Hakem Heyeti أو CİMER', 'نصيحة: احجز مباشرة من الفندق إن أمكن — غالباً أرخص'],
  ARRAY[]::text[],
  ARRAY['قارن الأسعار بين المنصات والحجز المباشر', 'اقرأ سياسة الإلغاء بعناية قبل الحجز', 'التقييمات على Google Maps أصدق أحياناً من تقييمات المنصات'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'findeks-credit-score') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'findeks-credit-score-2026',
  'findeks-credit-score',
  'درجة الائتمان Findeks — كيف تتحقق',
  'معاملات رسمية',
  'نقطة الائتمان (Kredi Notu) تحدد قدرتك على الحصول على قروض وبطاقات ائتمان. بناء سجل ائتماني للأجانب يحتاج 6-12 شهراً.',
  '<p>الاطلاع عبر e-Devlet → "KKB Bireysel Kredi Notu Sorgulama" أو findeks.com (تقرير مجاني واحد سنوياً). معظم البنوك لا تُقرض الأجانب غير المقيمين — حتى المقيمين قد يواجهون دفعة أولى أعلى (40-50%).</p>',
  ARRAY['اطلع على نقطتك عبر e-Devlet → KKB Bireysel Kredi Notu Sorgulama', 'بديل: findeks.com (منصة KKB الرسمية)', 'لبناء سجل: استخدم بطاقة ائتمان بانتظام وسدد بالكامل شهرياً', 'المدة المطلوبة: 6-12 شهراً من النشاط البنكي المنتظم', 'تنبيه: معظم البنوك لا تُقرض الأجانب غير المقيمين أو أصحاب الإقامات القصيرة'],
  ARRAY['بيانات الدخول إلى e-Devlet أو findeks.com', 'رقم TC'],
  ARRAY['ابدأ ببطاقة ائتمان بسيطة واستخدمها بانتظام', 'لا تتأخر في السداد حتى يوم واحد — يُسجَّل فوراً', 'إذا تخطط لقرض عقاري ابدأ ببناء سجلك قبل 6-12 شهراً'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

-- =============================================
-- خدمات e-Devlet — 4 مقالات
-- =============================================

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'edevlet-registration-guide') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'edevlet-registration-guide-2026',
  'edevlet-registration-guide',
  'دليل e-Devlet — التسجيل والاستخدام',
  'خدمات e-Devlet',
  'e-Devlet هو البوابة الإلكترونية الحكومية الموحدة في تركيا. يمكنك إتمام مئات المعاملات الرسمية.',
  '<p>التسجيل الأول عبر PTT (5 TL). بدائل الدخول: تطبيق e-Devlet بالبصمة/الوجه، بطاقة NFC، التوقيع الإلكتروني. turkiye.gov.tr هو الموقع الرسمي الوحيد.</p><p><strong>تحذير مهم:</strong> ظاهرة احتيال مكاتب الخدمة منتشرة — مكاتب تطلب بيانات e-Devlet ثم تستغل حسابك. لا تُشارك شيفرتك مع أي شخص.</p>',
  ARRAY['اذهب لأقرب فرع PTT مع بطاقتك واطلب شيفرة e-Devlet (5 TL)', 'بدائل: تطبيق e-Devlet بالبصمة/الوجه أو بطاقة NFC أو التوقيع الإلكتروني', 'ادخل على turkiye.gov.tr وسجّل بياناتك', 'لا تُشارك شيفرتك مع أي شخص أو مكتب مهما كان'],
  ARRAY['الكملك أو بطاقة الإقامة أو جواز السفر', 'رقم هاتف تركي مفعّل'],
  ARRAY['فعّل إشعارات التطبيق لتتلقى تنبيهات عن أي معاملة على حسابك', 'لا تعطِ شيفرتك لأي مكتب ترجمة أو وسيط'],
  ARRAY[]::text[],
  'احتيال مكاتب الخدمة ظاهرة منتشرة تستهدف العرب والأجانب. لا تُشارك بيانات e-Devlet مع أحد.',
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'kades-emergency-app') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'kades-emergency-app-2026',
  'kades-emergency-app',
  'تطبيق KADES للطوارئ',
  'خدمات e-Devlet',
  'KADES هو تطبيق الحماية من العنف الأسري التابع لوزارة الداخلية. يعمل مع الأجانب لكن بالتركية فقط.',
  '<p>عند الضغط على زر الطوارئ يُرسل إشارة فورية لأقرب دورية شرطة مع موقعك GPS. قانون حماية الأسرة 6284 يمنح حقوقاً فورية للضحايا (أمر حماية مؤقت خلال ساعات). الأجانب لهم نفس الحقوق.</p><p>بدائل فورية: 183 (خط دعم المرأة 24/7)، 112 (إسعاف)، 155 (شرطة).</p>',
  ARRAY['حمّل تطبيق KADES من App Store أو Google Play', 'سجّل برقم TC أو رقم الهوية الأجنبية + رقم هاتف تركي', 'زر الطوارئ يُرسل إشارة فورية مع موقعك GPS لأقرب دورية', 'التطبيق بالتركية فقط — تأكد من فهم الأزرار مسبقاً', 'بدائل أسرع: 183 (دعم المرأة 24/7) أو 112 (إسعاف) أو 155 (شرطة)', 'يمكنك التوجه مباشرة لأقرب مخفر أو مركز ŞÖNİM'],
  ARRAY['هاتف ذكي مع رقم تركي'],
  ARRAY['جهّز التطبيق مسبقاً ولا تنتظر حالة الطوارئ', 'علّمي أطفالك الأرقام 183 و 112', 'أقرب ŞÖNİM يمكنك إيجاده عبر البحث في e-Devlet'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'mobile-lines-check') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'mobile-lines-check-2026',
  'mobile-lines-check',
  'التحقق من الخطوط المسجلة باسمك',
  'خدمات e-Devlet',
  'يمكنك التحقق من عدد خطوط الهاتف المسجلة باسمك عبر e-Devlet أو BTK. مهم لاكتشاف خطوط مسجلة بدون علمك.',
  '<p>الحد الأقصى للخطوط باسم أجنبي = خطان (3 للأتراك). تسجيل خط باسم شخص بدون علمه = جريمة تزوير. الخطوط المجهولة قد تُستخدم في احتيال.</p>',
  ARRAY['ادخل على e-Devlet → ابحث عن "BTK Hat Sorgulama" أو "Adıma Kayıtlı Hatlar"', 'سترى قائمة بجميع الخطوط عند كل الشركات (Turkcell, Vodafone, Türk Telekom)', 'إذا وجدت خطاً لا تعرفه: قدّم شكوى فوراً عبر BTK أو CİMER لإلغائه', 'بديل: اذهب لفرع الشركة المعنية مع هويتك لإلغاء الخط مباشرة'],
  ARRAY['حساب e-Devlet مفعّل'],
  ARRAY['تحقق كل 6 أشهر — خاصة إذا سبق أن أعطيت هويتك لمكتب ما', 'الحد الأقصى للأجانب: خطان فقط'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM articles WHERE slug = 'ptt-postal-services') THEN
INSERT INTO articles (id, slug, title, category, intro, details, steps, documents, tips, tags, warning, status, last_update, created_at)
VALUES (
  'ptt-postal-services-2026',
  'ptt-postal-services',
  'خدمات PTT البريدية',
  'خدمات e-Devlet',
  'PTT هو البريد الحكومي التركي. يقدم خدمات بريدية + تحويل أموال + دفع فواتير + شيفرة e-Devlet.',
  '<p>خدمات PTT للأجانب: استلام بطاقة الإقامة بالبريد، شيفرة e-Devlet (5 TL أول مرة)، تحويل أموال محلي ودولي (PTT حوالة)، دفع الفواتير. كارغو PTT أرخص من الشركات الخاصة للطرود الثقيلة. الفروع منتشرة في كل مكان.</p>',
  ARRAY['خدمات البريد: إرسال واستلام طرود محلية ودولية', 'شيفرة e-Devlet: 5 TL أول مرة، 20 TL تجديد/بدل فاقد', 'تحويل أموال: PTT Havale محلياً، Western Union دولياً', 'دفع فواتير: كهرباء، ماء، غاز، هاتف من أي فرع', 'استلام بطاقة الإقامة عبر البريد المسجل'],
  ARRAY['بطاقة هوية (كملك/إقامة/جواز)'],
  ARRAY['PTT أرخص من الشركات الخاصة للطرود الثقيلة', 'الفروع تعمل أيام السبت في بعض المدن الكبرى'],
  ARRAY[]::text[],
  NULL,
  'published',
  '2026-02-01',
  NOW()
);
END IF;
END $$;
