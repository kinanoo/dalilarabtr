-- =====================================================================
-- Service directory scale, verification, and research provenance
-- Safe to run more than once.
-- =====================================================================

ALTER TABLE public.service_providers
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS google_maps_url text,
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS verification_level text NOT NULL DEFAULT 'listed',
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'service_providers_verification_level_check'
  ) THEN
    ALTER TABLE public.service_providers
      ADD CONSTRAINT service_providers_verification_level_check
      CHECK (verification_level IN (
        'listed',
        'source_checked',
        'claimed',
        'credential_verified'
      ));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_providers_directory_city
  ON public.service_providers (status, city);
CREATE INDEX IF NOT EXISTS idx_service_providers_directory_category
  ON public.service_providers (status, category);
CREATE INDEX IF NOT EXISTS idx_service_providers_directory_order
  ON public.service_providers (
    status,
    is_featured DESC,
    is_verified DESC,
    rating DESC,
    created_at DESC
  );
CREATE INDEX IF NOT EXISTS idx_service_providers_phone_digits
  ON public.service_providers (
    regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')
  );

CREATE TABLE IF NOT EXISTS public.service_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  cities text[] NOT NULL DEFAULT '{}'::text[],
  categories text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'researching'
    CHECK (status IN ('researching', 'reviewing', 'ready', 'imported', 'cancelled')),
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.service_provider_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES public.service_import_batches(id) ON DELETE SET NULL,
  fingerprint text NOT NULL UNIQUE,
  candidate_data jsonb NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'needs_review', 'ready', 'rejected', 'imported')),
  confidence smallint NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  duplicate_provider_id uuid REFERENCES public.service_providers(id) ON DELETE SET NULL,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_provider_candidates_batch_status
  ON public.service_provider_candidates (batch_id, status, confidence DESC);

CREATE TABLE IF NOT EXISTS public.service_provider_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  source_type text NOT NULL
    CHECK (source_type IN ('official_website', 'official_registry', 'social_profile', 'maps_discovery', 'provider_submission', 'other')),
  source_url text NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  check_status text NOT NULL DEFAULT 'active'
    CHECK (check_status IN ('active', 'unreachable', 'conflicting', 'removed')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, source_url)
);

CREATE INDEX IF NOT EXISTS idx_service_provider_sources_provider
  ON public.service_provider_sources (provider_id, checked_at DESC);

ALTER TABLE public.service_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_provider_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_provider_sources ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.service_import_batches FROM anon;
REVOKE ALL ON public.service_provider_candidates FROM anon;
REVOKE ALL ON public.service_provider_sources FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_import_batches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_provider_candidates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_provider_sources TO authenticated;

GRANT ALL ON public.service_import_batches TO service_role;
GRANT ALL ON public.service_provider_candidates TO service_role;
GRANT ALL ON public.service_provider_sources TO service_role;

DROP POLICY IF EXISTS "admin_all_service_import_batches" ON public.service_import_batches;
CREATE POLICY "admin_all_service_import_batches"
  ON public.service_import_batches
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_service_provider_candidates" ON public.service_provider_candidates;
CREATE POLICY "admin_all_service_provider_candidates"
  ON public.service_provider_candidates
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_service_provider_sources" ON public.service_provider_sources;
CREATE POLICY "admin_all_service_provider_sources"
  ON public.service_provider_sources
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Public visitors must never read pending/rejected listings directly through REST.
DROP POLICY IF EXISTS "Public Read All" ON public.service_providers;
DROP POLICY IF EXISTS "public_read_service_providers" ON public.service_providers;
DROP POLICY IF EXISTS "Public view approved services" ON public.service_providers;
CREATE POLICY "public_read_approved_service_providers"
  ON public.service_providers
  FOR SELECT
  USING (status = 'approved');

-- Keep the old boolean compatible while the UI moves to explicit levels.
UPDATE public.service_providers
SET verification_level = CASE
  WHEN is_verified = true THEN 'source_checked'
  ELSE 'listed'
END
WHERE verification_level IS NULL OR verification_level = 'listed';

-- Known demo rows must not be presented as real providers.
UPDATE public.service_providers
SET status = 'draft',
    is_verified = false,
    verification_level = 'listed',
    updated_at = now()
WHERE regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')
  IN ('905000000001', '905000000002', '905000000003', '905000000004', '905000000005');
