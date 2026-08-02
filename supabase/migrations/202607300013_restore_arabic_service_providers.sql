-- Restore providers hidden by the identity-proof restriction.
-- Inclusion now depends on presenting the business or service in Arabic,
-- not on proving the provider's nationality or ethnic identity.

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
  status = 'approved',
  active = true,
  verification_level = 'source_checked',
  is_verified = true,
  updated_at = now()
WHERE p.id IN (SELECT provider_id FROM target_providers);

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
  status = 'imported',
  review_notes = NULL,
  updated_at = now()
WHERE c.batch_id IN (SELECT id FROM target_batches)
  AND c.duplicate_provider_id IS NOT NULL;

UPDATE public.service_import_batches
SET
  status = 'imported',
  stats = (stats - 'cancelled_reason' - 'hidden')
    || jsonb_build_object('restored', true),
  completed_at = coalesce(completed_at, now())
WHERE label IN (
  'الدفعة الأولى - إسطنبول وغازي عنتاب ومرسين وإزمير - 2026-07-27',
  'الدفعة الثانية - أنقرة وأنطاليا وأضنة وبورصة - 2026-07-30'
);

-- Legacy Maps-discovered rows were already public before the restrictive
-- migration. Restore their public status while keeping the unverified badge.
UPDATE public.service_providers
SET
  status = 'approved',
  active = true,
  verification_level = 'listed',
  is_verified = false,
  updated_at = now()
WHERE status = 'rejected'
  AND description LIKE '%google.com/maps/place%';
