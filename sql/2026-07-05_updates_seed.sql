-- ============================================================================
-- Seed the (empty) `updates` table so /updates is no longer blank
-- ============================================================================
-- These are ACCURATE, evergreen announcements about the site's own new features
-- + safety reminders (no external facts to verify → safe to publish live).
-- They make /updates useful and give visitors a reason to return.
--
-- Idempotent: each row is inserted only if an update with the same title does
-- not already exist. Run in Supabase → SQL Editor. Delete any you don't want
-- from لوحة التحكم → التحديثات.
--
-- NOTE: inserting here does NOT send a push notification (push is triggered by
-- the admin "نشر تحديث" form, not the DB). To also push, re-post from admin.
-- ============================================================================

INSERT INTO updates (title, type, content, date, link, active)
-- `date` column is of type DATE; cast the text literal so the VALUES→SELECT
-- type-inference does not fail with "column date is of type date but
-- expression is of type text" (error 42804).
SELECT title, type, content, date::date, link, active FROM (VALUES
  (
    $$أداة جديدة: حاسبة أيام الإقامة والغياب عن تركيا$$,
    $$news$$,
    $$أطلقنا حاسبة مجانية تحسب مجموع أيام غيابك عن تركيا وأطول فترة غياب — لمساعدتك على متابعة شرط الإقامة المتّصلة عند التقديم على الجنسية أو الإقامة طويلة الأمد. أدخل تواريخ سفرك واحصل على المجموع فوراً.$$,
    $$2026-07-05$$,
    $$/tools/residence-calculator$$,
    true
  ),
  (
    $$جديد: دليل العرب حسب المدن في تركيا$$,
    $$news$$,
    $$أضفنا صفحات لكل مدينة تجمع لك في مكان واحد: مقدّمي الخدمات العرب، حالة الأحياء المغلقة لتسجيل الأجانب، وأدلّة الإقامة والعمل — لإسطنبول، غازي عنتاب، أنقرة، بورصة وكل المدن. تصفّح مدينتك مباشرة.$$,
    $$2026-07-05$$,
    $$/city$$,
    true
  ),
  (
    $$قبل استئجار سكن: تأكّد أن الحيّ مفتوح لتسجيل الأجانب$$,
    $$news$$,
    $$بعض الأحياء مغلقة أمام تسجيل عنوان الأجانب في دائرة النفوس. قبل توقيع عقد الإيجار أو الشراء، افحص اسم الحيّ عبر أداة المناطق المحظورة لتجنّب مشاكل تثبيت السكن والإقامة.$$,
    $$2026-07-05$$,
    $$/zones$$,
    true
  ),
  (
    $$تواصل مع أي خدمة عربية موثوقة عبر واتساب مباشرة$$,
    $$news$$,
    $$دليل الخدمات يضمّ أطباء ومحامين ومترجمين وعقارات ومهنيّين عرباً في كل مدن تركيا، مع تواصل مباشر عبر واتساب. اختر مدينتك وتخصّصك وابدأ التواصل.$$,
    $$2026-07-05$$,
    $$/services$$,
    true
  )
) AS v(title, type, content, date, link, active)
WHERE NOT EXISTS (SELECT 1 FROM updates u WHERE u.title = v.title);

-- Done. Check /updates + لوحة التحكم → التحديثات.
