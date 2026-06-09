-- =====================================================================
-- NEWS TICKER CONTENT FIX — 2026-06-09
-- =====================================================================
-- Fixes the news strip at the top of every page:
--   1. The only existing entry said "رُفع الحظر عن ١٦٠ حياً" — wrong
--      number (real is 94 reopened) and Eastern-Arabic digits.
--   2. Adds 3 more entries so the strip has content variety.
--
-- Numbers verified from a live count of public.zones (2026-06-09):
--   - reopened: 94 = İstanbul 50 + Şanlıurfa 30 + Konya 14
--   - closed:   823 across most provinces
--   - pending:  83 in Kilis
--
-- Run once in Supabase Dashboard → SQL Editor → New Query → paste → Run.
-- =====================================================================

-- ─── 1. Fix the existing entry's text + link ─────────────────────────
UPDATE public.news_ticker
SET
    text = 'تم رفع الحظر عن 94 حياً جديداً — إسطنبول وقونيا وشانلي أورفا',
    link = '/zones',
    priority = 1,
    is_active = true
WHERE text LIKE '%رُفع الحظر عن%' OR text LIKE '%160%' OR text LIKE '%١٦٠%';

-- ─── 2. Add 3 more curated entries (clarifies the picture) ──────────
-- ON CONFLICT DO NOTHING means re-running this script is safe.
INSERT INTO public.news_ticker (text, link, priority, is_active) VALUES
    ('إسطنبول: 50 حياً متاحاً للتسجيل، 5 أحياء فقط ما زالت مغلقة', '/zones/%C4%B0stanbul', 2, true),
    ('شانلي أورفا: 30 حياً مفتوحاً للتسجيل من جديد', '/zones/%C5%9Eanl%C4%B1urfa', 3, true),
    ('كيليس: 83 حياً قيد المراجعة الرسمية', '/zones/Kilis', 4, true)
ON CONFLICT DO NOTHING;

-- ─── 3. Verify ───────────────────────────────────────────────────────
SELECT priority, text, link, is_active
FROM public.news_ticker
WHERE is_active = true
ORDER BY priority ASC;

-- =====================================================================
-- Expected output (4 rows):
--   1 | تم رفع الحظر عن 94 حياً جديداً — إسطنبول وقونيا وشانلي أورفا
--   2 | إسطنبول: 50 حياً متاحاً للتسجيل، 5 أحياء فقط ما زالت مغلقة
--   3 | شانلي أورفا: 30 حياً مفتوحاً للتسجيل من جديد
--   4 | كيليس: 83 حياً قيد المراجعة الرسمية
-- =====================================================================
