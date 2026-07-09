-- ============================================================================
-- ترقية صفحة الأخبار (النسخة 2) — News page redesign (v2)
-- ============================================================================
-- هذا الملف يشغّل التصميم الجديد لصفحة الأخبار وغرفة الأخبار في لوحة التحكم:
--   * category    : تصنيف الخبر (official / residence / work / education /
--                    health / security / general) — يظهر كفلاتر في الصفحة العامة.
--   * summary     : خلاصة من سطرين تظهر في قائمة الأخبار بدل اقتصاص المحتوى.
--   * source_url  : رابط المصدر الرسمي (شفافية + مصداقية).
--   * source_name : اسم المصدر، مثل «إدارة الهجرة».
--   * pinned      : تثبيت الخبر كخبر أبرز في أعلى الصفحة.
--
-- This migration powers the news page redesign + the admin "newsroom" composer.
-- It adds optional columns to public.updates; the UI tolerates their absence,
-- but the new fields (category filters, summaries, sources, pinned hero) only
-- work after running this file.
--
-- شغّله مرّة واحدة في Supabase ← SQL Editor.
-- آمن للتشغيل أكثر من مرّة (IF NOT EXISTS). / Safe to re-run (idempotent).
-- ============================================================================

ALTER TABLE public.updates ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.updates ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE public.updates ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.updates ADD COLUMN IF NOT EXISTS source_name text;
ALTER TABLE public.updates ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false;

-- الأخبار القديمة بلا تصنيف تُعتبر «عام» / Backfill old rows as 'general'.
UPDATE public.updates SET category = 'general' WHERE category IS NULL;

-- فهرس لتسريع قائمة الأخبار العامة (active + أحدث تاريخ أولاً).
-- Index for the public news listing (active rows ordered by newest date).
CREATE INDEX IF NOT EXISTS idx_updates_active_date ON public.updates (active, date DESC);
