-- ============================================
-- 🗄️ Supabase Database Schema للمرحلة 3
-- ============================================
-- 
-- هذا الملف يحتوي على جميع الجداول المطلوبة
-- لنقل البيانات من الملفات الثابتة إلى Supabase
--
-- تاريخ الإنشاء: 2025-12-27
-- ============================================

-- ============================================
-- 1. جدول المقالات (Articles)
-- ============================================
CREATE TABLE IF NOT EXISTS public.articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  intro TEXT,
  details TEXT,
  steps TEXT[], -- مصفوفة نصوص
  documents TEXT[],
  tips TEXT[],
  fees TEXT,
  warning TEXT,
  source TEXT,
  last_update TEXT,
  image TEXT,
  image_alt TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_active ON public.articles(is_active);
CREATE INDEX IF NOT EXISTS idx_articles_created ON public.articles(created_at DESC);

-- ============================================
-- 2. جدول الأسئلة الشائعة (FAQ)
-- ============================================
CREATE TABLE IF NOT EXISTS public.faq (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  tags TEXT[],
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index للبحث والترتيب
CREATE INDEX IF NOT EXISTS idx_faq_category ON public.faq(category);
CREATE INDEX IF NOT EXISTS idx_faq_active ON public.faq(is_active);
CREATE INDEX IF NOT EXISTS idx_faq_order ON public.faq(category, order_index);

-- ============================================
-- 3. جدول سيناريوهات المستشار (Consultant Scenarios)
-- ============================================
CREATE TABLE IF NOT EXISTS public.consultant_scenarios (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  steps TEXT[],
  documents TEXT[],
  cost TEXT,
  risk_level TEXT, -- 'safe', 'medium', 'high', 'critical'
  legal_info TEXT,
  tips TEXT,
  last_update TEXT,
  sources JSONB, -- مصفوفة JSON للمصادر
  article_id TEXT,
  link TEXT,
  kb_query TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index للبحث
CREATE INDEX IF NOT EXISTS idx_consultant_active ON public.consultant_scenarios(is_active);
CREATE INDEX IF NOT EXISTS idx_consultant_risk ON public.consultant_scenarios(risk_level);

-- ============================================
-- 4. جدول الأكواد الأمنية (Security Codes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.security_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  severity TEXT, -- 'critical', 'high', 'medium', 'low', 'safe'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index للبحث السريع بالكود
CREATE INDEX IF NOT EXISTS idx_codes_code ON public.security_codes(code);
CREATE INDEX IF NOT EXISTS idx_codes_severity ON public.security_codes(severity);
CREATE INDEX IF NOT EXISTS idx_codes_category ON public.security_codes(category);

-- ============================================
-- 5. Trigger لتحديث updated_at تلقائياً
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- تطبيق على كل الجداول
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faq_updated_at BEFORE UPDATE ON public.faq
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultant_updated_at BEFORE UPDATE ON public.consultant_scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_codes_updated_at BEFORE UPDATE ON public.security_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Row Level Security (RLS) - أمان إضافي
-- ============================================
-- تفعيل RLS على كل الجداول
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_codes ENABLE ROW LEVEL SECURITY;

-- السماح بالقراءة للجميع (للبيانات النشطة فقط)
CREATE POLICY "Allow public read access" ON public.articles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read access" ON public.faq
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read access" ON public.consultant_scenarios
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read access" ON public.security_codes
    FOR SELECT USING (is_active = true);

-- ملاحظة: الكتابة محمية - تحتاج service_role key

-- ============================================
-- تم الانتهاء من Schema!
-- ============================================
-- 
-- الخطوات التالية:
-- 1. نفّذ هذا الملف في Supabase SQL Editor
-- 2. تحقق من إنشاء الجداول
-- 3. انتقل للمرحلة 2 (Migration Scripts)
-- ============================================
