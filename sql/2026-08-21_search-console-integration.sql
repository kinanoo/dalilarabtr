-- تخزين تكاملات الأدمن الحساسة بعد تشفيرها في الخادم.
CREATE TABLE IF NOT EXISTS public.site_integrations (
  name text PRIMARY KEY,
  encrypted_value text NOT NULL,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_integrations ENABLE ROW LEVEL SECURITY;
-- لا سياسات عامة: الوصول حصراً عبر service role بعد بوابة الأدمن.

DO $verify$
BEGIN
  IF to_regclass('public.site_integrations') IS NULL THEN
    RAISE EXCEPTION 'site_integrations table was not created';
  END IF;
END
$verify$;

