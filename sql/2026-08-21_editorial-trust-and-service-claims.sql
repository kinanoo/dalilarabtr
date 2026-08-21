-- بنية الثقة التحريرية وطلبات إدارة صفحات مزودي الخدمات.
-- الحقول الجديدة اختيارية عمداً: لا ندّعي مراجعة رسمية لمحتوى قديم لمجرد
-- تشغيل الهجرة، ولا نغيّر شارات مزودي الخدمات الحالية.

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS audience_note text,
  ADD COLUMN IF NOT EXISTS editorial_status text,
  ADD COLUMN IF NOT EXISTS reviewed_at date,
  ADD COLUMN IF NOT EXISTS change_summary text;

COMMENT ON COLUMN public.articles.audience_note IS
  'الفئة التي تنطبق عليها التعليمات، مثل حاملي الكملك أو الإقامة؛ يظهر فقط عند تعبئته.';
COMMENT ON COLUMN public.articles.editorial_status IS
  'حالة المراجعة التحريرية الظاهرة للقارئ؛ لا تُملأ آلياً للمحتوى القديم.';
COMMENT ON COLUMN public.articles.reviewed_at IS
  'تاريخ آخر تحقق تحريري فعلي من المصدر، ويختلف عن مجرد تاريخ تعديل النص.';
COMMENT ON COLUMN public.articles.change_summary IS
  'ملخص قصير لما تغيّر في آخر مراجعة.';

CREATE TABLE IF NOT EXISTS public.service_provider_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id text NOT NULL,
  claimant_name text NOT NULL,
  whatsapp text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ip_hash text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_provider_claims_status_created_idx
  ON public.service_provider_claims (status, created_at DESC);
CREATE INDEX IF NOT EXISTS service_provider_claims_provider_idx
  ON public.service_provider_claims (provider_id, created_at DESC);

ALTER TABLE public.service_provider_claims ENABLE ROW LEVEL SECURITY;

-- لا توجد سياسة عامة مقصودة: الإدخال والقراءة يمران عبر مسارات خادم
-- محددة، بعد التحقق ومحدد السرعة، وباستخدام service role.

DO $verify$
DECLARE
  missing_columns integer;
BEGIN
  SELECT count(*) INTO missing_columns
  FROM (VALUES
    ('audience_note'), ('editorial_status'), ('reviewed_at'), ('change_summary')
  ) AS required(column_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'articles'
      AND c.column_name = required.column_name
  );

  IF missing_columns <> 0 THEN
    RAISE EXCEPTION 'editorial trust migration failed: % article columns missing', missing_columns;
  END IF;
  IF to_regclass('public.service_provider_claims') IS NULL THEN
    RAISE EXCEPTION 'service_provider_claims table was not created';
  END IF;
END
$verify$;

