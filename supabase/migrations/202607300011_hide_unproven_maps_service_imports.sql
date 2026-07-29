-- Legacy map imports contain businesses discovered from Google Maps without
-- evidence that the provider or business is Arab. Keep the records for audit,
-- but remove them from the public directory until identity is proven.

DO $$
DECLARE
  hidden_count integer;
BEGIN
  UPDATE public.service_providers
  SET
    status = 'rejected',
    active = false,
    is_verified = false,
    verification_level = 'listed',
    updated_at = now()
  WHERE status = 'approved'
    AND description LIKE '%google.com/maps/place%';

  GET DIAGNOSTICS hidden_count = ROW_COUNT;
  IF hidden_count <> 39 THEN
    RAISE EXCEPTION
      'Expected to hide 39 unproven map imports, hid %',
      hidden_count;
  END IF;
END $$;
