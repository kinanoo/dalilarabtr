-- Contact and profile fields used by the admin editor and reviewed imports.
-- These are intentionally separate from the first scale migration so the
-- remote migration history remains append-only.

ALTER TABLE public.service_providers
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS address_details text,
  ADD COLUMN IF NOT EXISTS map_location text,
  ADD COLUMN IF NOT EXISTS specialties text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_service_providers_whatsapp_digits
  ON public.service_providers (
    regexp_replace(coalesce(whatsapp, ''), '[^0-9]', '', 'g')
  );
