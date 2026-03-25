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
  is_active BOOLEAN NOT NULL DEFAULT false,           -- هل هذا المزود النشط؟
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فقط مفتاح واحد يكون نشطاً في نفس الوقت
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_provider_active
  ON ai_provider_keys (is_active) WHERE is_active = true;

-- RLS: فقط service role يمكنه الوصول (API routes تستخدم service role key)
ALTER TABLE ai_provider_keys ENABLE ROW LEVEL SECURITY;

-- لا توجد سياسات عامة — الجدول محمي بالكامل
-- الوصول فقط عبر service_role_key من API routes
