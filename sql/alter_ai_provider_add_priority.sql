-- شغّل هذا إذا الجدول موجود مسبقاً لإضافة عمود الأولوية
-- Run this if table already exists to add priority column

ALTER TABLE ai_provider_keys ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0;

-- حذف القيد القديم (مفتاح واحد نشط فقط) لأننا الآن نستخدم كل المفاتيح
DROP INDEX IF EXISTS idx_ai_provider_active;
