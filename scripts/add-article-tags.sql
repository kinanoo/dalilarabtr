-- =============================================
-- إضافة عمود التصنيفات الفرعية (Tags) لجدول المقالات
-- يُشغّل في Supabase SQL Editor
-- آمن: عمود جديد بقيمة افتراضية فارغة، لا يؤثر على أي شيء موجود
-- =============================================

-- 1. إضافة العمود
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. إنشاء فهرس GIN للبحث السريع في المصفوفة
CREATE INDEX IF NOT EXISTS idx_articles_tags ON public.articles USING GIN (tags);

-- تم! الآن يمكن استخدام:
-- SELECT * FROM articles WHERE tags @> ARRAY['consulate'];
-- أو عبر Supabase: .contains('tags', ['consulate'])
