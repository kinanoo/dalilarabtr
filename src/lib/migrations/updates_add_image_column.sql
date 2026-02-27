-- ===================================================================
-- إضافة عمود الصورة لجدول التحديثات
-- Run once in: Supabase Dashboard → SQL Editor
-- ===================================================================

ALTER TABLE public.updates ADD COLUMN IF NOT EXISTS image TEXT;
