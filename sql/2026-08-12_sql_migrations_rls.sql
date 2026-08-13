-- ============================================================================
-- تفعيل RLS على جدول سجل الملفات (2026-08-12)
--
-- الدافع: نبّه Supabase عند إنشاء public.sql_migrations أنه بلا Row Level
-- Security. أي جدول في مخطط public يُعرَض عبر PostgREST، فالمفتاح العام (anon)
-- كان يستطيع قراءة أسماء كل ملفات الترحيل وبصماتها. ليست بيانات حسّاسة بذاتها،
-- لكنها تكشف بنية داخلية بلا أي مقابل — لا واجهة في الموقع تقرأ هذا الجدول.
--
-- التفعيل بلا سياسات = لا أحد يقرأ أو يكتب عبر الـAPI العام. و«دور الخدمة»
-- (service_role) الذي يستخدمه الـworkflow يتجاوز RLS بحكم تصميمه، فالتطبيق
-- الآلي يبقى يعمل كما هو.
--
-- شغّله مرّة واحدة. آمن لإعادة التشغيل.
-- ============================================================================

ALTER TABLE public.sql_migrations ENABLE ROW LEVEL SECURITY;

-- بلا سياسات عمداً: الجدول داخلي بحت، ولا شيء في الموقع يقرأه.
-- إضافة أي سياسة لاحقاً تحتاج مبرّراً صريحاً.

-- ─── تحقّق نهائي ───
DO $check$
DECLARE
  rls_on   boolean;
  n_policy integer;
BEGIN
  SELECT c.relrowsecurity INTO rls_on
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'sql_migrations';

  IF rls_on IS NULL THEN
    RAISE EXCEPTION 'FAILED: جدول public.sql_migrations غير موجود — شغّل ملف التهيئة أولاً';
  END IF;
  IF NOT rls_on THEN
    RAISE EXCEPTION 'FAILED: RLS لم يُفعَّل على public.sql_migrations';
  END IF;

  SELECT COUNT(*) INTO n_policy FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'sql_migrations';

  RAISE NOTICE 'OK: RLS مفعّل على sql_migrations، وعدد السياسات % (صفر مقصود).', n_policy;
END
$check$;
