-- ============================================
-- جدول مفاتيح مزودات الذكاء الاصطناعي
-- AI Provider Keys Table
-- ============================================
-- شغّل هذا الاستعلام في Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ai_provider_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'gemini',           -- gemini | openai | anthropic | openrouter
  api_key TEXT NOT NULL,                              -- المفتاح (مخزن كنص)
  model_default TEXT NOT NULL DEFAULT 'gemini-2.5-flash',  -- الموديل الافتراضي (سريع)
  model_deep TEXT NOT NULL DEFAULT 'gemini-2.5-pro',       -- موديل التفكير العميق
  label TEXT NOT NULL DEFAULT '',                     -- تسمية المفتاح (للعرض)
  is_active BOOLEAN NOT NULL DEFAULT false,           -- (لم يعد مستخدماً — كل المفاتيح نشطة)
  priority INTEGER NOT NULL DEFAULT 0,                -- الأولوية: الأصغر يُجرّب أولاً
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: فقط service role يمكنه الوصول (API routes تستخدم service role key)
ALTER TABLE ai_provider_keys ENABLE ROW LEVEL SECURITY;

-- لا توجد سياسات عامة — الجدول محمي بالكامل
-- الوصول فقط عبر service_role_key من API routes
