-- ============================================================================
-- مفتاح إظهار/إخفاء عدّاد القرّاء (2026-08-05)
-- ============================================================================
-- صاحب الموقع طلب إخفاء رقم القرّاء أعلى المقال: الموقع جديد، والأرقام
-- الحقيقية صغيرة، وعرض «قرأه 12» يقرأه الزائر كإشارة ضعف لا قوّة.
--
-- ما يفعله هذا الملف: يضيف عموداً واحداً `show_view_counts` إلى site_settings،
-- ويجعله false — أي العدّاد مخفيّ منذ اللحظة الأولى. يُبدَّل من صفحة الإعدادات
-- في لوحة التحكم متى شئت.
--
-- ملاحظة مهمّة: الإخفاء لا يوقف العدّ. عمود articles.views يستمرّ في التراكم
-- كما هو، وتراه أنت في لوحة التحكم — الذي يتوقّف هو نشر الرقم للزائر فقط.
-- فحين يكبر الموقع تُشغّل المفتاح وتظهر أرقام حقيقية متراكمة منذ اليوم، لا
-- أرقام تبدأ من الصفر.
--
-- وفي نفس الدفعة أُزيلت من الشيفرة «بذرة» ثابتة كانت تُضاف إلى الرقم المعروض
-- (25–48 حسب معرّف المقال) حتى لا يظهر مقال بصفر قراءات. أي أنّ الرقم الذي كان
-- يراه الزائر لم يكن عدد قرّاء المقال أصلاً. الرقم الآن هو المسجَّل فعلاً.
--
-- آمن لإعادة التشغيل. شغّله مرّة واحدة في Supabase ← SQL Editor.
-- ============================================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS show_view_counts BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.site_settings.show_view_counts IS
  'هل يرى الزائر عدّاد القرّاء أعلى المقال. العدّ مستمرّ في كل الأحوال؛ هذا يتحكّم بالعرض فقط.';

-- الصفّ الوحيد (id = 1) هو ما يقرأه الموقع.
INSERT INTO public.site_settings (id, show_view_counts)
VALUES (1, false)
ON CONFLICT (id) DO UPDATE SET show_view_counts = COALESCE(public.site_settings.show_view_counts, false);

-- ─── تحقّق — يرمي خطأً إن لم يُضف العمود ───
DO $check$
DECLARE
  has_col boolean;
  val     boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'site_settings'
      AND column_name  = 'show_view_counts'
  ) INTO has_col;

  IF NOT has_col THEN
    RAISE EXCEPTION 'فشل: العمود show_view_counts غير موجود.';
  END IF;

  SELECT show_view_counts INTO val FROM public.site_settings WHERE id = 1;
  RAISE NOTICE 'نجح: العمود مضاف، والقيمة الحالية = %  (false تعني العدّاد مخفيّ).', val;
END
$check$;

-- ─── مراجعة ───
SELECT id, show_view_counts AS عدّاد_القرّاء_ظاهر, contact_enabled AS التواصل_مفتوح
FROM public.site_settings
WHERE id = 1;
-- ============================================================================
