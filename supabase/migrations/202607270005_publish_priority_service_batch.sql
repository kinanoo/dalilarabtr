-- Publish the first source-checked batch atomically.
-- Every row is tied to at least one provider-owned source. No Google images,
-- ratings, or reviews are copied into the directory.

WITH target_batch AS (
  SELECT id
  FROM public.service_import_batches
  WHERE label = 'الدفعة الأولى - إسطنبول وغازي عنتاب ومرسين وإزمير - 2026-07-27'
  ORDER BY created_at DESC
  LIMIT 1
),
publishable AS (
  SELECT
    c.*,
    (
      CASE c.candidate_data->>'category'
        WHEN 'مترجم' THEN 'translator'
        WHEN 'طب أسنان' THEN 'dentist'
        WHEN 'محامي' THEN 'lawyer'
        WHEN 'عقارات' THEN 'real-estate'
        ELSE 'service'
      END
      || '-'
      || left(md5(c.fingerprint), 12)
    ) AS provider_slug
  FROM public.service_provider_candidates c
  JOIN target_batch b ON b.id = c.batch_id
  WHERE c.status = 'ready'
    AND NOT EXISTS (
      SELECT 1
      FROM public.service_providers p
      WHERE regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g')
        = regexp_replace(coalesce(c.candidate_data->>'phone', ''), '[^0-9]', '', 'g')
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.service_providers p
      WHERE lower(trim(p.name)) = lower(trim(c.candidate_data->>'name'))
        AND lower(trim(p.city)) = lower(trim(c.candidate_data->>'city'))
    )
)
INSERT INTO public.service_providers (
  slug,
  name,
  profession,
  category,
  city,
  district,
  phone,
  whatsapp,
  description,
  bio,
  address_details,
  image,
  website,
  email,
  google_maps_url,
  languages,
  status,
  active,
  verification_level,
  is_verified,
  last_verified_at,
  updated_at
)
SELECT
  provider_slug,
  candidate_data->>'name',
  candidate_data->>'profession',
  candidate_data->>'category',
  candidate_data->>'city',
  nullif(candidate_data->>'district', ''),
  candidate_data->>'phone',
  nullif(candidate_data->>'whatsapp', ''),
  candidate_data->>'description',
  nullif(candidate_data->>'bio', ''),
  nullif(candidate_data->>'address_details', ''),
  nullif(candidate_data->>'image', ''),
  nullif(candidate_data->>'website', ''),
  nullif(candidate_data->>'email', ''),
  nullif(candidate_data->>'google_maps_url', ''),
  ARRAY(
    SELECT jsonb_array_elements_text(
      coalesce(candidate_data->'languages', '[]'::jsonb)
    )
  ),
  'approved',
  true,
  'source_checked',
  true,
  now(),
  now()
FROM publishable;

WITH target_batch AS (
  SELECT id
  FROM public.service_import_batches
  WHERE label = 'الدفعة الأولى - إسطنبول وغازي عنتاب ومرسين وإزمير - 2026-07-27'
  ORDER BY created_at DESC
  LIMIT 1
),
candidate_sources AS (
  SELECT
    c.id AS candidate_id,
    c.fingerprint,
    c.candidate_data->>'category' AS category,
    source
  FROM public.service_provider_candidates c
  JOIN target_batch b ON b.id = c.batch_id
  CROSS JOIN LATERAL jsonb_array_elements(c.sources) AS source
  WHERE c.status = 'ready'
)
INSERT INTO public.service_provider_sources (
  provider_id,
  source_type,
  source_url,
  checked_at,
  check_status,
  notes
)
SELECT
  p.id,
  source->>'type',
  source->>'url',
  coalesce((source->>'checked_at')::timestamptz, now()),
  'active',
  nullif(source->>'note', '')
FROM candidate_sources cs
JOIN public.service_providers p
  ON p.slug = (
    CASE cs.category
      WHEN 'مترجم' THEN 'translator'
      WHEN 'طب أسنان' THEN 'dentist'
      WHEN 'محامي' THEN 'lawyer'
      WHEN 'عقارات' THEN 'real-estate'
      ELSE 'service'
    END
    || '-'
    || left(md5(cs.fingerprint), 12)
  )
ON CONFLICT (provider_id, source_url) DO UPDATE
SET
  source_type = EXCLUDED.source_type,
  checked_at = EXCLUDED.checked_at,
  check_status = 'active',
  notes = EXCLUDED.notes;

WITH target_batch AS (
  SELECT id
  FROM public.service_import_batches
  WHERE label = 'الدفعة الأولى - إسطنبول وغازي عنتاب ومرسين وإزمير - 2026-07-27'
  ORDER BY created_at DESC
  LIMIT 1
)
UPDATE public.service_provider_candidates c
SET
  status = 'imported',
  duplicate_provider_id = p.id,
  updated_at = now()
FROM target_batch b, public.service_providers p
WHERE c.batch_id = b.id
  AND p.slug = (
      CASE c.candidate_data->>'category'
        WHEN 'مترجم' THEN 'translator'
        WHEN 'طب أسنان' THEN 'dentist'
        WHEN 'محامي' THEN 'lawyer'
        WHEN 'عقارات' THEN 'real-estate'
        ELSE 'service'
      END
      || '-'
      || left(md5(c.fingerprint), 12)
  )
  AND c.status = 'ready';

DO $$
DECLARE
  imported_count integer;
BEGIN
  SELECT count(*)
  INTO imported_count
  FROM public.service_provider_candidates c
  JOIN public.service_import_batches b ON b.id = c.batch_id
  WHERE b.label = 'الدفعة الأولى - إسطنبول وغازي عنتاب ومرسين وإزمير - 2026-07-27'
    AND c.status = 'imported';

  IF imported_count <> 21 THEN
    RAISE EXCEPTION
      'Expected 21 imported service candidates, found %',
      imported_count;
  END IF;
END $$;

UPDATE public.service_import_batches
SET
  status = 'imported',
  stats = stats || jsonb_build_object(
    'published', 21,
    'duplicates', 0,
    'failed', 0
  ),
  completed_at = now()
WHERE label = 'الدفعة الأولى - إسطنبول وغازي عنتاب ومرسين وإزمير - 2026-07-27';
