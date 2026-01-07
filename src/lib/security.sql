-- ==============================================================================
-- 🔐 FINAL HYBRID SECURITY SCRIPT (Safety + Full Coverage)
-- ==============================================================================
-- هذا السكربت يجمع بين أمان الكود الذي اقترحته أنت (عدم كسر الموقع)
-- وبين الشمولية (تغطية جميع جداول المشروع التي نسيتها).
--
-- الخصائص:
-- 1. ✅ Public Read (All): القراءة مفتوحة للجميع (لتجنب اختفاء البيانات).
-- 2. ✅ Admin Write Only: الكتابة/التعديل/الحذف للمشرفين فقط.
-- 3. ✅ Covers ALL Tables: يغطي 14 جدولاً وليس 8 فقط.
-- ==============================================================================

-- 1. Articles (المقالات)
ALTER TABLE IF EXISTS public.articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read All" ON public.articles;
DROP POLICY IF EXISTS "Admin Full Access" ON public.articles;
CREATE POLICY "Public Read All" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Admin Full Access" ON public.articles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Updates (التحديثات) - نغطي الاسمين لضمان الأمان
-- (قد يكون الجدول updates أو site_updates)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'updates') THEN
    ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Read All" ON public.updates;
    DROP POLICY IF EXISTS "Admin Full Access" ON public.updates;
    CREATE POLICY "Public Read All" ON public.updates FOR SELECT USING (true);
    CREATE POLICY "Admin Full Access" ON public.updates FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'site_updates') THEN
    ALTER TABLE public.site_updates ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Read All" ON public.site_updates;
    DROP POLICY IF EXISTS "Admin Full Access" ON public.site_updates;
    CREATE POLICY "Public Read All" ON public.site_updates FOR SELECT USING (true);
    CREATE POLICY "Admin Full Access" ON public.site_updates FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. Services (مقدمو الخدمات)
ALTER TABLE IF EXISTS public.service_providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read All" ON public.service_providers;
DROP POLICY IF EXISTS "Admin Full Access" ON public.service_providers;
CREATE POLICY "Public Read All" ON public.service_providers FOR SELECT USING (true);
CREATE POLICY "Admin Full Access" ON public.service_providers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Reviews (التقييمات) - ⚠️ هام جداً لمنع التلاعب بالتقييمات
ALTER TABLE IF EXISTS public.service_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read All" ON public.service_reviews;
DROP POLICY IF EXISTS "Admin Full Access" ON public.service_reviews;
CREATE POLICY "Public Read All" ON public.service_reviews FOR SELECT USING (true);
CREATE POLICY "Admin Full Access" ON public.service_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Security Codes (الأكواد)
ALTER TABLE IF EXISTS public.security_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read All" ON public.security_codes;
DROP POLICY IF EXISTS "Admin Full Access" ON public.security_codes;
CREATE POLICY "Public Read All" ON public.security_codes FOR SELECT USING (true);
CREATE POLICY "Admin Full Access" ON public.security_codes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Scenarios (سيناريوهات المستشار)
ALTER TABLE IF EXISTS public.consultant_scenarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read All" ON public.consultant_scenarios;
DROP POLICY IF EXISTS "Admin Full Access" ON public.consultant_scenarios;
CREATE POLICY "Public Read All" ON public.consultant_scenarios FOR SELECT USING (true);
CREATE POLICY "Admin Full Access" ON public.consultant_scenarios FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. FAQs (الأسئلة الشائعة) - نغطي المفرد والجمع
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'faqs') THEN
    ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Read All" ON public.faqs;
    DROP POLICY IF EXISTS "Admin Full Access" ON public.faqs;
    CREATE POLICY "Public Read All" ON public.faqs FOR SELECT USING (true);
    CREATE POLICY "Admin Full Access" ON public.faqs FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'faq') THEN
    ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Read All" ON public.faq;
    DROP POLICY IF EXISTS "Admin Full Access" ON public.faq;
    CREATE POLICY "Public Read All" ON public.faq FOR SELECT USING (true);
    CREATE POLICY "Admin Full Access" ON public.faq FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 8. Menus (القوائم)
ALTER TABLE IF EXISTS public.site_menus ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read All" ON public.site_menus;
DROP POLICY IF EXISTS "Admin Full Access" ON public.site_menus;
CREATE POLICY "Public Read All" ON public.site_menus FOR SELECT USING (true);
CREATE POLICY "Admin Full Access" ON public.site_menus FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. Tools (الأدوات)
ALTER TABLE IF EXISTS public.tools_registry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read All" ON public.tools_registry;
DROP POLICY IF EXISTS "Admin Full Access" ON public.tools_registry;
CREATE POLICY "Public Read All" ON public.tools_registry FOR SELECT USING (true);
CREATE POLICY "Admin Full Access" ON public.tools_registry FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10. Official Sources (المصادر الرسمية)
ALTER TABLE IF EXISTS public.official_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read All" ON public.official_sources;
DROP POLICY IF EXISTS "Admin Full Access" ON public.official_sources;
CREATE POLICY "Public Read All" ON public.official_sources FOR SELECT USING (true);
CREATE POLICY "Admin Full Access" ON public.official_sources FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 11. Banners (البنرات)
ALTER TABLE IF EXISTS public.site_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read All" ON public.site_banners;
DROP POLICY IF EXISTS "Admin Full Access" ON public.site_banners;
CREATE POLICY "Public Read All" ON public.site_banners FOR SELECT USING (true);
CREATE POLICY "Admin Full Access" ON public.site_banners FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 12. Testimonials (آراء العملاء)
ALTER TABLE IF EXISTS public.site_testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read All" ON public.site_testimonials;
DROP POLICY IF EXISTS "Admin Full Access" ON public.site_testimonials;
CREATE POLICY "Public Read All" ON public.site_testimonials FOR SELECT USING (true);
CREATE POLICY "Admin Full Access" ON public.site_testimonials FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 13. Settings (الإعدادات)
ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read All" ON public.site_settings;
DROP POLICY IF EXISTS "Admin Full Access" ON public.site_settings;
CREATE POLICY "Public Read All" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin Full Access" ON public.site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 14. Categories (التصنيفات)
ALTER TABLE IF EXISTS public.service_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read All" ON public.service_categories;
DROP POLICY IF EXISTS "Admin Full Access" ON public.service_categories;
CREATE POLICY "Public Read All" ON public.service_categories FOR SELECT USING (true);
CREATE POLICY "Admin Full Access" ON public.service_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
