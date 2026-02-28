-- ==============================================================================
-- 🚑 RLS FIX: BANNERS TABLE (site_banners)
-- ==============================================================================
-- سياسات الأمان لجدول البنرات — القراءة للجميع، الكتابة مفتوحة لإدارة الأدمن
-- ==============================================================================

ALTER TABLE IF EXISTS public.site_banners ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Public Read All" ON public.site_banners;
DROP POLICY IF EXISTS "Admin Full Access" ON public.site_banners;
DROP POLICY IF EXISTS "anon_full_access_banners" ON public.site_banners;

-- 1. سياسة القراءة (مفتوحة للجميع)
CREATE POLICY "Public Read All"
    ON public.site_banners FOR SELECT USING (true);

-- 2. سياسة الكتابة (anon + authenticated)
CREATE POLICY "anon_full_access_banners"
    ON public.site_banners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- انتهى.
-- ==============================================================================
