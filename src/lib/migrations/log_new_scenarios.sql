-- =============================================
-- تسجيل السيناريوهات الجديدة في admin_activity_log
-- لتظهر في صفحة /updates
-- شغّل هذا مرة واحدة في Supabase SQL Editor
-- =============================================

INSERT INTO admin_activity_log (event_type, title, detail, entity_id, entity_table) VALUES

-- سيناريوهات المستثمر (أُضيفت سابقاً)
('new_scenario', 'الجنسية التركية عبر الاستثمار العقاري (400K$)', 'شروط DAB، تقييم SPK، القيود على السوريين، مدة 8-18 شهر، ضريبة أرباح رأس المال', 'investor-citizen', 'consultant_scenarios'),
('new_scenario', 'متابعة ملف الجنسية الاستثمارية', 'e-Devlet + e-içişleri + CİMER، تحذير بيع العقار قبل اكتمال الملف', 'daily-citizenship-status', 'consultant_scenarios'),
('new_scenario', 'إقامة عقارية عبر شراء عقار (200K$)', 'YUKK م.31، لا حق عمل تلقائي، شرط الإقامة الفعلية', 'investor-residence', 'consultant_scenarios'),
('new_scenario', 'تأسيس شركة LTD في تركيا', 'رأس مال 100K TL (2026)، أكواد NACE، قاعدة 5 أتراك، المكتب الافتراضي', 'company-setup', 'consultant_scenarios'),
('new_scenario', 'الالتزامات الشهرية للشركة', 'أرقام 2026: محاسب 3-8K، SGK 7-10K، KDV 20%، ضريبة شركات 25%، Basit Usul', 'company-monthly-obligations', 'consultant_scenarios'),
('new_scenario', 'إغلاق الشركة في تركيا', 'مرحلتان: vergiden silinme + Ticaret Sicil، غرامات الشركات المهجورة', 'company-closure', 'consultant_scenarios'),
('new_scenario', 'تحويلات FAST البنكية', 'حد 400K TL، 24/7، الفرق بين FAST و EFT', 'daily-fast', 'consultant_scenarios'),
('new_scenario', 'التصنيف الائتماني (Findeks)', 'findeks.com، e-Devlet KKB، 6-12 شهر لبناء التصنيف، قيود القروض للأجانب', 'daily-credit-score', 'consultant_scenarios'),
('new_scenario', 'إذن عمل لصاحب شركة', 'قاعدة 5 أتراك لكل أجنبي (قانون 4817 م.5)، توافق NACE', 'work-permit-company', 'consultant_scenarios'),
('new_scenario', 'فتح حساب بنكي بالكملك أو البطاقة الصفراء', 'البنوك الحكومية الأسهل، KYC، MASAK', 'syrian-bank-kimlik-yellow', 'consultant_scenarios'),

-- سيناريوهات العمل والضرائب (جديدة)
('new_scenario', 'جدول رسوم إذن العمل 2026', 'رسوم 5 فئات: كملك 5,641 TL، عادي سنة 13,538 TL، سنتان 26,113 TL، 3 سنوات 38,688 TL، غير محدد 126,766 TL', 'work-permit-cost', 'consultant_scenarios'),
('new_scenario', 'تسجيل SGK والتأمين الصحي (GSS)', 'التسجيل إلزامي قبل يوم العمل الأول، اختبار الدخل، اشتراكات 37.5%', 'work-sgk', 'consultant_scenarios'),
('new_scenario', 'الرقم الضريبي في تركيا', 'رقم مؤقت 99x → دائم، الفرق بين الشخصي وضريبة الشركة، مجاني فوري', 'daily-tax-number', 'consultant_scenarios'),

-- سيناريوهات الطالب والجامعة (جديدة)
('new_scenario', 'إقامة الطالب (Öğrenci İkamet İzni)', 'رسوم 964 TL (2026)، 4 بدائل تأمين، السجل الجنائي مطلوب، تجميد القيد يلغي الإقامة', 'student-residence', 'consultant_scenarios'),
('new_scenario', 'تعديل الشهادة الجامعية (YÖK Denklik)', 'YÖK وليس MEB، تكاليف 3-8K TL، امتحان تقييم محتمل', 'student-denklik', 'consultant_scenarios'),
('new_scenario', 'معادلة شهادة الثانوية (MEB Denklik)', 'نظام e-Denklik إلزامي منذ يوليو 2024، MEB وليس YÖK', 'student-highschool-denklik', 'consultant_scenarios'),
('new_scenario', 'استخراج كشف درجات من e-Devlet', 'الأجانب يستخدمون رقم YU وليس TC، ليس كل الجامعات تتيح الخدمة', 'student-transcript', 'consultant_scenarios'),
('new_scenario', 'امتحان اليوس (TR-YÖS 2026)', 'مواعيد: 12 أبريل + 11 أكتوبر 2026، رسوم 1,958 TL، 100 سؤال رياضيات ومنطق', 'student-yos', 'consultant_scenarios'),
('new_scenario', 'تومر — دورات اللغة التركية (TÖMER)', 'ليس دائماً C1، رسوم 10-30K TL، مراكز أخرى معترفة غير تومر', 'student-tomer', 'consultant_scenarios'),
('new_scenario', 'حق العمل للطالب الأجنبي', 'إذن عمل ليس أوتوماتيكي، ليسانس: بعد السنة الأولى، ماجستير/دكتوراه: دوام كامل', 'student-work-rights', 'consultant_scenarios'),
('new_scenario', 'منح الحكومة التركية (Türkiye Bursları)', 'منح YTB: رسوم + سكن + مبلغ شهري + تأمين + تذكرة طيران + لغة مجانية', 'student-turkiye-burslari', 'consultant_scenarios'),
('new_scenario', 'معادلة شهادة للسوريين تحت الحماية المؤقتة', 'مسارات بديلة بدون وثائق أصلية، امتحان تقييم مستوى، دعم UNICEF/Jusoor', 'syrian-denklik', 'consultant_scenarios'),

-- سيناريوهات الخدمات اليومية (جديدة)
('new_scenario', 'e-Devlet (التسجيل والدخول)', 'رسوم 5/20 TL، تسجيل بيومتري، تحذير الاحتيال', 'daily-edevlet', 'consultant_scenarios'),
('new_scenario', 'e-Nabız (الوصول للملف الصحي)', 'ملف صحي إلكتروني، مواعيد وتحاليل', 'daily-enabiz', 'consultant_scenarios'),
('new_scenario', 'KADES (بلاغ عنف عائلي)', 'تطبيق وزارة الداخلية، GPS، أرقام الطوارئ 183/112/155', 'daily-kades', 'consultant_scenarios'),
('new_scenario', 'التحقق من خطوط الهاتف المسجلة', 'BTK hat sorgulama عبر e-Devlet', 'daily-mobile-lines-check', 'consultant_scenarios'),
('new_scenario', 'تصديق النوتر (رسوم 2026)', '1,770 TL/صفحة، الفرق بين المترجم المحلف والنوتر', 'daily-notary', 'consultant_scenarios'),
('new_scenario', 'PayPal وبدائل الدفع الإلكتروني', 'PayPal محظور، بدائل: Wise، Payoneer، Stripe، IBAN', 'daily-paypal', 'consultant_scenarios'),
('new_scenario', 'العملات الرقمية في تركيا', 'تنظيم SPK فبراير 2026، التزامات ضريبية على الأرباح', 'daily-crypto', 'consultant_scenarios'),
('new_scenario', 'مشاكل حجوزات Booking.com', 'إشكاليات الدفع والحظر، بدائل محلية', 'daily-booking-block', 'consultant_scenarios'),
('new_scenario', 'بدل فاقد رخصة القيادة', 'الإجراءات + مهلة سنة لاستبدال الرخصة الأجنبية', 'daily-lost-driving-license', 'consultant_scenarios'),
('new_scenario', 'دعوى الطلاق في تركيا', 'أنواع: اتفاقي وخلافي، TMK م.161-184، التكاليف', 'legal-divorce', 'consultant_scenarios'),
('new_scenario', 'استبدال رخصة قيادة أجنبية', 'مهلة سنة إلزامية، الإجراءات والرسوم', 'daily-driving-license-exchange', 'consultant_scenarios'),
('new_scenario', 'خدمات بريد PTT', 'بريد + حوالات + كلمة سر e-Devlet', 'daily-ptt-services', 'consultant_scenarios'),
('new_scenario', 'فحص المركبات والتأمين', 'TÜVTÜRK، Trafik Sigortası، Kasko', 'daily-vehicle-inspection', 'consultant_scenarios'),
('new_scenario', 'اعتراض على فواتير الخدمات', 'AYEDAŞ/İGDAŞ/İSKİ، شكوى EPDK', 'daily-utility-dispute', 'consultant_scenarios'),
('new_scenario', 'وثيقة المفوضية UNHCR', 'التسجيل 444 4 868، الحماية، إعادة التوطين', 'daily-unhcr-document', 'consultant_scenarios'),
('new_scenario', 'الترجمة المحلفة (Yeminli Tercüman)', 'التحقق من الصلاحية، تحذير الاحتيال', 'daily-sworn-translator', 'consultant_scenarios'),

-- سيناريوهات الطوارئ (جديدة)
('new_scenario', 'احتجاز في مركز الترحيل (GGM)', 'حقوق المحتجز، حق المحامي، الطعن خلال 7 أيام، YUKK م.53-60', 'emergency-detention', 'consultant_scenarios'),
('new_scenario', 'بدون أوراق / وضع غير نظامي', 'خيارات التسوية: حماية دولية، مغادرة طوعية، تسوية قانونية، UNHCR', 'emergency-undocumented', 'consultant_scenarios'),
('new_scenario', 'استدعاء أو احتجاز في الشرطة', 'حقوق المشتبه به: محامٍ، مترجم، صمت، 24+24 ساعة، CMK م.149-150', 'emergency-police-station', 'consultant_scenarios');
