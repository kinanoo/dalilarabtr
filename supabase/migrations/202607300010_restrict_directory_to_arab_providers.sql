-- The first two research batches used Arabic-language availability as the
-- inclusion criterion. The directory is restricted to providers that
-- explicitly identify as Arab/Syrian businesses or providers in Turkey.
-- Preserve the audit trail, but remove those unproven rows from public view.

DO $$
DECLARE
  hidden_count integer;
BEGIN
  WITH target_batches AS (
    SELECT id
    FROM public.service_import_batches
    WHERE label IN (
      'الدفعة الأولى - إسطنبول وغازي عنتاب ومرسين وإزمير - 2026-07-27',
      'الدفعة الثانية - أنقرة وأنطاليا وأضنة وبورصة - 2026-07-30'
    )
  ),
  target_providers AS (
    SELECT DISTINCT c.duplicate_provider_id AS provider_id
    FROM public.service_provider_candidates c
    JOIN target_batches b ON b.id = c.batch_id
    WHERE c.duplicate_provider_id IS NOT NULL
  )
  UPDATE public.service_providers p
  SET
    status = 'rejected',
    active = false,
    is_verified = false,
    verification_level = 'listed',
    updated_at = now()
  WHERE p.id IN (SELECT provider_id FROM target_providers)
    AND p.status = 'approved';

  GET DIAGNOSTICS hidden_count = ROW_COUNT;
  IF hidden_count <> 36 THEN
    RAISE EXCEPTION
      'Expected to hide 36 language-only research providers, hid %',
      hidden_count;
  END IF;
END $$;

WITH target_batches AS (
  SELECT id
  FROM public.service_import_batches
  WHERE label IN (
    'الدفعة الأولى - إسطنبول وغازي عنتاب ومرسين وإزمير - 2026-07-27',
    'الدفعة الثانية - أنقرة وأنطاليا وأضنة وبورصة - 2026-07-30'
  )
)
UPDATE public.service_provider_candidates c
SET
  status = 'rejected',
  review_notes = 'أُلغي النشر: توفر اللغة العربية لا يثبت أن المزود أو النشاط عربي',
  updated_at = now()
WHERE c.batch_id IN (SELECT id FROM target_batches);

UPDATE public.service_import_batches
SET
  status = 'cancelled',
  stats = stats || jsonb_build_object(
    'cancelled_reason', 'arab_provider_identity_not_proven',
    'hidden', true
  ),
  completed_at = coalesce(completed_at, now())
WHERE label IN (
  'الدفعة الأولى - إسطنبول وغازي عنتاب ومرسين وإزمير - 2026-07-27',
  'الدفعة الثانية - أنقرة وأنطاليا وأضنة وبورصة - 2026-07-30'
);
