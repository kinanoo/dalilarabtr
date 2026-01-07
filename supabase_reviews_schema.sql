-- ============================================
-- 📊 نظام التقييمات والمراجعات للخدمات
-- ============================================
-- تاريخ الإنشاء: 2025-12-27
-- الغرض: السماح للمستخدمين بتقييم ومراجعة الخدمات
-- ============================================

-- ============================================
-- 1. جدول التقييمات الرئيسي
-- ============================================
CREATE TABLE IF NOT EXISTS public.service_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- معلومات الخدمة
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  
  -- معلومات المُقيّم
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT, -- اختياري للتحقق
  
  -- التقييم
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL CHECK (length(comment) >= 10), -- على الأقل 10 أحرف
  
  -- الإحصائيات
  helpful_count INTEGER DEFAULT 0,
  
  -- الحالة
  is_verified BOOLEAN DEFAULT FALSE, -- تقييم موثق
  is_approved BOOLEAN DEFAULT FALSE, -- موافقة الإدارة
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. جدول التصويت "مفيد"
-- ============================================
CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.service_reviews(id) ON DELETE CASCADE,
  voter_ip TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- منع التصويت المكرر
  UNIQUE(review_id, voter_ip)
);

-- ============================================
-- 3. Indexes للأداء
-- ============================================
CREATE INDEX IF NOT EXISTS idx_reviews_service ON public.service_reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.service_reviews(is_approved) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.service_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON public.service_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_helpful_review ON public.review_helpful_votes(review_id);

-- ============================================
-- 4. Trigger لتحديث updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_service_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reviews_timestamp 
BEFORE UPDATE ON public.service_reviews
FOR EACH ROW 
EXECUTE FUNCTION update_service_reviews_updated_at();

-- ============================================
-- 5. Function لحساب معدل التقييم
-- ============================================
CREATE OR REPLACE FUNCTION get_service_rating_stats(p_service_id TEXT)
RETURNS TABLE (
  average_rating DECIMAL,
  total_reviews BIGINT,
  rating_distribution JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(rating)::DECIMAL, 1) as average_rating,
    COUNT(*) as total_reviews,
    jsonb_build_object(
      '5', COUNT(*) FILTER (WHERE rating = 5),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '1', COUNT(*) FILTER (WHERE rating = 1)
    ) as rating_distribution
  FROM public.service_reviews
  WHERE service_id = p_service_id 
    AND is_approved = true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. Row Level Security (RLS)
-- ============================================
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- السماح بالقراءة للتقييمات المعتمدة فقط
CREATE POLICY "Allow public read approved reviews" 
ON public.service_reviews
FOR SELECT 
USING (is_approved = true);

-- السماح بإضافة تقييم جديد لأي شخص
CREATE POLICY "Allow public insert reviews" 
ON public.service_reviews
FOR INSERT 
WITH CHECK (true);

-- السماح بقراءة جميع التصويتات
CREATE POLICY "Allow public read helpful votes" 
ON public.review_helpful_votes
FOR SELECT 
USING (true);

-- السماح بالتصويت لأي شخص
CREATE POLICY "Allow public insert helpful votes" 
ON public.review_helpful_votes
FOR INSERT 
WITH CHECK (true);

-- ============================================
-- 7. View للتقييمات مع الإحصائيات
-- ============================================
CREATE OR REPLACE VIEW service_reviews_with_stats AS
SELECT 
  r.*,
  COALESCE(v.vote_count, 0) as vote_count
FROM public.service_reviews r
LEFT JOIN (
  SELECT review_id, COUNT(*) as vote_count
  FROM public.review_helpful_votes
  GROUP BY review_id
) v ON r.id = v.review_id
WHERE r.is_approved = true
ORDER BY r.created_at DESC;

-- ============================================
-- تم الانتهاء!
-- ============================================
-- 
-- الخطوات التالية:
-- 1. نفّذ هذا الملف في Supabase SQL Editor
-- 2. تحقق من إنشاء الجداول والـ Functions
-- 3. انتقل لإنشاء Components
-- ============================================
