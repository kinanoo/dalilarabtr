-- تنظيف البيانات القديمة (اختياري)
-- DELETE FROM service_providers WHERE email LIKE '%@example.com'; 

-- 1. إسطنبول: عيادة طبية (موثقة + تقييم عالي)
INSERT INTO service_providers (id, name, profession, category, city, district, phone, whatsapp, description, bio, image, is_verified, rating_avg, review_count)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'د. سليم الترك', 
  'طبيب أسنان وجراحة فكية', 
  'health', 
  'إسطنبول', 
  'الفاتح', 
  '05551234567', 
  '905551234567', 
  'عيادة تخصصية لزراعة الأسنان وتجميل الابتسامة بأحدث التقنيات. خبرة 15 عاماً في المشافي التركية.', 
  'أنا الدكتور سليم، خريج جامعة إسطنبول للجراحة. عيادتنا في الفاتح تقدم كافة العلاجات السنية: زراعة، تقويم، فيتير، وتبييض. نستخدم أجهزة ألمانية لضمان الدقة والتعقيم. يتوفر لدينا مترجم عربي.',
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1964&auto=format&fit=crop',
  true, 
  4.9, 
  120
);

-- 2. مرسين: شركة شحن
INSERT INTO service_providers (id, name, profession, category, city, district, phone, whatsapp, description, bio, image, is_verified, rating_avg, review_count)
VALUES (
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  'شركة الأمانة للشحن الدولي', 
  'شحن وتخليص جمركي', 
  'transport', 
  'مرسين', 
  'الميناء', 
  '05321234567', 
  '905321234567', 
  'شحن بضائع من تركيا إلى كافة الدول العربية. خدمات لوجستية متكاملة وتخزين.', 
  'شركة الأمانة هي خيارك الأول للشحن الآمن. نقدم خدمات الشحن البري والبحري والجوي. تخليص جمركي سريع في ميناء مرسين. مستودعاتنا مجهزة ومؤمنة. أسعار منافسة للتجار والشركات.',
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop',
  false, 
  4.5, 
  45
);

-- 3. هاتاي: مطعم ومأكولات
INSERT INTO service_providers (id, name, profession, category, city, district, phone, whatsapp, description, bio, image, is_verified, rating_avg, review_count)
VALUES (
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  'مطبخ ست الكل', 
  'مأكولات منزلية وتواصي', 
  'food', 
  'هاتاي', 
  'أنطاكية', 
  '05441234567', 
  '905441234567', 
  'أشهى المأكولات الحلبية والتركية. كبب، محاشي، وجبات يومية للموظفين.', 
  'نقدم لكم طعم البيت الأصيل في أنطاكية. مستعدون لتلبية طلبات العزائم والأفراح. قائمة يومية متنوعة وبأسعار مدروسة. جرب الكبة المشوية على طريقتنا الخاصة!',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop',
  true, 
  5.0, 
  15
);

-- 4. أضنة: محاماة واستشارات
INSERT INTO service_providers (id, name, profession, category, city, district, phone, whatsapp, description, bio, image, is_verified, rating_avg, review_count)
VALUES (
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
  'الأستاذ كمال يلماز', 
  'محامي واستشارات قانونية', 
  'legal', 
  'أضنة', 
  'سيهان', 
  '05351234567', 
  '905351234567', 
  'مكتب محاماة متخصص في قضايا الجنسية، الإقامة، وتأسيس الشركات للأجانب.', 
  'محامي تركي يتحدث العربية بطلاقة. خبرة 10 سنوات في المحاكم التركية. نساعدك في كافة الإجراءات القانونية: شراء العقارات، تحصيل الديون، القضايا التجارية والجنائية. استشارة أولية مجانية.',
  'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=2070&auto=format&fit=crop',
  true, 
  4.8, 
  82
);

-- 5. غازي عنتاب: صيانة (حرفيون)
INSERT INTO service_providers (id, name, profession, category, city, district, phone, whatsapp, description, bio, image, is_verified, rating_avg, review_count)
VALUES (
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
  'ورشة النور للسيارات', 
  'ميكانيك وكهرباء سيارات', 
  'general', 
  'غازي عنتاب', 
  'المنطقة الصناعية', 
  '05381234567', 
  '905381234567', 
  'صيانة شاملة لجميع أنواع السيارات. فحص كمبيوتر، تغيير زيت، صيانة محركات.', 
  'ورشة النور بإدارة المعلم أبو حسن. خبرة طويلة في صيانة السيارات الألمانية واليابانية. نضمن لك قطع غيار أصلية وصيانة أمينة. خدمة طوارئ على الطريق.',
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1974&auto=format&fit=crop',
  false, 
  4.2, 
  20
);

-- 6. أورفا: ترجمة وتعقيب
INSERT INTO service_providers (id, name, profession, category, city, district, phone, whatsapp, description, bio, image, is_verified, rating_avg, review_count)
VALUES (
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
  'مكتب الفرات للخدمات', 
  'ترجمة محلفة وتأمين', 
  'legal', 
  'شانلي أورفا', 
  'الأيوبية', 
  '05391234567', 
  '905391234567', 
  'ترجمة وتصديق كافة الوثائق الرسمية. حجز مواعيد، تأمين صحي للإقامة.', 
  'مكتب معتمد لدى كاتب العدل (النوتر). ننجز معاملاتكم بسرعة ودقة. ترجمة (عربي - تركي - إنجليزي). وتأمين صحي بأرخص الأسعار لاستخراج الإقامة.',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop',
  true, 
  4.7, 
  55
);

-- إضافة تقييمات (Reviews) لبعض الخدمات لتظهر النجوم
INSERT INTO service_reviews (provider_id, client_name, rating, comment, is_approved)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'خالد مصري', 5, 'دكتور ممتاز ويده خفيفة جداً. أنصح به.', true),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Merve Yılmaz', 5, 'Harika bir doktor, çok memnun kaldım.', true),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'شركة النور للاستيراد', 4, 'خدمة جيدة ولكن التأخير بسيط في التسليم.', true),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'أم عمر', 5, 'الأكل بيشهي والكبة ولا أطيب! الله يرزقكم.', true),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'سعيد الحلبي', 5, 'استشارة قانونية دقيقة، وفر علي الكثير من المشاكل.', true);
