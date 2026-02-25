-- Add slug column to articles table for short, SEO-friendly URLs
-- Run this ONCE in Supabase SQL Editor

-- =============================================
-- الخطوة 1: إضافة عمود slug
-- =============================================
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- =============================================
-- الخطوة 2: إنشاء فهرس فريد (unique index)
-- =============================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_slug_unique
  ON public.articles (slug)
  WHERE slug IS NOT NULL;

-- =============================================
-- الخطوة 3: المقالات ذات ID إنجليزي → نسخ ID كـ slug
-- =============================================
UPDATE public.articles
SET slug = id
WHERE id ~ '^[a-zA-Z0-9\-_]+$'
  AND slug IS NULL;

-- =============================================
-- الخطوة 4: المقالات ذات ID عربي → توليد slug تلقائي
-- يعتمد على القسم (category) + رقم تسلسلي
-- مثال: edevlet-1, residence-2, health-3
-- =============================================
UPDATE public.articles
SET slug = sub.new_slug
FROM (
  SELECT
    id,
    CASE
      WHEN category = 'e-Devlet'                  THEN 'edevlet'
      WHEN category = 'إقامات'                     THEN 'residence'
      WHEN category = 'أنواع الإقامات'              THEN 'residence'
      WHEN category = 'الإقامة والأوراق'            THEN 'residence'
      WHEN category = 'معاملات رسمية'              THEN 'official'
      WHEN category = 'الحياة اليومية'              THEN 'daily'
      WHEN category = 'السكن والحياة'              THEN 'housing'
      WHEN category = 'العمل والاستثمار'            THEN 'work'
      WHEN category = 'العمل والدخل'               THEN 'work'
      WHEN category = 'الدراسة والتعليم'            THEN 'education'
      WHEN category = 'الصحة والتأمين'             THEN 'health'
      WHEN category = 'الفيزا والتأشيرات'           THEN 'visa'
      WHEN category = 'خدمات السوريين'             THEN 'syrians'
      WHEN category = 'الكملك والحماية المؤقتة'     THEN 'kimlik'
      WHEN category = 'أفكار مشاريع'               THEN 'business'
      WHEN category = 'خدمات e-Devlet'             THEN 'edevlet'
      ELSE 'article'
    END
    || '-'
    || ROW_NUMBER() OVER (
        PARTITION BY category
        ORDER BY created_at ASC
      )
    AS new_slug
  FROM public.articles
  WHERE slug IS NULL
) sub
WHERE articles.id = sub.id;
