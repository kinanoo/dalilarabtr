import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.resolve(root, process.argv[2] ?? '');
const outputPath = path.resolve(root, process.argv[3] ?? '');

if (!process.argv[2] || !process.argv[3]) {
  throw new Error(
    'Usage: node scripts/generate-service-publish-migration.mjs <batch.json> <output.sql>',
  );
}

const batch = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const missingArabEvidence = batch.candidates.filter(
  (candidate) =>
    candidate.arab_provider_confirmed !== true ||
    String(candidate.arab_provider_evidence || '').trim().length < 10,
);
if (missingArabEvidence.length > 0) {
  throw new Error(
    `Refusing to publish candidates without Arab provider evidence: ${missingArabEvidence
      .map((candidate) => candidate.name)
      .join(', ')}`,
  );
}
const expectedCount = batch.candidates.length;
const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`;
const categorySlug = `
      CASE c.candidate_data->>'category'
        WHEN 'مترجم' THEN 'translator'
        WHEN 'طب أسنان' THEN 'dentist'
        WHEN 'محامي' THEN 'lawyer'
        WHEN 'عقارات' THEN 'real-estate'
        ELSE 'service'
      END`;
const sourceCategorySlug = `
    CASE cs.category
      WHEN 'مترجم' THEN 'translator'
      WHEN 'طب أسنان' THEN 'dentist'
      WHEN 'محامي' THEN 'lawyer'
      WHEN 'عقارات' THEN 'real-estate'
      ELSE 'service'
    END`;
const label = sqlString(batch.label);
const sourceLabel = path.relative(root, sourcePath).replaceAll('\\', '/');

const sql = `-- Generated from ${sourceLabel}.
-- Publishes only source-checked candidates that are not already in the directory.

WITH target_batch AS (
  SELECT id
  FROM public.service_import_batches
  WHERE label = ${label}
  ORDER BY created_at DESC
  LIMIT 1
),
publishable AS (
  SELECT
    c.*,
    (
${categorySlug}
      || '-'
      || left(md5(c.fingerprint), 12)
    ) AS provider_slug
  FROM public.service_provider_candidates c
  JOIN target_batch b ON b.id = c.batch_id
  WHERE c.status = 'ready'
    AND c.candidate_data->>'arab_provider_confirmed' = 'true'
    AND length(trim(coalesce(c.candidate_data->>'arab_provider_evidence', ''))) >= 10
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
  WHERE label = ${label}
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
${sourceCategorySlug}
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
  WHERE label = ${label}
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
${categorySlug}
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
  WHERE b.label = ${label}
    AND c.status = 'imported';

  IF imported_count <> ${expectedCount} THEN
    RAISE EXCEPTION
      'Expected ${expectedCount} imported service candidates, found %',
      imported_count;
  END IF;
END $$;

UPDATE public.service_import_batches
SET
  status = 'imported',
  stats = stats || jsonb_build_object(
    'published', ${expectedCount},
    'duplicates', 0,
    'failed', 0
  ),
  completed_at = now()
WHERE label = ${label};
`;

fs.writeFileSync(outputPath, sql, 'utf8');
console.log(
  `Generated ${path.relative(root, outputPath)} with ${expectedCount} candidates.`,
);
