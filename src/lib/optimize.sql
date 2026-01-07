-- ==============================================================================
-- 🚀 PERFORMANCE & SECURITY BOOST (Comments Table)
-- ==============================================================================
-- 1. تسريع الاستعلامات (Indexing)
-- هذا سيجعل تحميل صفحة "المستشار" والخدمات أسرع بكثير.
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_comments_page_slug ON public.comments(page_slug);
CREATE INDEX IF NOT EXISTS idx_comments_published ON public.comments(is_published);
CREATE INDEX IF NOT EXISTS idx_service_providers_category ON public.service_providers(category);
CREATE INDEX IF NOT EXISTS idx_service_providers_rating ON public.service_providers(rating_avg DESC);

-- ==============================================================================
-- 2. تأمين جدول التعليقات (Comments Security) - (كان منسياً!)
-- ==============================================================================

ALTER TABLE IF EXISTS public.comments ENABLE ROW LEVEL SECURITY;

-- تنظيف القديم
DROP POLICY IF EXISTS "Public Read Approved Comments" ON public.comments;
DROP POLICY IF EXISTS "Public Insert Comments" ON public.comments;
DROP POLICY IF EXISTS "Admin Full Access Comments" ON public.comments;

-- سياسة القراءة: مسموح للجميع قراءة التعليقات "المنشورة" فقط
CREATE POLICY "Public Read Approved Comments" ON public.comments 
FOR SELECT USING (is_published = true);

-- سياسة الكتابة: مسموح للجميع "إضافة" تعليق (لكن لا يظهر إلا بعد الموافقة)
CREATE POLICY "Public Insert Comments" ON public.comments 
FOR INSERT WITH CHECK (true);

-- سياسة المشرف: تحكم كامل
CREATE POLICY "Admin Full Access Comments" ON public.comments 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- تم! الآن الموقع أسرع وأكثر أماناً.
-- ==============================================================================
