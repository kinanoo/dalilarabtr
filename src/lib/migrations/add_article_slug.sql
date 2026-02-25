-- Add slug column to articles table for short, SEO-friendly URLs
-- Run this in Supabase SQL Editor

-- 1. Add slug column
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Create unique index on slug (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_slug_unique
  ON public.articles (slug)
  WHERE slug IS NOT NULL;

-- 3. Backfill: copy id to slug for articles that already have English-like IDs
-- (articles with purely ASCII IDs like 'tourist-residence' already have good slugs)
UPDATE public.articles
SET slug = id
WHERE id ~ '^[a-zA-Z0-9\-_]+$'
  AND slug IS NULL;
