-- ==============================================================================
-- 🚑 EMERGENCY RLS FIX: BANNERS TABLE
-- ==============================================================================
-- إعادة تطبيق الحماية على جدول site_banners.
-- ==============================================================================

ALTER TABLE IF EXISTS public.site_banners ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Public Read All" ON public.site_banners;
DROP POLICY IF EXISTS "Admin Full Access" ON public.site_banners;

-- 1. سياسة القراءة (مفتوحة للجميع)
CREATE POLICY "Public Read All" ON public.site_banners FOR SELECT USING (true);

-- 2. سياسة الكتابة (للمشرفين authenticated فقط)
CREATE POLICY "Admin Full Access" ON public.site_banners FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- انتهى.
-- ==============================================================================
