
-- =============================================
-- 🛠️ استعادة بيانات القوائم (Restore Navbar & Menus)
-- =============================================

-- تنظيف مسبق (لضمان عدم التكرار إذا تم تشغيله مرتين)
truncate table site_menus;
truncate table service_categories;
truncate table tools_registry;

-- 1. إضافة قوائم الهيدر (Header Menus)
insert into site_menus (label, href, icon, location, sort_order, is_active) values
('الرئيسية', '/', 'Home', 'header', 0, true),
('خدمات', '/services', 'Briefcase', 'header', 1, true),
('المستشار الذكي', '/consultant', 'BrainCircuit', 'header', 2, true);

-- 2. إضافة قوائم الفوتر/الجانبية (Footer/Sidebar Menus)
insert into site_menus (label, href, icon, location, sort_order, is_active) values
('الرئيسية', '/', 'Home', 'footer', 0, true),
('المستشار', '/consultant', 'BrainCircuit', 'footer', 1, true),
('اطلب خدمة', '/services', 'Briefcase', 'footer', 2, true),
('خدمات السوريين', '/category/syrians', 'Building2', 'footer', 3, true),
('خدمات e-Devlet', '/e-devlet-services', 'Smartphone', 'footer', 4, true),
('دليل الأكواد', '/codes', 'ShieldAlert', 'footer', 5, true),
('الدليل الشامل', '/directory', 'FolderOpen', 'footer', 6, true),
('الإقامات', '/category/residence', 'FileText', 'footer', 7, true),
('المناطق المحظورة', '/zones', 'MapPin', 'footer', 8, true),
('الأسئلة الشائعة', '/faq', 'BookOpen', 'footer', 9, true),
('حاسبة المنع', '/ban-calculator', 'Calculator', 'footer', 10, true);

-- 3. إضافة التصنيفات (Service Categories)
insert into service_categories (slug, title, description, is_featured, sort_order, active) values
('residence', 'أنواع الإقامات', 'دليل شامل لجميع بالإقامات في تركيا', true, 0, true),
('kimlik', 'الكملك والحماية المؤقتة', 'كل ما يخص الكملك والهجرة', true, 1, true),
('visa', 'الفيزا والتأشيرات', 'معلومات التأشيرات ودخول تركيا', true, 2, true),
('syrians', 'خدمات السوريين', 'خدمات خاصة بالسوريين في تركيا', true, 3, true),
('housing', 'السكن والحياة', 'نصائح السكن والمعيشة', false, 4, true),
('work', 'العمل والاستثمار', 'إذن العمل وتأسيس الشركات', false, 5, true),
('education', 'الدراسة والتعليم', 'المدارس والجامعات في تركيا', false, 6, true),
('health', 'الصحة والتأمين', 'المشافي والتأمين الصحي', false, 7, true),
('official', 'معاملات رسمية', 'النوتر، النفوس، والدوائر الحكومية', false, 8, true),
('edevlet', 'خدمات e-Devlet', 'شروحات بوابة الحكومة الإلكترونية', true, 9, true);

-- 4. إضافة الأدوات (Tools Registry)
insert into tools_registry (key, name, route, is_active) values
('kimlik-check', 'فحص الكملك', '/tools/kimlik-check', true),
('ban-calculator', 'حاسبة المنع', '/ban-calculator', true),
('residence-calculator', 'حاسبة تكاليف الإقامة', '/calculator', true),
('codes', 'رموز المنع (الأكواد)', '/codes', true),
('zones', 'المناطق المحظورة', '/zones', true),
('pharmacy', 'الصيدليات المناوبة', '/tools/pharmacy', true);

-- تأكيد: تم استعادة البيانات بنجاح!
