-- ===================================================================
-- Review System Fixes — إصلاح نظام التقييمات بمعايير المواقع العالمية
-- Run once in: Supabase Dashboard → SQL Editor
-- ===================================================================

-- A. إضافة user_id لجدول التقييمات (لمنع التقييم المتكرر)
ALTER TABLE service_reviews ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- فهرس فريد: مستخدم واحد = تقييم واحد لكل خدمة
-- (partial index: يتجاهل التقييمات القديمة بدون user_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_service_review
  ON service_reviews (service_id, user_id) WHERE user_id IS NOT NULL;

-- فهرس للبحث السريع عن تقييمات المستخدم
CREATE INDEX IF NOT EXISTS idx_service_reviews_user_id
  ON service_reviews (user_id) WHERE user_id IS NOT NULL;

-- B. جدول الإبلاغات عن التقييمات
CREATE TABLE IF NOT EXISTS review_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES service_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- كل مستخدم يبلّغ مرة واحدة فقط عن كل تقييم
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_review_report
  ON review_reports (review_id, user_id);

-- C. RLS لجدول الإبلاغات
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'review_reports' AND policyname = 'users_insert_own_reports'
    ) THEN
        CREATE POLICY "users_insert_own_reports" ON review_reports
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'review_reports' AND policyname = 'users_select_own_reports'
    ) THEN
        CREATE POLICY "users_select_own_reports" ON review_reports
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- D. التأكد من وجود دالة increment_helpful_count
CREATE OR REPLACE FUNCTION increment_helpful_count(review_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE service_reviews
  SET helpful_count = helpful_count + 1
  WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
