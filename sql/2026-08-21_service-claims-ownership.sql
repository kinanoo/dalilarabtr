-- ربط مطالبة صفحة مزود الخدمة بحساب عضو حقيقي، حتى يؤدي اعتماد الأدمن
-- إلى نقل إدارة الصفحة فعلياً بدلاً من تغيير شارة فقط.

ALTER TABLE public.service_provider_claims
  ADD COLUMN IF NOT EXISTS claimant_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS service_provider_claims_claimant_user_idx
  ON public.service_provider_claims (claimant_user_id, created_at DESC);

DO $verify$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'service_provider_claims'
      AND column_name = 'claimant_user_id'
  ) THEN
    RAISE EXCEPTION 'claimant_user_id was not created';
  END IF;
END
$verify$;
