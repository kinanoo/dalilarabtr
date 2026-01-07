-- ==============================================================================
-- 🚑 EMERGENCY RLS FIX: UPDATES TABLE
-- ==============================================================================
-- إعادة تطبيق الحماية على جدول updates للتأكد من عدم وجود خطأ.
-- ==============================================================================

ALTER TABLE IF EXISTS public.updates ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Public Read All" ON public.updates;
DROP POLICY IF EXISTS "Admin Full Access" ON public.updates;
DROP POLICY IF EXISTS "Admin Write Only" ON public.updates;

-- 1. سياسة القراءة (مفتوحة للجميع)
CREATE POLICY "Public Read All" ON public.updates FOR SELECT USING (true);

-- 2. سياسة الكتابة (للمشرفين authenticated فقط)
CREATE POLICY "Admin Full Access" ON public.updates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- انتهى.
-- ==============================================================================
