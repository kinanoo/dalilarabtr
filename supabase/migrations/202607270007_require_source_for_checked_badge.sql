-- A source-checked badge is only valid when its audit source is stored.

UPDATE public.service_providers p
SET
  verification_level = 'listed',
  is_verified = false,
  last_verified_at = NULL,
  updated_at = now()
WHERE p.verification_level = 'source_checked'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_provider_sources s
    WHERE s.provider_id = p.id
      AND s.check_status = 'active'
  );
