-- =============================================
-- تطوير جدول الأكواد الأمنية
-- إضافة: كيفية الرفع + مدة الحظر + أكواد مرتبطة
-- =============================================

ALTER TABLE public.security_codes
  ADD COLUMN IF NOT EXISTS how_to_remove TEXT,
  ADD COLUMN IF NOT EXISTS duration TEXT,
  ADD COLUMN IF NOT EXISTS related_codes TEXT[];
